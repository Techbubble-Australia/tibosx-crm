import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createUploadsMiddleware } from "./middleware/serve-uploads";
import { objectStorageConfigured } from "./lib/object-storage";
import { caseStudyRoutes } from "./routes/caseStudies";
import { caseStudyPreviewRouter } from "./routes/caseStudyPreview";
import { contactRoutes } from "./routes/contact";
import { careerRoutes } from "./routes/careers";
import { uploadRoutes } from "./routes/upload";
import { authRoutes } from "./routes/auth";
import { jobRoutes } from "./routes/jobs";
import { jobCategoryRoutes, jobDepartmentRoutes, jobTechnologyRoutes } from "./routes/jobTaxonomy";
import { caseStudyCategoryRoutes } from "./routes/caseStudyCategories";
import { teamRoutes } from "./routes/team";
import { testimonialPublicRoutes } from "./routes/testimonials-public";
import { testimonialAdminRoutes } from "./routes/testimonials-admin";
import { faqRoutes } from "./routes/faqs";
import { siteContentPublicRoutes, siteContentAdminRoutes } from "./routes/siteContent";
import { clientRoutes } from "./routes/clients";
import { adminUserRoutes } from "./routes/adminUsers";
import { authMiddleware } from "./middleware/auth";
import { requireRole, blockViewerMutations } from "./middleware/requireRole";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
const absoluteUploadDir = path.resolve(uploadDir);
if (!objectStorageConfigured() && !fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}
app.use("/uploads", createUploadsMiddleware(absoluteUploadDir));

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
app.use("/api/job-categories", jobCategoryRoutes);
app.use("/api/job-departments", jobDepartmentRoutes);
app.use("/api/job-technologies", jobTechnologyRoutes);
app.use("/api/case-study-categories", caseStudyCategoryRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialPublicRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/site-content", siteContentPublicRoutes);

// Protected routes (admin only)
const adminAuth = [authMiddleware, blockViewerMutations];

app.use("/api/admin/case-studies", ...adminAuth, caseStudyPreviewRouter);
app.use("/api/admin/case-studies", ...adminAuth, caseStudyRoutes);
app.use("/api/admin/jobs", ...adminAuth, jobRoutes);
app.use("/api/admin/job-categories", ...adminAuth, jobCategoryRoutes);
app.use("/api/admin/job-departments", ...adminAuth, jobDepartmentRoutes);
app.use("/api/admin/job-technologies", ...adminAuth, jobTechnologyRoutes);
app.use("/api/admin/case-study-categories", ...adminAuth, caseStudyCategoryRoutes);
app.use("/api/admin/team", ...adminAuth, teamRoutes);
app.use("/api/admin/testimonials", ...adminAuth, testimonialAdminRoutes);
app.use("/api/admin/faqs", ...adminAuth, faqRoutes);
app.use("/api/admin/site-content", ...adminAuth, siteContentAdminRoutes);
app.use("/api/admin/career-applications", authMiddleware, careerRoutes);
app.use("/api/admin/contact-submissions", authMiddleware, contactRoutes);
app.use("/api/admin/clients", authMiddleware, requireRole("admin"), clientRoutes);
app.use("/api/admin/users", authMiddleware, requireRole("admin"), adminUserRoutes);
app.use("/api/upload", ...adminAuth, uploadRoutes);

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
