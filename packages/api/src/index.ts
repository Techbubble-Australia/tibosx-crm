import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { caseStudyRoutes } from "./routes/caseStudies";
import { caseStudyPreviewRouter } from "./routes/caseStudyPreview";
import { contactRoutes } from "./routes/contact";
import { careerRoutes } from "./routes/careers";
import { uploadRoutes } from "./routes/upload";
import { authRoutes } from "./routes/auth";
import { jobRoutes } from "./routes/jobs";
import { teamRoutes } from "./routes/team";
import { testimonialPublicRoutes } from "./routes/testimonials-public";
import { testimonialAdminRoutes } from "./routes/testimonials-admin";
import { faqRoutes } from "./routes/faqs";
import { siteContentPublicRoutes, siteContentAdminRoutes } from "./routes/siteContent";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const absoluteUploadDir = path.resolve(uploadDir);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}
app.use("/uploads", express.static(absoluteUploadDir));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3002"],
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public routes
app.use("/api/case-studies", caseStudyRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialPublicRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/site-content", siteContentPublicRoutes);

// Protected routes (admin only)
app.use("/api/admin/case-studies", authMiddleware, caseStudyPreviewRouter);
app.use("/api/admin/case-studies", authMiddleware, caseStudyRoutes);
app.use("/api/admin/jobs", authMiddleware, jobRoutes);
app.use("/api/admin/team", authMiddleware, teamRoutes);
app.use("/api/admin/testimonials", authMiddleware, testimonialAdminRoutes);
app.use("/api/admin/faqs", authMiddleware, faqRoutes);
app.use("/api/admin/site-content", authMiddleware, siteContentAdminRoutes);
app.use("/api/admin/career-applications", authMiddleware, careerRoutes);
app.use("/api/admin/contact-submissions", authMiddleware, contactRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const HOST = process.env.HOST || "0.0.0.0";

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 API server listening on http://${HOST}:${PORT}`);
});
