import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { promises as fsp } from "fs";
import { prisma } from "@techbubble/database";
import { objectStorageConfigured, putUploadObject } from "../lib/object-storage";
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "../lib/validation";
import {
  SALARY_CURRENCIES,
  SALARY_MODES,
  formatSalaryExpectation,
  parseSalaryRateInput,
} from "../lib/careers-form";
import { sendCareerApplicationEmail } from "../lib/mail";

const router: IRouter = Router();

const salaryCurrencyCodes = SALARY_CURRENCIES.map((c) => c.code) as [string, ...string[]];

const careerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  position: z.string().min(1, "Position is required"),
  country: z.string().min(1, "Country is required"),
  visaStatus: z.string().min(1, "Visa status is required"),
  salaryCurrency: z.enum(salaryCurrencyCodes, { message: "Currency is required" }),
  salaryRate: z.coerce.number().int().positive("Salary rate is required"),
  salaryMode: z.enum(SALARY_MODES, { message: "Salary mode is required" }),
  documentUrls: z.array(z.string().min(1)).min(1, "At least one document is required"),
  message: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : String(v)),
    z.string().optional(),
  ),
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
        visaStatus: validatedData.visaStatus,
        salaryCurrency: validatedData.salaryCurrency,
        salaryRate: validatedData.salaryRate,
        salaryMode: validatedData.salaryMode,
        salaryExpectation: validatedData.salaryRate,
        resumeUrl: validatedData.documentUrls[0],
        documentUrls: validatedData.documentUrls,
        message: validatedData.message,
      },
    });

    try {
      await sendCareerApplicationEmail({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        position: validatedData.position,
        country: validatedData.country,
        visaStatus: validatedData.visaStatus,
        salaryExpectationLabel,
        documentUrls: validatedData.documentUrls,
        message: validatedData.message,
      });
    } catch (emailError) {
      console.error("Error sending career application email:", emailError);
      return res.status(500).json({
        error: "Your application was saved but we could not notify HR. Please contact hr@techbubble.com.au directly.",
        data: { id: application.id },
      });
    }

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

// Admin: list all career applications
router.get("/admin/applications", async (req, res) => {
  try {
    const applications = await prisma.careerApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: applications });
  } catch (error) {
    console.error("Error fetching career applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
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
