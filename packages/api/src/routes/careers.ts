import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { promises as fsp } from "fs";
import { prisma } from "@techbubble/database";
import type { Prisma } from "@techbubble/database";
import { objectStorageConfigured, putUploadObject } from "../lib/object-storage";
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "../lib/validation";
import {
  SALARY_CURRENCIES,
  SALARY_MODES,
  formatSalaryExpectation,
  parseSalaryRateInput,
} from "../lib/careers-form";
import { createProfileFromCareerApplication } from "../lib/profile-from-application";
import { extractTextFromDocument } from "../lib/resume-text-extract";
import { findDuplicateCareerApplication } from "../lib/career-application-dedup";
import {
  buildJobClientByTitleLookup,
  resolveApplicationClient,
  type JobClientInfo,
} from "../lib/career-application-clients";
import {
  CAREER_APPLICATION_STATUSES,
} from "../lib/career-application-status";
import { sendCareerApplicationEmail } from "../lib/mail";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const salaryCurrencyCodes = SALARY_CURRENCIES.map((c) => c.code) as [string, ...string[]];

const careerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
    position: z.string().min(1, "Position is required"),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    jobListingId: z.string().optional(),
    isCitizen: z.preprocess(
      (v) => v === true || v === "true" || v === "yes" || v === "Yes",
      z.boolean(),
    ).default(true),
    visaStatus: z.string().optional(),
    salaryCurrency: z.enum(salaryCurrencyCodes, { message: "Currency is required" }),
    salaryRate: z.coerce.number().int().positive("Salary rate is required"),
    salaryMode: z.enum(SALARY_MODES, { message: "Salary mode is required" }),
    relevantExperience: z.coerce.number().int().min(0).max(80),
    documentUrls: z.array(z.string().min(1)).min(1, "At least one document is required"),
    message: z.preprocess(
      (v) => (v === null || v === undefined || v === "" ? undefined : String(v)),
      z.string().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (!data.isCitizen && !data.visaStatus?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Visa status is required when not a citizen",
        path: ["visaStatus"],
      });
    }
  });

function makeStoredFilename(fieldname: string, originalname: string): string {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname);
  return `${fieldname}-${uniqueSuffix}${ext}`;
}

async function persistUploadedFile(file: Express.Multer.File, filename: string): Promise<void> {
  const key = `uploads/${filename}`;
  if (objectStorageConfigured()) {
    await putUploadObject({
      key,
      body: file.buffer!,
      contentType: file.mimetype || "application/octet-stream",
    });
    return;
  }

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  await fsp.mkdir(uploadDir, { recursive: true });
  await fsp.writeFile(path.join(uploadDir, filename), file.buffer!);
}

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (/\.(pdf|doc|docx)$/i.test(ext)) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  },
});

function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
      return `${path}${e.message}`;
    })
    .join(". ");
}

router.post("/upload-resume", documentUpload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const filename = makeStoredFilename(req.file.fieldname, req.file.originalname);
    await persistUploadedFile(req.file, filename);
    const fileUrl = `/uploads/${filename}`;
    res.json({
      message: "Document uploaded successfully",
      data: { url: fileUrl, filename, size: req.file.size },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    next(error);
  }
});

router.post(
  "/upload-documents",
  (req, res, next) => {
    documentUpload.array("documents", 10)(req, res, (err) => {
      if (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return res.status(400).json({ error: message });
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files?.length) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const filename = makeStoredFilename(file.fieldname, file.originalname);
          await persistUploadedFile(file, filename);
          const extractedText = await extractTextFromDocument(file.buffer, file.originalname);
          return {
            url: `/uploads/${filename}`,
            filename,
            size: file.size,
            originalName: file.originalname,
            extractedText,
          };
        }),
      );
      const extractedText = uploaded
        .map((file) => file.extractedText)
        .filter(Boolean)
        .join("\n\n");

      res.json({
        message: "Documents uploaded successfully",
        data: { files: uploaded, extractedText },
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      next(error);
    }
  },
);

