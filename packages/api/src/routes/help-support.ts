import { Router, type IRouter } from "express";
import multer from "multer";
import { z } from "zod";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { requireMfaEnrolled } from "../middleware/requireMfaEnrolled";
import { prisma } from "@techbubble/database";
import { sendHelpAndSupportEmail } from "../lib/mail";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

const bodySchema = z.object({
  topic: z.string().trim().min(1).max(500),
  message: z.string().trim().min(1).max(20000),
});

router.post(
  "/help-support",
  authMiddleware,
  requireMfaEnrolled,
  upload.array("files", 5),
  async (req: AuthRequest, res) => {
    try {
      const u = req.user;
      if (!u) return res.status(401).json({ error: "Unauthorized" });

      const parsed = bodySchema.parse(req.body);
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const attachments = files.map((file) => ({
        filename: file.originalname || "attachment",
        content: file.buffer,
      }));

      const admin = await prisma.adminUser.findUnique({
        where: { id: u.id },
        select: { name: true, email: true },
      });
      const customer = admin
        ? null
        : await prisma.customerUser.findUnique({
            where: { id: u.id },
            select: { name: true, email: true },
          });
      const profile = admin ?? customer;
      const userEmail = profile?.email ?? u.email;
      const userName = profile?.name?.trim() || userEmail;

      const hrEmail = process.env.CAREERS_HR_EMAIL?.trim() || "hr@techbubble.com.au";
      await sendHelpAndSupportEmail({
        to: hrEmail,
        userId: u.id,
        userEmail,
        userName,
        topic: parsed.topic,
        message: parsed.message,
        attachments: attachments.length ? attachments : undefined,
      });

      res.json({
        message:
          "Thank you for your message. A member of the TIBOSX support team will be in touch with you shortly.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Help support error:", error);
      res.status(500).json({ error: "Failed to send your message. Please try again." });
    }
  },
);

export { router as helpSupportRoutes };
