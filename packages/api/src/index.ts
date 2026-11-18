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
import { jobCategoryRoutes, jobDepartmentRoutes, jobTechnologyRoutes, jobLevelRoutes } from "./routes/jobTaxonomy";
import { caseStudyCategoryRoutes } from "./routes/caseStudyCategories";
import { teamRoutes } from "./routes/team";
import { testimonialPublicRoutes } from "./routes/testimonials-public";
import { testimonialAdminRoutes } from "./routes/testimonials-admin";
import { faqRoutes } from "./routes/faqs";
import { siteContentPublicRoutes, siteContentAdminRoutes } from "./routes/siteContent";
import { clientRoutes } from "./routes/clients";
import { opportunityRoutes } from "./routes/opportunities";
import { contractRoutes } from "./routes/contracts";
import { profileRoutes } from "./routes/profiles";
import { adminUserRoutes } from "./routes/adminUsers";
import { customerUserRoutes } from "./routes/customerUsers";
import { debugCaptureTicketRoutes } from "./routes/debug-capture-tickets.js";
import { debugPortalAuthRoutes } from "./routes/debug-portal-auth.js";
import { debugPortalTicketRoutes } from "./routes/debug-portal-tickets.js";
import { debugPortalStatusRoutes } from "./routes/debug-portal-statuses.js";
import { debugPortalSprintRoutes } from "./routes/debug-portal-sprints.js";
import { debugPortalAgentRoutes } from "./routes/debug-portal-agent.js";
import { runTimesheetConversionOnStartup } from "./lib/timesheet-weekly-conversion.js";
import { rebuildPersonnelEstimatesOnStartup } from "./lib/project-financials.js";
import { startTimesheetReminderScheduler } from "./lib/timesheet-reminders.js";
import { authMiddleware } from "./middleware/auth";
import { requireMfaEnrolled } from "./middleware/requireMfaEnrolled";
import { requireRole, requireModule, requireAnyModule, blockModuleMutations } from "./middleware/requireRole";
import { assertDevEnvMiddleware } from "./middleware/assertDevEnv.js";
import { devDatabaseRoutes } from "./routes/dev-database.js";
import { dashboardRoutes } from "./routes/dashboard";
import { salesDashboardRoutes } from "./routes/sales-dashboard";
import { projectDashboardRoutes } from "./routes/project-dashboard";
import { memberDashboardRoutes } from "./routes/member-dashboard";
import { credentialTemplateRoutes } from "./routes/credentialTemplates";
import { projectRoutes } from "./routes/projects";
import { timesheetRoutes } from "./routes/timesheets";
import { notificationRoutes } from "./routes/notifications";
import { invoiceRoutes } from "./routes/invoices";
import { clientWorkspaceRoutes } from "./routes/client-workspace";
import { authRoutes as ticketingPortalAuthRoutes } from "./ticketing/routes/auth";
import { ticketRoutes as ticketingTicketRoutes } from "./ticketing/routes/tickets";
import { organizationRoutes as ticketingOrgRoutes } from "./ticketing/routes/organizations";
import { ticketingTimesheetRoutes } from "./ticketing/routes/timesheets";
import { ticketingProfilePhotoRoutes } from "./ticketing/routes/profilePhoto";
import { memberTimesheetRoutes } from "./ticketing/routes/member-timesheets";
import { tbosRoutes as ticketingAdminRoutes } from "./ticketing/routes/tbos";
import { workspaceAuthRoutes } from "./ticketing/routes/workspace-auth";
import { tbosWorkspaceTicketingMiddleware } from "./ticketing/middleware/tbos-workspace";
import { workspaceGroupRoutes } from "./routes/workspaceGroups";
import { createTicketUploadsMiddleware } from "./ticketing/middleware/serve-ticket-uploads";
import { uploadDir as ticketUploadDir } from "./ticketing/lib/upload-storage";