router.post("/apply", async (req, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.salaryRate === "string") {
      body.salaryRate = parseSalaryRateInput(body.salaryRate);
    }
    const validatedData = careerSchema.parse(body);

    const isDuplicate = await findDuplicateCareerApplication({
      jobListingId: validatedData.jobListingId,
      position: validatedData.position,
      email: validatedData.email,
      phone: validatedData.phone,
    });
    if (isDuplicate) {
      return res.status(409).json({
        error: "You have already applied for this role. Our team will contact you if there are updates.",
      });
    }

    const salaryExpectationLabel = formatSalaryExpectation(
      validatedData.salaryCurrency,
      validatedData.salaryRate,
      validatedData.salaryMode,
    );

    const application = await prisma.careerApplication.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        position: validatedData.position,
        country: validatedData.country,
        city: validatedData.city,
        jobListingId: validatedData.jobListingId ?? null,
        isCitizen: validatedData.isCitizen,
        visaStatus: validatedData.isCitizen ? null : validatedData.visaStatus?.trim() ?? null,
        salaryCurrency: validatedData.salaryCurrency,
        salaryRate: validatedData.salaryRate,
        salaryMode: validatedData.salaryMode,
        salaryExpectation: validatedData.salaryRate,
        resumeUrl: validatedData.documentUrls[0],
        documentUrls: validatedData.documentUrls,
        message: validatedData.message,
        relevantExperience: validatedData.relevantExperience,
      },
    });

    try {
      await createProfileFromCareerApplication(application);
    } catch (profileError) {
      console.error("Error creating profile from career application:", profileError);
    }

    // try {
    //   await sendCareerApplicationEmail({
    //     firstName: validatedData.firstName,
    //     lastName: validatedData.lastName,
    //     email: validatedData.email,
    //     phone: validatedData.phone,
    //     position: validatedData.position,
    //     country: validatedData.country,
    //     visaStatus: validatedData.visaStatus,
    //     salaryExpectationLabel,
    //     documentUrls: validatedData.documentUrls,
    //     message: validatedData.message,
    //   });
    // } catch (emailError) {
    //   console.error("Error sending career application email:", emailError);
    //   return res.status(500).json({
    //     error: "Your application was saved but we could not notify HR. Please contact hr@techbubble.com.au directly.",
    //     data: { id: application.id },
    //   });
    // }

    res.status(201).json({
      message: "Thank you for your application. Our team will review and reach out within 48 hours.",
      data: { id: application.id },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: formatZodError(error),
        details: error.errors,
      });
    }
    console.error("Error saving career application:", error);
    res.status(500).json({ error: "Failed to submit application. Please try again." });
  }
});

router.post("/admin/applications/from-job", async (req: AuthRequest, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.salaryRate === "string") {
      body.salaryRate = parseSalaryRateInput(body.salaryRate);
    }
    const validatedData = careerSchema
      .and(z.object({ jobListingId: z.string().min(1, "Job is required") }))
      .parse(body);

    const job = await prisma.jobListing.findUnique({
      where: { id: validatedData.jobListingId },
      select: { id: true, title: true, country: true },
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const position = job.title;
    const country = job.country?.trim() || validatedData.country;

    const isDuplicate = await findDuplicateCareerApplication({
      jobListingId: job.id,
      position,
      email: validatedData.email,
      phone: validatedData.phone,
    });
    if (isDuplicate) {
      return res.status(409).json({
        error: "This candidate has already applied for this role.",
      });
    }

    const application = await prisma.careerApplication.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        position,
        country,
        city: validatedData.city,
        jobListingId: job.id,
        isCitizen: validatedData.isCitizen,
        visaStatus: validatedData.isCitizen ? null : validatedData.visaStatus?.trim() ?? null,
        salaryCurrency: validatedData.salaryCurrency,
        salaryRate: validatedData.salaryRate,
        salaryMode: validatedData.salaryMode,
        salaryExpectation: validatedData.salaryRate,
        resumeUrl: validatedData.documentUrls[0],
        documentUrls: validatedData.documentUrls,
        message: validatedData.message,
        relevantExperience: validatedData.relevantExperience,
      },
    });

    try {
      await createProfileFromCareerApplication(application, {
        sourcedById: req.user?.id ?? null,
      });
    } catch (profileError) {
      console.error("Error creating profile from career application:", profileError);
      return res.status(500).json({
        error: "Application was saved but profile creation failed. Please try again or create the profile manually.",
        data: { applicationId: application.id },
      });
    }

    res.status(201).json({
      message: "Profile and application created successfully.",
      data: { id: application.id },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: formatZodError(error),
        details: error.errors,
      });
    }
    console.error("Error creating application from job:", error);
    res.status(500).json({ error: "Failed to create application" });
  }
});

async function jobTitlesForListing(jobListingId: string): Promise<string[]> {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobListingId },
    select: { title: true },
  });
  return job?.title ? [job.title] : [];
}

type CareerApplicationWithJob = Prisma.CareerApplicationGetPayload<{
  include: {
    jobListing: {
      select: {
        id: true;
        title: true;
        published: true;
        country: true;
        workMode: true;
        clientId: true;
        client: { select: { name: true } };
      };
    };
    contract: { select: { id: true; contractNumber: true } };
  };
}>;

