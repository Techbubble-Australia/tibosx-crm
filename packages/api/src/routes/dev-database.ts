import { Router, type IRouter } from "express";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth";
import { assertDevEnvMiddleware } from "../middleware/assertDevEnv.js";

const router: IRouter = Router();

const DEFAULT_PRESERVE_USERS = [
  { email: "jeet@techbubble.com.au", label: "Jeet" },
  { email: "herbert.a@proprly.tech", label: "Herbert" },
  { email: "dhruv@techbubble.com.au", label: "Dhruv" },
] as const;

type CloneJob = {
  id: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  options: {
    preserveDebugTickets: boolean;
    preserveUserEmails: string[];
    overwriteEmails: boolean;
  };
  logs: string[];
  error: string | null;
  startedBy: string | null;
};

let currentJob: CloneJob | null = null;

const cloneBodySchema = z.object({
  confirm: z.literal(true),
  preserveDebugTickets: z.boolean().default(true),
  preserveUserEmails: z.array(z.string().email()).default([...DEFAULT_PRESERVE_USERS.map((u) => u.email)]),
  overwriteEmails: z.boolean().default(true),
});

function appendLog(job: CloneJob, line: string) {
  const text = line.replace(/\u0000/g, "").trimEnd();
  if (!text) return;
  job.logs.push(text);
  if (job.logs.length > 400) job.logs.splice(0, job.logs.length - 400);
}

function resolveCloneScript(): string | null {
  const candidates = [
    join(process.cwd(), "packages/database/scripts/clone-prod-to-dev.ts"),
    join(process.cwd(), "../database/scripts/clone-prod-to-dev.ts"),
    join(__dirname, "../../../database/scripts/clone-prod-to-dev.ts"),
  ];
  return candidates.find((path) => existsSync(path)) ?? null;
}

router.use(assertDevEnvMiddleware);

router.get("/clone-options", (_req, res) => {
  res.json({
    data: {
      available: Boolean(process.env.PROD_DATABASE_URL?.trim() && process.env.DEV_DATABASE_URL?.trim()),
      defaultPreserveUsers: DEFAULT_PRESERVE_USERS,
      currentJob,
    },
  });
});

router.get("/clone-status", (_req, res) => {
  res.json({ data: currentJob });
});

router.post("/clone", async (req: AuthRequest, res) => {
  try {
    if (currentJob?.status === "RUNNING") {
      return res.status(409).json({ error: "A clone is already running", data: currentJob });
    }

    const body = cloneBodySchema.parse(req.body);
    const prodUrl = process.env.PROD_DATABASE_URL?.trim();
    const devUrl = process.env.DEV_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
    if (!prodUrl || !devUrl) {
      return res.status(400).json({
        error:
          "Clone is not configured on this server. PROD_DATABASE_URL and DEV_DATABASE_URL must be set on the development API.",
      });
    }

    const scriptPath = resolveCloneScript();
    if (!scriptPath) {
      return res.status(500).json({ error: "Clone script was not found on this server." });
    }

    const job: CloneJob = {
      id: `clone-${Date.now()}`,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      options: {
        preserveDebugTickets: body.preserveDebugTickets,
        preserveUserEmails: body.preserveUserEmails,
        overwriteEmails: body.overwriteEmails,
      },
      logs: [],
      error: null,
      startedBy: req.user?.email ?? req.user?.id ?? null,
    };
    currentJob = job;

    const child = spawn(
      "pnpm",
      ["exec", "tsx", scriptPath],
      {
        env: {
          ...process.env,
          PROD_DATABASE_URL: prodUrl,
          DEV_DATABASE_URL: devUrl,
          CLONE_PRESERVE_DEBUG: body.preserveDebugTickets ? "1" : "0",
          CLONE_ANONYMIZE_EMAILS: body.overwriteEmails ? "1" : "0",
          CLONE_EMAIL_ALLOWLIST: body.preserveUserEmails.join(","),
        },
        cwd: join(scriptPath, ".."),
      },
    );

    child.stdout?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString("utf8").split(/\r?\n/)) appendLog(job, line);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString("utf8").split(/\r?\n/)) appendLog(job, line);
    });
    child.on("error", (error) => {
      job.status = "FAILED";
      job.error = error.message;
      job.finishedAt = new Date().toISOString();
      appendLog(job, `Failed to start clone: ${error.message}`);
    });
    child.on("close", (code) => {
      job.finishedAt = new Date().toISOString();
      if (code === 0) {
        job.status = "SUCCEEDED";
        appendLog(job, "Clone finished successfully.");
      } else {
        job.status = "FAILED";
        job.error = `Clone exited with code ${code ?? "unknown"}`;
        appendLog(job, job.error);
      }
    });

    res.status(202).json({ data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error starting database clone:", error);
    res.status(500).json({ error: "Failed to start database clone" });
  }
});

export { router as devDatabaseRoutes };
