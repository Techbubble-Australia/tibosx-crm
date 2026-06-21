import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const jobSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  flag: z.string().min(1),
  type: z.string().min(1),
  workMode: z.string().min(1),
  category: z.string().default(""),
  department: z.string().default(""),
  description: z.string().max(500_000).default(""),
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});

async function allocateJobReferenceNumber(): Promise<string> {
  const jobs = await prisma.jobListing.findMany({
    select: { referenceNumber: true },
  });
  let max = 0;
  for (const job of jobs) {
    const match = job.referenceNumber.match(/^JRN(\d+)$/i);
    if (match) {
      max = Math.max(max, parseInt(match[1], 10));
    }
  }
  return `JRN${String(max + 1).padStart(3, "0")}`;
}

// Public: list published jobs
router.get("/", async (_req, res) => {
  try {
    const jobs = await prisma.jobListing.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.json({ data: jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Admin: list all jobs (including unpublished) — must be before /:slug
router.get("/admin/all", async (_req, res) => {
  try {
    const jobs = await prisma.jobListing.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.json({ data: jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Public: single job by slug
router.get("/:slug", async (req, res) => {
  try {
    const job = await prisma.jobListing.findUnique({
      where: { slug: req.params.slug },
    });
    if (!job || !job.published) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ data: job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Admin: create job
router.post("/", async (req, res) => {
  try {
    const data = jobSchema.parse(req.body);
    const referenceNumber = await allocateJobReferenceNumber();
    const job = await prisma.jobListing.create({
      data: { ...data, referenceNumber },
    });
    res.status(201).json({ data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Admin: update job
router.put("/:id", async (req, res) => {
  try {
    const data = jobSchema.partial().parse(req.body);
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ data: job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

// Admin: delete job
router.delete("/:id", async (req, res) => {
  try {
    await prisma.jobListing.delete({ where: { id: req.params.id } });
    res.json({ message: "Job deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export { router as jobRoutes };