const careerApplicationAdminInclude = {
  jobListing: {
    select: {
      id: true,
      title: true,
      published: true,
      country: true,
      workMode: true,
      clientId: true,
      client: { select: { name: true } },
    },
  },
  contract: { select: { id: true, contractNumber: true } },
} as const;

function serializeAdminApplication(
  row: CareerApplicationWithJob,
  profileId?: string | null,
  jobClientByTitle?: Map<string, JobClientInfo>,
) {
  const { clientId, clientName } = resolveApplicationClient(row, jobClientByTitle ?? new Map());

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    position: row.position,
    company: row.company,
    country: row.country,
    city: row.city,
    jobListingId: row.jobListingId,
    visaStatus: row.visaStatus,
    salaryCurrency: row.salaryCurrency,
    salaryRate: row.salaryRate,
    salaryMode: row.salaryMode,
    salaryExpectation: row.salaryExpectation,
    resumeUrl: row.resumeUrl,
    documentUrls: row.documentUrls,
    message: row.message,
    isCitizen: row.isCitizen,
    status: row.status,
    interviewScheduledAt: row.interviewScheduledAt?.toISOString() ?? null,
    statusComments: row.statusComments ?? null,
    chargeRate: row.chargeRate ?? "",
    relevantExperience: row.relevantExperience,
    profileId: profileId ?? row.profileId ?? null,
    contractId: row.contractId ?? null,
    contractNumber: row.contract?.contractNumber ?? null,
    createdAt: row.createdAt.toISOString(),
    jobTitle: row.jobListing?.title ?? null,
    jobPublished: row.jobListing?.published ?? null,
    jobCountry: row.jobListing?.country ?? null,
    jobWorkMode: row.jobListing?.workMode ?? null,
    clientName,
    clientId,
  };
}

