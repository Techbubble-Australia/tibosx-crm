import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type JobListing, type Prisma } from "@techbubble/database";
import {
  jobLocationEntrySchema,
  derivePrimaryCityFromLocations,
  normalizeJobLocations,
  parseJobLocations,
  syncLegacyLocationFields,
} from "../lib/job-locations";
import { JOB_LISTING_TYPES } from "../lib/careers-form";
import { PROFILE_LEVELS } from "../lib/profile-levels";

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
  isHot: z.boolean().optional(),
  city: z.string().max(120).optional().nullable(),
  endClient: z.string().max(200).optional().nullable(),
  order: z.number().int().default(0),
  level: z.enum(PROFILE_LEVELS).default("Developer"),
  publishedDate: z.coerce.date().optional().nullable(),
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
      city: derivePrimaryCityFromLocations(parsedLocations),
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

function parseRecruiterIds(_value: unknown): string[] {
  return [];
}

router.patch("/admin/:id/hot", async (req, res) => {
  try {
    const body = z.object({ isHot: z.boolean() }).parse(req.body);
    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: { isHot: body.isHot },
      include: { client: { select: { name: true } } },
    });
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job hot flag:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

router.patch("/admin/:id/order", async (req, res) => {
  try {
    const body = z.object({ order: z.number().int() }).parse(req.body);
    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: { order: body.order },
      include: { client: { select: { name: true } } },
    });
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job order:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

function serializePublicJob(job: JobListing) {
  const locations = normalizeJobLocations(job);
  const legacy = syncLegacyLocationFields(locations);
  return {
    id: job.id,
    slug: job.slug,
    referenceNumber: job.referenceNumber,
    title: job.title,
    location: legacy.location,
    country: legacy.country,
    flag: legacy.flag,
    locations,
    type: job.type,
    workMode: job.workMode,
    category: job.category,
    technology: job.technology,
    department: job.department,
    description: job.description,
    likeCount: job.likeCount ?? 0,
    published: job.published,
    isHot: job.isHot ?? false,
    order: job.order,
  };
}

function serializeAdminJob(
  job: JobListing & { client?: { name: string } | null },
  applicationCount?: number,
) {
  const locations = normalizeJobLocations(job);
  const legacy = syncLegacyLocationFields(locations);
  return {
    id: job.id,
    slug: job.slug,
    referenceNumber: job.referenceNumber,
    title: job.title,
    location: legacy.location,
    country: legacy.country,
    flag: legacy.flag,
    city: job.city,
    locations,
    type: job.type,
    listingType: job.listingType,
    workMode: job.workMode,
    category: job.category,
    technology: job.technology,
    department: job.department,
    clientId: job.clientId,
    clientName: job.client?.name ?? "",
    endClient: job.endClient ?? "",
    description: job.description,
    likeCount: job.likeCount ?? 0,
    published: job.published,
    isHot: job.isHot ?? false,
    order: job.order,
    level: job.level ?? "Developer",
    publishedDate: job.publishedDate?.toISOString() ?? null,
    applicationCount: applicationCount ?? 0,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
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

async function allocateNextJobOrder(): Promise<number> {
  const result = await prisma.jobListing.aggregate({ _max: { order: true } });
  return (result._max.order ?? 0) + 1;
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
      orderBy: [{ isHot: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    res.json({ data: jobs.map((job: JobListing) => serializePublicJob(job)) });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Admin: list all jobs (including unpublished) — must be before /:slug
router.get("/admin/recruiters", async (_req, res) => {
  try {
    const rows = await prisma.adminUser.findMany({
      where: { active: true, role: { in: ["admin", "recruiter"] } },
      select: { id: true, email: true, role: true, active: true },
      orderBy: { email: "asc" },
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching recruiters:", error);
    res.status(500).json({ error: "Failed to fetch recruiters" });
  }
});

router.get("/admin/next-order", async (_req, res) => {
  try {
    const order = await allocateNextJobOrder();
    res.json({ data: { order } });
  } catch (error) {
    console.error("Error fetching next job order:", error);
    res.status(500).json({ error: "Failed to fetch next order" });
  }
});

router.get("/admin/all", async (_req, res) => {
  try {
    const jobs = await prisma.jobListing.findMany({
      include: { client: { select: { name: true } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    const applicationCounts = await prisma.careerApplication.groupBy({
      by: ["jobListingId"],
      _count: { _all: true },
      where: { jobListingId: { not: null } },
    });
    const countByJobId = new Map<string, number>();
    for (const row of applicationCounts) {
      if (row.jobListingId) {
        countByJobId.set(row.jobListingId, row._count._all);
      }
    }
    const positionCounts = await prisma.careerApplication.groupBy({
      by: ["position"],
      _count: { _all: true },
      where: { jobListingId: null },
    });
    const countByPosition = new Map(positionCounts.map((row) => [row.position.trim().toLowerCase(), row._count._all]));

    res.json({
      data: jobs.map((job: JobListing) => {
        const linked = countByJobId.get(job.id) ?? 0;
        const byTitle = countByPosition.get(job.title.trim().toLowerCase()) ?? 0;
        return serializeAdminJob(job, linked + byTitle);
      }),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/admin/:id/applications", async (req, res) => {
  try {
    const job = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const applications = await prisma.careerApplication.findMany({
      where: {
        OR: [{ jobListingId: job.id }, { jobListingId: null, position: job.title }],
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: applications });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
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
    res.json({ data: serializePublicJob(job) });
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
    const order = data.order && data.order > 0 ? data.order : await allocateNextJobOrder();
    const job = await prisma.jobListing.create({
      data: {
        ...writeData,
        referenceNumber,
        order,
        publishedDate: data.publishedDate ?? new Date(),
        level: data.level ?? "Developer",
      } as Prisma.JobListingCreateInput,
      include: { client: { select: { name: true } } },
    });
    res.status(201).json({ data: serializeAdminJob(job) });
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
      include: { client: { select: { name: true } } },
    });
    res.json({ data: serializeAdminJob(job) });
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
