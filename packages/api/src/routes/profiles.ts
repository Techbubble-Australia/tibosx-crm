import { Router, type IRouter } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { promises as fsp } from "fs";
import { prisma } from "@techbubble/database";
import { objectStorageConfigured, putUploadObject } from "../lib/object-storage";
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "../lib/validation";
import { SALARY_CURRENCIES, SALARY_MODES, parseSalaryRateInput } from "../lib/careers-form";

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
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.candidateProfile.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: rows.map(serializeProfile) });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ data: serializeProfile(row) });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/", async (req, res) => {
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
      },
    });
    res.status(201).json({ data: serializeProfile(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "Failed to create profile" });
  }
});

router.put("/:id", async (req, res) => {
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
      },
    });
    res.json({ data: serializeProfile(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
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
