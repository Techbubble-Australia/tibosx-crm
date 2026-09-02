import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { promises as fsp } from "fs";
import { prisma } from "@techbubble/database";
import { objectStorageConfigured, putUploadObject } from "../lib/object-storage";
import type { AuthRequest } from "../middleware/auth";
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "../lib/validation";
import { SALARY_CURRENCIES, SALARY_MODES, parseSalaryRateInput } from "../lib/careers-form";
import { linkProfileToJobIfRequested } from "../lib/profile-to-application";
import { computeProfileDuplicateMeta } from "../lib/profile-duplicates";
import { getJobLevelNames } from "../lib/job-levels";

const router: IRouter = Router();

const salaryCurrencyCodes = SALARY_CURRENCIES.map((c) => c.code) as [string, ...string[]];

const profileSchema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  category: z.string().min(1).max(120),
  technology: z.string().min(1).max(120),
  country: z.string().min(1, "Country is required").max(120),
  city: z.string().max(120).optional().nullable(),
  expectedRate: z.coerce.number().int().positive("Expected rate is required"),
  currency: z.enum(salaryCurrencyCodes),
  mode: z.enum(SALARY_MODES),
  documentUrls: z.array(z.string().min(1)).min(1, "At least one document is required"),
  previousSalary: z.coerce.number().int().positive().optional().nullable(),
  comments: z.string().max(5000).optional().nullable(),
  careerApplicationId: z.string().optional().nullable(),
  sourcedById: z.string().optional().nullable(),
  jobListingId: z.string().optional().nullable(),
  isCitizen: z.boolean().default(true),
  visaStatus: z.string().max(200).optional().nullable(),
  level: z.string().min(1).max(120).default("Developer"),
  relevantExperience: z.coerce.number().int().min(0).max(80),
  available: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (!data.isCitizen && !data.visaStatus?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Visa status is required when Citizen is No",
      path: ["visaStatus"],
    });
  }
});

type CareerApplicationWithJob = {
  id: string;
  position: string;
  status: string;
  jobListingId: string | null;
  createdAt: Date;
  jobListing: { title: string; referenceNumber: string; published: boolean } | null;
};

function mapCareerApplication(app: CareerApplicationWithJob) {
  return {
    id: app.id,
    position: app.position,
    status: app.status,
    jobListingId: app.jobListingId,
    jobTitle: app.jobListing?.title ?? null,
    jobReferenceNumber: app.jobListing?.referenceNumber ?? null,
    jobPublished: app.jobListing?.published ?? null,
    createdAt: app.createdAt,
  };
}

async function buildProfileCareerApplications(row: {
  careerApplicationId: string | null;
  careerApplications: CareerApplicationWithJob[];
}) {
  const apps = row.careerApplications.map(mapCareerApplication);
  const seen = new Set(apps.map((app) => app.id));
  if (row.careerApplicationId && !seen.has(row.careerApplicationId)) {
    const legacy = await prisma.careerApplication.findUnique({
      where: { id: row.careerApplicationId },
      include: {
        jobListing: { select: { title: true, referenceNumber: true, published: true } },
      },
    });
    if (legacy) {
      apps.push(mapCareerApplication(legacy));
    }
  }
  return apps;
}

async function assertValidProfileLevel(level: string): Promise<void> {
  const allowed = await getJobLevelNames();
  if (!allowed.includes(level)) {
    throw new z.ZodError([
      {
        code: "custom",
        message: `Invalid level. Choose from: ${allowed.join(", ")}`,
        path: ["level"],
      },
    ]);
  }
}

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
    const allowedExt = /\.(pdf|doc|docx)$/i.test(ext);
    const mt = (file.mimetype || "").toLowerCase();
    const allowedMt =
      mt === "application/pdf" ||
      mt === "application/msword" ||
      mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (allowedExt && allowedMt) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  },
});