// Load monorepo root `.env` first, then `packages/api/.env` (later files override).
const apiPackageRoot = path.resolve(__dirname, "..");
const monorepoRoot = path.resolve(apiPackageRoot, "..", "..");
dotenv.config({ path: path.join(monorepoRoot, ".env") });
dotenv.config({ path: path.join(apiPackageRoot, ".env") });
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
const absoluteTicketUploadDir = ticketUploadDir();
if (!objectStorageConfigured() && !fs.existsSync(absoluteTicketUploadDir)) {
  fs.mkdirSync(absoluteTicketUploadDir, { recursive: true });
}
app.use("/uploads/tickets", createTicketUploadsMiddleware(absoluteTicketUploadDir));

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
app.use("/api/job-levels", jobLevelRoutes);
app.use("/api/job-departments", jobDepartmentRoutes);
app.use("/api/job-technologies", jobTechnologyRoutes);
app.use("/api/case-study-categories", caseStudyCategoryRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialPublicRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/site-content", siteContentPublicRoutes);

// Protected routes (module-scoped; MFA enrollment required)
const websiteWrite = [authMiddleware, requireMfaEnrolled, blockModuleMutations("website")];
const recruitmentRead = [authMiddleware, requireMfaEnrolled, requireAnyModule("recruitment", "website")];
const recruitmentWrite = [authMiddleware, requireMfaEnrolled, requireAnyModule("recruitment", "website")];

app.use("/api/admin/dashboard", authMiddleware, requireMfaEnrolled, requireModule("recruitment"), dashboardRoutes);

app.use("/api/admin/case-studies", ...websiteWrite, caseStudyPreviewRouter);
app.use("/api/admin/case-studies", ...websiteWrite, caseStudyRoutes);
app.use("/api/admin/jobs", ...recruitmentWrite, jobRoutes);
app.use("/api/admin/job-categories", ...websiteWrite, jobCategoryRoutes);
app.use("/api/admin/job-departments", ...websiteWrite, jobDepartmentRoutes);
app.use("/api/admin/job-levels", ...recruitmentWrite, jobLevelRoutes);
app.use("/api/admin/job-technologies", ...websiteWrite, jobTechnologyRoutes);
app.use("/api/admin/case-study-categories", ...websiteWrite, caseStudyCategoryRoutes);
app.use("/api/admin/team", ...websiteWrite, teamRoutes);
app.use("/api/admin/testimonials", ...websiteWrite, testimonialAdminRoutes);
app.use("/api/admin/faqs", ...websiteWrite, faqRoutes);
app.use("/api/admin/site-content", ...websiteWrite, siteContentAdminRoutes);
app.use("/api/admin/career-applications", authMiddleware, requireMfaEnrolled, requireModule("recruitment"), careerRoutes);
app.use("/api/admin/profiles", authMiddleware, requireMfaEnrolled, requireModule("recruitment"), profileRoutes);
app.use("/api/admin/contact-submissions", authMiddleware, requireMfaEnrolled, requireModule("website"), contactRoutes);
app.use(
  "/api/admin/clients",
  authMiddleware,
  requireMfaEnrolled,
  requireAnyModule("sales", "recruitment"),
  blockModuleMutations("sales"),
  clientRoutes,
);
app.use("/api/admin/opportunities", authMiddleware, requireMfaEnrolled, requireModule("sales"), opportunityRoutes);
app.use("/api/admin/contracts", authMiddleware, requireMfaEnrolled, requireModule("sales"), contractRoutes);
app.use("/api/admin/sales-dashboard", authMiddleware, requireMfaEnrolled, requireModule("sales"), salesDashboardRoutes);
app.use("/api/admin/invoices", authMiddleware, requireMfaEnrolled, requireModule("sales"), invoiceRoutes);
app.use("/api/admin/users", authMiddleware, requireMfaEnrolled, requireRole("admin"), adminUserRoutes);
app.use(
  "/api/admin/customer-users",
  authMiddleware,
  requireMfaEnrolled,
  requireRole("admin"),
  customerUserRoutes,
);
app.use(
  "/api/admin/debug-capture-tickets",
  authMiddleware,
  requireMfaEnrolled,
  assertDevEnvMiddleware,
  debugCaptureTicketRoutes,
);
app.use(
  "/api/admin/dev-database",
  authMiddleware,
  requireMfaEnrolled,
  requireRole("admin"),
  assertDevEnvMiddleware,
  devDatabaseRoutes,
);
app.use("/api/debug-portal/auth", debugPortalAuthRoutes);
// Any TBOS account (internal or customer) may use the debug portal; routes enforce per-ticket access.
app.use("/api/debug-portal/tickets", authMiddleware, debugPortalTicketRoutes);
app.use("/api/debug-portal/statuses", authMiddleware, debugPortalStatusRoutes);
app.use("/api/debug-portal/sprints", authMiddleware, debugPortalSprintRoutes);
app.use("/api/debug-portal/upload", authMiddleware, uploadRoutes);
app.use("/api/debug-portal/agent", assertDevEnvMiddleware, debugPortalAgentRoutes);
app.use(
  "/api/admin/workspace-groups",
  authMiddleware,
  requireMfaEnrolled,
  requireRole("admin"),
  workspaceGroupRoutes,
);
app.use(
  "/api/admin/credential-templates",
  authMiddleware,
  requireMfaEnrolled,
  requireRole("admin"),
  credentialTemplateRoutes,
);
app.use(
  "/api/admin/projects",
  authMiddleware,
  requireMfaEnrolled,
  requireModule("project_management"),
  projectRoutes,
);
app.use(
  "/api/admin/timesheets",
  authMiddleware,
  requireMfaEnrolled,
  requireModule("project_management"),
  timesheetRoutes,
);
app.use(
  "/api/admin/project-dashboard",
  authMiddleware,
  requireMfaEnrolled,
  requireModule("project_management"),
  projectDashboardRoutes,
);
app.use("/api/admin/member-dashboard", authMiddleware, requireMfaEnrolled, memberDashboardRoutes);
// Client users with "Access to client workspace" on their contact (and admins, for any client).
app.use("/api/admin/client-workspace", authMiddleware, requireMfaEnrolled, clientWorkspaceRoutes);
app.use(
  "/api/admin/notifications",
  authMiddleware,
  requireMfaEnrolled,
  requireRole("admin"),
  notificationRoutes,
);
app.use(
  "/api/admin/ticketing",
  authMiddleware,
  requireMfaEnrolled,
  requireAnyModule("sales", "workspace"),
  ticketingAdminRoutes,
);
app.use(
  "/api/admin/workspace",
  authMiddleware,
  requireMfaEnrolled,
  requireModule("workspace"),
  tbosWorkspaceTicketingMiddleware,
);
app.use("/api/admin/workspace/auth", workspaceAuthRoutes);
app.use("/api/admin/workspace/tickets", ticketingTicketRoutes);
app.use("/api/admin/workspace/organizations", ticketingOrgRoutes);
app.use("/api/admin/workspace/timesheets", ticketingTimesheetRoutes);
app.use("/api/admin/workspace/member-timesheets", memberTimesheetRoutes);
app.use("/api/ticketing/auth", ticketingPortalAuthRoutes);
app.use("/api/ticketing/tickets", ticketingTicketRoutes);
app.use("/api/ticketing/organizations", ticketingOrgRoutes);
app.use("/api/ticketing/timesheets", ticketingTimesheetRoutes);
app.use("/api/ticketing/profile", ticketingProfilePhotoRoutes);
app.use("/api/ticketing/member-timesheets", memberTimesheetRoutes);
app.use(
  "/api/upload",
  authMiddleware,
  requireMfaEnrolled,
  requireAnyModule("website", "recruitment", "sales", "project_management", "workspace"),
  uploadRoutes,
);

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
  void runTimesheetConversionOnStartup();
  void rebuildPersonnelEstimatesOnStartup();
  startTimesheetReminderScheduler();
});