// Admin: get single career application
router.get("/admin/applications/:id", async (req, res) => {
  try {
    const row = await prisma.careerApplication.findUnique({
      where: { id: req.params.id },
      include: careerApplicationAdminInclude,
    });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    let profileId = row.profileId;
    if (!profileId) {
      const legacy = await prisma.candidateProfile.findUnique({
        where: { careerApplicationId: row.id },
        select: { id: true },
      });
      profileId = legacy?.id ?? null;
    }
    const jobClientByTitle = await buildJobClientByTitleLookup();
    res.json({
      data: serializeAdminApplication(row, profileId, jobClientByTitle),
    });
  } catch (error) {
    console.error("Error fetching career application:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

// Admin: list all career applications
router.get("/admin/applications", async (req, res) => {
  try {
    const publishedParam = typeof req.query.published === "string" ? req.query.published : "";
    const jobListingId = typeof req.query.jobListingId === "string" ? req.query.jobListingId.trim() : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const publishedWhere: Prisma.CareerApplicationWhereInput | undefined =
      publishedParam === "true"
        ? { OR: [{ jobListing: { published: true } }, { jobListingId: null }] }
        : publishedParam === "false"
          ? { jobListing: { published: false } }
          : undefined;

    const jobWhere: Prisma.CareerApplicationWhereInput | undefined = jobListingId
      ? {
          OR: [
            { jobListingId },
            { jobListingId: null, position: { in: await jobTitlesForListing(jobListingId) } },
          ],
        }
      : undefined;

    const statusWhere: Prisma.CareerApplicationWhereInput | undefined =
      statusParam && (CAREER_APPLICATION_STATUSES as readonly string[]).includes(statusParam)
        ? { status: statusParam }
        : undefined;

    const whereParts: Prisma.CareerApplicationWhereInput[] = [];
    if (publishedWhere) whereParts.push(publishedWhere);
    if (jobWhere) whereParts.push(jobWhere);
    if (statusWhere) whereParts.push(statusWhere);
    const where: Prisma.CareerApplicationWhereInput =
      whereParts.length > 1 ? { AND: whereParts } : (whereParts[0] ?? {});

    const publishedFilter =
      publishedParam === "true" ? true : publishedParam === "false" ? false : undefined;
    const jobClientByTitle = await buildJobClientByTitleLookup(publishedFilter);

    const applications = await prisma.careerApplication.findMany({
      where,
      include: careerApplicationAdminInclude,
      orderBy: { createdAt: "desc" },
    });

    const missingProfileIds = applications
      .filter((row) => !row.profileId)
      .map((row) => row.id);
    const legacyProfiles =
      missingProfileIds.length > 0
        ? await prisma.candidateProfile.findMany({
            where: { careerApplicationId: { in: missingProfileIds } },
            select: { id: true, careerApplicationId: true },
          })
        : [];
    const legacyProfileByAppId = new Map(
      legacyProfiles.map((p) => [p.careerApplicationId!, p.id]),
    );

    res.json({
      data: applications.map((row) =>
        serializeAdminApplication(
          row,
          legacyProfileByAppId.get(row.id) ?? row.profileId,
          jobClientByTitle,
        ),
      ),
    });
  } catch (error) {
    console.error("Error fetching career applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.patch("/admin/applications/:id", async (req, res) => {
  try {
    const body = z
      .object({
        status: z.enum(CAREER_APPLICATION_STATUSES).optional(),
        interviewScheduledAt: z.union([z.coerce.date(), z.null()]).optional(),
        statusComments: z.string().optional().nullable(),
        chargeRate: z.string().max(200).optional(),
      })
      .parse(req.body);

    const existing = await prisma.careerApplication.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    const nextStatus = body.status ?? existing.status;
    const isStatusChange = body.status !== undefined && body.status !== existing.status;

    let nextInterview = existing.interviewScheduledAt;
    let nextComments = existing.statusComments;

    if (isStatusChange) {
      if (nextStatus === "INTERVIEW_SCHEDULED") {
        if (!body.interviewScheduledAt) {
          return res.status(400).json({ error: "Interview date and time is required" });
        }
        nextInterview = body.interviewScheduledAt;
        if (body.statusComments !== undefined) {
          nextComments = body.statusComments?.trim() || null;
        }
      } else if (nextStatus === "SELECTED" || nextStatus === "REJECTED" || nextStatus === "CANCELLED") {
        if (!body.statusComments?.trim()) {
          return res.status(400).json({ error: "Comments are required for this status" });
        }
        nextComments = body.statusComments.trim();
      }
    } else {
      if (body.interviewScheduledAt !== undefined) {
        nextInterview = body.interviewScheduledAt;
      }
      if (body.statusComments !== undefined) {
        nextComments = body.statusComments?.trim() || null;
      }
    }

    if (nextStatus === "INTERVIEW_SCHEDULED" && !nextInterview) {
      return res.status(400).json({ error: "Interview date and time is required" });
    }
    if (
      (nextStatus === "REJECTED" || nextStatus === "CANCELLED") &&
      !nextComments?.trim()
    ) {
      return res.status(400).json({ error: "Comments are required for this status" });
    }

    const updated = await prisma.careerApplication.update({
      where: { id: req.params.id },
      data: {
        status: nextStatus,
        interviewScheduledAt: nextInterview,
        statusComments: nextComments,
        ...(body.chargeRate !== undefined ? { chargeRate: body.chargeRate.trim() } : {}),
      },
      include: careerApplicationAdminInclude,
    });

    if (isStatusChange && nextStatus === "SELECTED") {
      const profileId = updated.profileId;
      if (profileId) {
        await prisma.candidateProfile.update({
          where: { id: profileId },
          data: { available: false },
        });
      } else {
        const legacyProfile = await prisma.candidateProfile.findFirst({
          where: { careerApplicationId: updated.id },
          select: { id: true },
        });
        if (legacyProfile) {
          await prisma.candidateProfile.update({
            where: { id: legacyProfile.id },
            data: { available: false },
          });
        }
      }
    }

    res.json({
      data: serializeAdminApplication(updated),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodError(error), details: error.errors });
    }
    console.error("Error updating career application:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
});

router.post("/admin/applications/:id/move", async (req, res) => {
  try {
    const body = z.object({ jobListingId: z.string().min(1) }).parse(req.body);
    const existing = await prisma.careerApplication.findUnique({
      where: { id: req.params.id },
      select: { id: true, jobListingId: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    const job = await prisma.jobListing.findUnique({
      where: { id: body.jobListingId },
      select: {
        id: true,
        title: true,
        published: true,
        country: true,
        workMode: true,
        clientId: true,
        client: { select: { name: true } },
      },
    });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const updated = await prisma.careerApplication.update({
      where: { id: req.params.id },
      data: {
        jobListingId: job.id,
        position: job.title,
      },
      include: careerApplicationAdminInclude,
    });

    res.json({ data: serializeAdminApplication(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error moving career application:", error);
    res.status(500).json({ error: "Failed to move application" });
  }
});

// Admin: delete application
router.delete("/admin/applications/:id", async (req, res) => {
  try {
    await prisma.careerApplication.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Deleted" });
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("Error deleting career application:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export { router as careerRoutes };