function serializeProfile(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string | null;
  category: string;
  technology: string;
  expectedRate: number;
  currency: string;
  mode: string;
  documentUrls: unknown;
  previousSalary: number | null;
  comments: string | null;
  careerApplicationId: string | null;
  sourcedById: string | null;
  sourcedByName: string | null;
  isCitizen: boolean;
  visaStatus: string | null;
  level: string;
  relevantExperience: number;
  available: boolean;
  isDuplicate?: boolean;
  duplicateCount?: number;
  duplicateMatchReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  careerApplications?: Array<{
    id: string;
    position: string;
    status: string;
    jobListingId: string | null;
    jobTitle: string | null;
    jobReferenceNumber: string | null;
    jobPublished: boolean | null;
    createdAt: Date;
  }>;
}) {
  const docs = Array.isArray(row.documentUrls)
    ? row.documentUrls.filter((url): url is string => typeof url === "string")
    : [];

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    country: row.country,
    city: row.city,
    category: row.category,
    technology: row.technology,
    expectedRate: row.expectedRate,
    currency: row.currency,
    mode: row.mode,
    documentUrls: docs,
    previousSalary: row.previousSalary,
    comments: row.comments,
    careerApplicationId: row.careerApplicationId,
    sourcedById: row.sourcedById,
    sourcedByName: row.sourcedByName,
    isCitizen: row.isCitizen ?? true,
    visaStatus: row.visaStatus ?? null,
    level: row.level ?? "Developer",
    relevantExperience: row.relevantExperience ?? 0,
    available: row.available ?? true,
    isDuplicate: row.isDuplicate ?? false,
    duplicateCount: row.duplicateCount ?? 0,
    duplicateMatchReason: row.duplicateMatchReason ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    careerApplications: (row.careerApplications ?? []).map((app) => ({
      id: app.id,
      position: app.position,
      status: app.status,
      jobListingId: app.jobListingId,
      jobTitle: app.jobTitle,
      jobReferenceNumber: app.jobReferenceNumber,
      jobPublished: app.jobPublished,
      createdAt: app.createdAt.toISOString(),
    })),
  };
}

