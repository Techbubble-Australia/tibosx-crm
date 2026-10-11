import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "@techbubble/database";
import { authMiddleware, type TicketingRequest } from "../middleware/auth.js";
import { persistUploadedBuffer } from "../../lib/upload-persist.js";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (/\.(jpe?g|png|gif|webp)$/i.test(ext)) return cb(null, true);
    cb(new Error("Only images are allowed"));
  },
});

router.post("/photo", authMiddleware, upload.single("image"), async (req: TicketingRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname);
    const filename = `image-${uniqueSuffix}${ext}`;
    await persistUploadedBuffer(req.file.buffer, filename, req.file.mimetype || "image/jpeg");
    const fileUrl = `/uploads/${filename}`;

    await prisma.ticketingUser.update({
      where: { id: req.ticketingUser!.id },
      data: { profilePhotoUrl: fileUrl },
    });

    res.json({ data: { url: fileUrl } });
  } catch (error) {
    console.error("Ticketing profile photo upload:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export { router as ticketingProfilePhotoRoutes };
