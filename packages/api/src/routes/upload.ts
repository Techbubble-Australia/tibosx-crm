import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { promises as fsp } from "fs";
import { objectStorageConfigured, putUploadObject } from "../lib/object-storage";

const router: IRouter = Router();

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = /\.(jpe?g|png|gif|webp|pdf|doc|docx)$/i.test(ext);
    const mt = (file.mimetype || "").toLowerCase();
    const allowedMt =
      /^image\/(jpe?g|png|gif|webp)$/.test(mt) ||
      mt === "application/pdf" ||
      mt === "application/msword" ||
      mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (allowedExt && allowedMt) {
      return cb(null, true);
    }
    cb(new Error("Only images (JPEG, PNG, GIF, WebP) and documents are allowed"));
  },
});

// Upload image endpoint
router.post("/image", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = makeStoredFilename(req.file.fieldname, req.file.originalname);
    await persistUploadedFile(req.file, filename);

    /** Portable path; clients resolve via same-origin `/uploads/...` (Next proxies to API). */
    const fileUrl = `/uploads/${filename}`;

    res.json({
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    next(error);
  }
});

// Upload resume endpoint
router.post("/resume", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filename = makeStoredFilename(req.file.fieldname, req.file.originalname);
    await persistUploadedFile(req.file, filename);

    const fileUrl = `/uploads/${filename}`;

    res.json({
      message: "Resume uploaded successfully",
      data: {
        url: fileUrl,
        filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    next(error);
  }
});

export { router as uploadRoutes };
