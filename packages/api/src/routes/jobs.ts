import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type JobListing, type Prisma } from "@techbubble/database";
import {
  jobLocationEntrySchema,
  normalizeJobLocations,
  parseJobLocations,
  syncLegacyLocationFields,
} from "../lib/job-locations";
import { JOB_LISTING_TYPES } from "../lib/careers-form";

const router: IRouter = Router();

const jobSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  flag: z.string().min(1).optional(),
  locations: z.array(jobLocationEntrySchema).min(1).optional(),
  type: z.string().min(1),
  listingType: z.enum(JOB_LISTING_TYPES).default("Internal"),
  workMode: z.string().min(1),
  category: z.string().min(1, "Category is required"),
  technology: z.string().min(1, "Technology is required"),
  department: z.string().min(1, "Department is required"),
  clientId: z.string().min(1, "Client is required"),
  description: z.string().max(500_000).default(""),
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});

function prepareJobWriteData(body: z.infer<typeof jobSchema>): Record<string, unknown> {
  const parsedLocations = body.locations ? parseJobLocations(body.locations) : [];
  if (parsedLocations.length > 0) {
    const legacy = syncLegacyLocationFields(parsedLocations);
    return {
      ...body,
      location: legacy.location,
      country: legacy.country,
      flag: legacy.flag,
      locations: parsedLocations,
    };
  }

  const location = body.location?.trim() ?? "";
  const country = body.country?.trim() ?? "";
  const flag = body.flag?.trim() ?? "";
  if (!location || !country || !flag) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Provide at least one location or legacy location, country, and flag",
        path: ["locations"],
      },
    ]);
  }

  const locations = normalizeJobLocations({ location, country, flag });
  return {
    ...body,
    location,
    country,
    flag,
    locations,
  };
}

function serializeJob(job: JobListing, options?: { includeClient?: boolean }) {
  const locations = normalizeJobLocations(job);
  const legacy = syncLegacyLocationFields(locations);
  const { clientId, ...rest } = job;
  const base = {
    ...rest,
    location: legacy.location,
    country: legacy.country,
    flag: legacy.flag,
    locations,
    likeCount: job.likeCount ?? 0,
  };
  if (options?.includeClient) {
    return { ...base, clientId };
  }
  return base;
}

function mergeJobUpdate(
  existing: JobListing,
  data: Partial<z.infer<typeof jobSchema>>,
): z.infer<typeof jobSchema> {
  const merged = { ...existing, ...data } as Record<string, unknown>;
  for (const field of ["category", "department", "technology"] as const) {
    const incoming = data[field];
    if (incoming === "" && existing[field]) {
      merged[field] = existing[field];
    }
  }
  return jobSchema.parse(merged);
}

async function allocateJobReferenceNumber(): Promise<string> {
  const jobs = await prisma.jobListing.findMany({
    select: { referenceNumber: true },
  });
  let max = 0;
  for (const job of jobs) {
    const match = job.referenceNumber.match(/^JRN(\d+)$/i);
    if (match?.[1]) {
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
    res.json({ data: jobs.map((job: JobListing) => serializeJob(job)) });
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
    res.json({ data: jobs.map((job: JobListing) => serializeJob(job, { includeClient: true })) });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Public: like a job (must be before /:slug generic if we use same param - actually POST /:slug/like)
router.post("/:slug/like", async (req, res) => {
  try {
    const visitorKey = (req.body?.visitorKey ?? req.headers["x-visitor-key"]) as string | undefined;
    if (!visitorKey || typeof visitorKey !== "string" || visitorKey.length < 8) {
      return res.status(400).json({ error: "visitorKey is required" });
    }

    const job = await prisma.jobListing.findUnique({ where: { slug: req.params.slug } });
    if (!job || !job.published) {
      return res.status(404).json({ error: "Job not found" });
    }

    const existing = await prisma.jobLike.findUnique({
      where: { jobId_visitorKey: { jobId: job.id, visitorKey } },
    });
    if (existing) {
      return res.json({ data: { likeCount: job.likeCount, alreadyLiked: true } });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.jobLike.create({ data: { jobId: job.id, visitorKey } });
      return tx.jobListing.update({
        where: { id: job.id },
        data: { likeCount: { increment: 1 } },
      });
    });

    res.json({ data: { likeCount: updated.likeCount, alreadyLiked: false } });
  } catch (error) {
    console.error("Error liking job:", error);
    res.status(500).json({ error: "Failed to like job" });
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
    res.json({ data: serializeJob(job) });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Admin: create job
router.post("/", async (req, res) => {
  try {
    const data = jobSchema.parse(req.body);
    const writeData = prepareJobWriteData(data);
    const referenceNumber = await allocateJobReferenceNumber();
    const job = await prisma.jobListing.create({
      data: { ...writeData, referenceNumber } as Prisma.JobListingCreateInput,
    });
    res.status(201).json({ data: serializeJob(job, { includeClient: true }) });
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
    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }
    const merged = mergeJobUpdate(existing, data);
    const writeData = prepareJobWriteData(merged);
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: writeData as Prisma.JobListingUpdateInput,
    });
    res.json({ data: serializeJob(job, { includeClient: true }) });
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
