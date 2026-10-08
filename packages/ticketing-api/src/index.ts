import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { authRoutes } from "./routes/auth.js";
import { ticketRoutes } from "./routes/tickets.js";
import { organizationRoutes } from "./routes/organizations.js";
import { tbosRoutes } from "./routes/tbos.js";
import { objectStorageConfigured } from "./lib/object-storage.js";
import { uploadDir } from "./lib/upload-storage.js";
import { createTicketUploadsMiddleware } from "./middleware/serve-ticket-uploads.js";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
const PORT = Number(process.env.PORT || process.env.TICKETING_API_PORT || 3003);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.TICKETING_ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3004",
        "http://localhost:3002",
      ],
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ticketing-api", timestamp: new Date().toISOString() });
});

const absoluteTicketUploadDir = uploadDir();
if (!objectStorageConfigured() && !fs.existsSync(absoluteTicketUploadDir)) {
  fs.mkdirSync(absoluteTicketUploadDir, { recursive: true });
}
app.use("/uploads/tickets", createTicketUploadsMiddleware(absoluteTicketUploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/tbos", tbosRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/organizations", organizationRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Ticketing API listening on http://${HOST}:${PORT}`);
});
