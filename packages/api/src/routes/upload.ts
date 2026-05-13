import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
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
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    /** Portable path; clients resolve with their public API base (see web `resolveMediaUrl`). */
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Upload resume endpoint
router.post("/resume", upload.single("resume"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: "Resume uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

export { router as uploadRoutes };