router.get("/meta/sourcers", async (_req, res) => {
  try {
    const rows = await prisma.adminUser.findMany({
      where: { active: true, role: { in: ["admin", "recruiter"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        label: row.name?.trim() || row.email,
        email: row.email,
        role: row.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching sourcers:", error);
    res.status(500).json({ error: "Failed to fetch sourcers" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.candidateProfile.findMany({
      include: { sourcedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const duplicateMeta = computeProfileDuplicateMeta(rows);
    res.json({
      data: rows.map((row) => {
        const meta = duplicateMeta.get(row.id);
        return serializeProfile({
          ...row,
          sourcedByName: row.sourcedBy?.name?.trim() || row.sourcedBy?.email || null,
          isDuplicate: meta?.isDuplicate ?? false,
          duplicateCount: meta?.duplicateCount ?? 0,
          duplicateMatchReason: meta?.duplicateMatchReason ?? null,
        });
      }),
    });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.candidateProfile.findUnique({
      where: { id: req.params.id },
      include: {
        sourcedBy: { select: { name: true, email: true } },
        careerApplications: {
          orderBy: { createdAt: "desc" },
          include: {
            jobListing: { select: { title: true, referenceNumber: true, published: true } },
          },
        },
      },
    });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    const allRows = await prisma.candidateProfile.findMany({
      select: { id: true, email: true, phone: true },
    });
    const meta = computeProfileDuplicateMeta(allRows).get(row.id);
    const careerApplications = await buildProfileCareerApplications(row);
    res.json({
      data: serializeProfile({
        ...row,
        sourcedByName: row.sourcedBy?.name?.trim() || row.sourcedBy?.email || null,
        isDuplicate: meta?.isDuplicate ?? false,
        duplicateCount: meta?.duplicateCount ?? 0,
        duplicateMatchReason: meta?.duplicateMatchReason ?? null,
        careerApplications,
      }),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = { ...req.body };
    if (typeof body.expectedRate === "string") {
      body.expectedRate = parseSalaryRateInput(body.expectedRate);
    }
    if (typeof body.previousSalary === "string") {
      body.previousSalary = parseSalaryRateInput(body.previousSalary);
      if (body.previousSalary <= 0) {
        body.previousSalary = null;
      }
    }
    const data = profileSchema.parse(body);
    await assertValidProfileLevel(data.level);

    let sourcedById = data.sourcedById ?? null;
    if (req.user?.role === "recruiter") {
      sourcedById = req.user.id;
    } else if (req.user?.role !== "admin") {
      sourcedById = req.user?.id ?? sourcedById;
    }

    const row = await prisma.candidateProfile.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city ?? null,
        category: data.category,
        technology: data.technology,
        expectedRate: data.expectedRate,
        currency: data.currency,
        mode: data.mode,
        documentUrls: data.documentUrls,
        previousSalary: data.previousSalary ?? null,
        comments: data.comments ?? null,
        careerApplicationId: data.careerApplicationId ?? null,
        sourcedById,
        isCitizen: data.isCitizen,
        visaStatus: data.isCitizen ? null : data.visaStatus?.trim() ?? null,
        level: data.level,
        relevantExperience: data.relevantExperience,
        available: data.available,
      },
    });

    await linkProfileToJobIfRequested(row, data.jobListingId);

    const refreshed = await prisma.candidateProfile.findUnique({
      where: { id: row.id },
      include: {
        sourcedBy: { select: { name: true, email: true } },
        careerApplications: {
          orderBy: { createdAt: "desc" },
          include: {
            jobListing: { select: { title: true, referenceNumber: true, published: true } },
          },
        },
      },
    });
    const careerApplications = refreshed
      ? await buildProfileCareerApplications(refreshed)
      : [];
    res.status(201).json({
      data: serializeProfile({
        ...(refreshed ?? row),
        sourcedByName:
          refreshed?.sourcedBy?.name?.trim() || refreshed?.sourcedBy?.email || null,
        careerApplications,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const patchSchema = z.object({
      isCitizen: z.boolean().optional(),
      city: z.string().max(120).optional().nullable(),
      country: z.string().min(1).max(120).optional(),
      technology: z.string().min(1).max(120).optional(),
      level: z.string().min(1).max(120).optional(),
      relevantExperience: z.coerce.number().int().min(0).max(80).optional(),
      sourcedById: z.string().nullable().optional(),
      available: z.boolean().optional(),
    });

    const data = patchSchema.parse(req.body);

    let sourcedById = data.sourcedById;
    if (sourcedById !== undefined && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only administrators can change profile ownership" });
    }

    const row = await prisma.candidateProfile.update({
      where: { id: req.params.id },
      data: {
        ...(data.isCitizen !== undefined ? { isCitizen: data.isCitizen } : {}),
        ...(data.isCitizen !== undefined
          ? { visaStatus: data.isCitizen ? null : existing.visaStatus }
          : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.technology !== undefined ? { technology: data.technology } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.relevantExperience !== undefined ? { relevantExperience: data.relevantExperience } : {}),
        ...(sourcedById !== undefined ? { sourcedById } : {}),
        ...(data.available !== undefined ? { available: data.available } : {}),
      },
      include: { sourcedBy: { select: { name: true, email: true } } },
    });

    const allRows = await prisma.candidateProfile.findMany({
      select: { id: true, email: true, phone: true },
    });
    const meta = computeProfileDuplicateMeta(allRows).get(row.id);

    res.json({
      data: serializeProfile({
        ...row,
        sourcedByName: row.sourcedBy?.name?.trim() || row.sourcedBy?.email || null,
        isDuplicate: meta?.isDuplicate ?? false,
        duplicateCount: meta?.duplicateCount ?? 0,
        duplicateMatchReason: meta?.duplicateMatchReason ?? null,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error patching profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const body = { ...req.body };
    if (typeof body.expectedRate === "string") {
      body.expectedRate = parseSalaryRateInput(body.expectedRate);
    }
    if (typeof body.previousSalary === "string") {
      body.previousSalary = parseSalaryRateInput(body.previousSalary);
      if (body.previousSalary <= 0) {
        body.previousSalary = null;
      }
    }
    const data = profileSchema.parse(body);
    await assertValidProfileLevel(data.level);

    let sourcedById = data.sourcedById ?? null;
    if (req.user?.role !== "admin") {
      sourcedById = existing.sourcedById;
    }

    const row = await prisma.candidateProfile.update({
      where: { id: req.params.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city ?? null,
        category: data.category,
        technology: data.technology,
        expectedRate: data.expectedRate,
        currency: data.currency,
        mode: data.mode,
        documentUrls: data.documentUrls,
        previousSalary: data.previousSalary ?? null,
        comments: data.comments ?? null,
        sourcedById,
        isCitizen: data.isCitizen,
        visaStatus: data.isCitizen ? null : data.visaStatus?.trim() ?? null,
        level: data.level,
        relevantExperience: data.relevantExperience,
        available: data.available,
      },
    });

    await linkProfileToJobIfRequested(row, data.jobListingId);

    const refreshed = await prisma.candidateProfile.findUnique({
      where: { id: row.id },
      include: {
        sourcedBy: { select: { name: true, email: true } },
        careerApplications: {
          orderBy: { createdAt: "desc" },
          include: {
            jobListing: { select: { title: true, referenceNumber: true, published: true } },
          },
        },
      },
    });
    const careerApplications = refreshed
      ? await buildProfileCareerApplications(refreshed)
      : [];
    res.json({
      data: serializeProfile({
        ...(refreshed ?? row),
        sourcedByName:
          refreshed?.sourcedBy?.name?.trim() || refreshed?.sourcedBy?.email || null,
        careerApplications,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === "recruiter") {
      return res.status(403).json({ error: "Recruiters cannot delete profiles" });
    }
    await prisma.candidateProfile.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  }
});

router.post(
  "/upload-documents",
  documentUpload.array("documents", 10),
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
          return {
            url: `/uploads/${filename}`,
            filename,
            size: file.size,
            originalName: file.originalname,
          };
        }),
      );

      res.json({
        message: "Documents uploaded successfully",
        data: { files: uploaded },
      });
    } catch (error) {
      console.error("Error uploading profile documents:", error);
      next(error);
    }
  },
);

export { router as profileRoutes };
