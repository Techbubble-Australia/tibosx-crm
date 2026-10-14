import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, Prisma, type JobListing } from "@techbubble/database";
import {
  jobLocationEntrySchema,
  derivePrimaryCityFromLocations,
  normalizeJobLocations,
  parseJobLocations,
  syncLegacyLocationFields,
} from "../lib/job-locations";
import { JOB_LISTING_TYPES } from "../lib/careers-form";
import { DEFAULT_PROFILE_LEVEL } from "../lib/profile-levels";
import { getJobLevelNames } from "../lib/job-levels";
import { matchProfilesToJob, resolveJobMetaTagsForMatch } from "../lib/job-profile-matching";
import type { AuthRequest } from "../middleware/auth";
import { createCareerApplicationForProfile } from "../lib/profile-to-application";

const router: IRouter = Router();

async function cancelCareerApplicationsForJobListing(jobListingId: string) {
  await prisma.careerApplication.updateMany({
    where: {
      jobListingId,
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    data: { status: "CANCELLED" },
  });
}

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
  budget: z.string().max(500).optional().default(""),
  order: z.number().int().default(0),
  level: z.string().min(1).max(120).default(DEFAULT_PROFILE_LEVEL),
  positionsCount: z.coerce.number().int().min(1).default(1),
  publishedDate: z.coerce.date().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  metaTags: z.array(z.string().min(1).max(80)).optional().default([]),
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

router.patch("/admin/:id/published-date", async (req, res) => {
  try {
    const body = z.object({ publishedDate: z.coerce.date() }).parse(req.body);
    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: { publishedDate: body.publishedDate },
      include: { client: { select: { name: true } } },
    });
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job published date:", error);
    res.status(500).json({ error: "Failed to update published date" });
  }
});

router.patch("/admin/:id/published", async (req, res) => {
  try {
    const body = z.object({ published: z.boolean() }).parse(req.body);
    const jobId = req.params.id;
    if (!jobId) return res.status(400).json({ error: "Invalid id" });
    const existing = await prisma.jobListing.findUnique({ where: { id: jobId } });
    if (!existing) return res.status(404).json({ error: "Job not found" });
    const job = await prisma.jobListing.update({
      where: { id: jobId },
      data: { published: body.published },
      include: { client: { select: { name: true } } },
    });
    if (!body.published && existing.published) {
      await cancelCareerApplicationsForJobListing(jobId);
    }
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job published state:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

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

router.patch("/admin/reorder", async (req, res) => {
  try {
    const body = z.object({ orderedIds: z.array(z.string().min(1)).min(1) }).parse(req.body);
    await prisma.$transaction(
      body.orderedIds.map((id, index) =>
        prisma.jobListing.update({ where: { id }, data: { order: index + 1 } }),
      ),
    );
    res.json({ message: "Reordered" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error reordering jobs:", error);
    res.status(500).json({ error: "Failed to reorder jobs" });
  }
});

router.patch("/admin/:id/list-fields", async (req, res) => {
  try {
    const body = z
      .object({
        clientId: z.string().min(1).optional(),
        technology: z.string().min(1).optional(),
        level: z.string().min(1).optional(),
      })
      .refine((data) => data.clientId || data.technology || data.level, {
        message: "At least one field is required",
      })
      .parse(req.body);

    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: {
        ...(body.clientId ? { clientId: body.clientId } : {}),
        ...(body.technology ? { technology: body.technology } : {}),
        ...(body.level ? { level: body.level } : {}),
      },
      include: { client: { select: { name: true } } },
    });
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job list fields:", error);
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
    level: job.level ?? "Developer",
    positionsCount: job.positionsCount ?? 1,
  };
}

function serializeAdminJob(
  job: JobListing & {
    client?: { name: string } | null;
    opportunity?: { id: string; name: string } | null;
  },
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
    opportunityId: job.opportunityId ?? null,
    opportunityName: job.opportunity?.name ?? "",
    endClient: job.endClient ?? "",
    budget: job.budget ?? "",
    description: job.description,
    likeCount: job.likeCount ?? 0,
    published: job.published,
    isHot: job.isHot ?? false,
    order: job.order,
    level: job.level ?? "Developer",
    positionsCount: job.positionsCount ?? 1,
    publishedDate: job.publishedDate?.toISOString() ?? null,
    metaTags: Array.isArray(job.metaTags) ? job.metaTags : [],
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
  const agg = await prisma.jobListing.aggregate({ _min: { order: true } });
  const minOrder = agg._min.order ?? 1;
  return minOrder - 1;
}

async function allocateDuplicateSlug(sourceSlug: string): Promise<string> {
  const base = sourceSlug.replace(/-copy(-\d+)?$/i, "");
  let candidate = `${base}-copy`;
  let suffix = 2;
  while (await prisma.jobListing.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-copy-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function allocateUniqueSlug(baseSlug: string): Promise<string> {
  const normalized =
    baseSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "") || `job-${Date.now()}`;
  let candidate = normalized;
  let suffix = 2;
  while (await prisma.jobListing.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function buildJobListingCreateData(
  writeData: Record<string, unknown>,
  data: z.infer<typeof jobSchema>,
  extras: {
    slug: string;
    referenceNumber: string;
    order: number;
    publishedDate: Date;
  },
): Prisma.JobListingUncheckedCreateInput {
  return {
    slug: extras.slug,
    referenceNumber: extras.referenceNumber,
    title: String(writeData.title),
    location: String(writeData.location),
    country: String(writeData.country),
    flag: String(writeData.flag),
    locations: (writeData.locations ?? []) as Prisma.InputJsonValue,
    type: String(writeData.type),
    listingType: String(writeData.listingType ?? "Internal"),
    workMode: String(writeData.workMode),
    category: String(writeData.category),
    technology: String(writeData.technology),
    department: String(writeData.department),
    clientId: String(writeData.clientId),
    description: String(writeData.description ?? ""),
    published: Boolean(writeData.published),
    isHot: Boolean(writeData.isHot ?? false),
    city: (writeData.city as string | null | undefined) ?? null,
    endClient: (writeData.endClient as string | null | undefined) ?? null,
    budget: String(writeData.budget ?? ""),
    positionsCount: Number(writeData.positionsCount ?? 1),
    order: extras.order,
    publishedDate: extras.publishedDate,
    level: data.level ?? "Developer",
    opportunityId: data.opportunityId ?? null,
  };
}

function formatJobMutationError(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(", ")
        : "unique field";
      return `A job with this ${target} already exists. Try a different title.`;
    }
    if (error.code === "P2003") {
      return "Invalid client selected. Please choose an active client.";
    }
  }
  if (error instanceof Error) {
    if (error.message.includes("opportunityId")) {
      return "Database is out of date. Please run the latest database migration (prisma migrate deploy).";
    }
    return error.message;
  }
  return fallback;
}

function formatZodJobError(error: z.ZodError): string {
  const first = error.errors[0];
  if (!first) return "Validation error";
  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
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
      where: { active: true, role: { in: ["admin", "recruiter_admin", "recruiter"] } },
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
      include: {
        client: { select: { name: true } },
        opportunity: { select: { id: true, name: true } },
      },
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

router.get("/admin/:id/matching-profiles", async (req, res) => {
  try {
    const job = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: "Job not found" });
    const savedMetaTags = Array.isArray(job.metaTags)
      ? job.metaTags.filter((tag): tag is string => typeof tag === "string")
      : [];
    const metaTags = resolveJobMetaTagsForMatch(
      req.query as Record<string, unknown>,
      savedMetaTags,
    );
    const profiles = await prisma.candidateProfile.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        category: true,
        technology: true,
        level: true,
        comments: true,
        resumeText: true,
      },
    });
    const matches = matchProfilesToJob(
      { country: job.country, locations: job.locations, metaTags },
      profiles,
    );
    res.json({ data: matches });
  } catch (error) {
    console.error("Error matching profiles to job:", error);
    res.status(500).json({ error: "Failed to match profiles" });
  }
});

router.post("/admin/:id/applications/from-profile", async (req: AuthRequest, res) => {
  try {
    const { profileId } = z.object({ profileId: z.string().min(1) }).parse(req.body);
    const job = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const profile = await prisma.candidateProfile.findUnique({ where: { id: profileId } });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const applicationId = await createCareerApplicationForProfile(profileId, job.id, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      city: profile.city,
      expectedRate: profile.expectedRate,
      currency: profile.currency,
      mode: profile.mode,
      documentUrls: profile.documentUrls,
      isCitizen: profile.isCitizen,
      visaStatus: profile.visaStatus,
      relevantExperience: profile.relevantExperience,
    });

    res.status(201).json({ data: { id: applicationId } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message.includes("already linked")) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Error creating application from profile:", error);
    res.status(500).json({ error: "Failed to create application" });
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        createdAt: true,
        profileId: true,
      },
    });
    res.json({
      data: applications.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    });
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
    const allowedLevels = await getJobLevelNames();
    if (!allowedLevels.includes(data.level)) {
      return res.status(400).json({ error: `Invalid level. Choose from: ${allowedLevels.join(", ")}` });
    }
    const writeData = prepareJobWriteData(data);
    const referenceNumber = await allocateJobReferenceNumber();
    const order = await allocateNextJobOrder();
    const slug = await allocateUniqueSlug(data.slug);
    const job = await prisma.jobListing.create({
      data: buildJobListingCreateData(writeData, data, {
        slug,
        referenceNumber,
        order,
        publishedDate: data.publishedDate ?? new Date(),
      }),
      include: {
        client: { select: { name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: formatZodJobError(error), details: error.errors });
    }
    console.error("Error creating job:", error);
    res.status(500).json({ error: formatJobMutationError(error, "Failed to create job") });
  }
});

// Admin: update job
router.put("/:id", async (req, res) => {
  try {
    const partial = jobSchema.partial().parse(req.body);
    const existing = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (partial.level) {
      const allowedLevels = await getJobLevelNames();
      if (!allowedLevels.includes(partial.level)) {
        return res.status(400).json({ error: `Invalid level. Choose from: ${allowedLevels.join(", ")}` });
      }
    }

    const merged = mergeJobUpdate(existing, partial);
    const writeData = prepareJobWriteData(merged);
    const job = await prisma.jobListing.update({
      where: { id: req.params.id },
      data: {
        ...(writeData as Prisma.JobListingUpdateInput),
        level: partial.level ?? merged.level,
        publishedDate:
          partial.publishedDate !== undefined ? partial.publishedDate : existing.publishedDate,
        budget: partial.budget !== undefined ? partial.budget : existing.budget,
      },
      include: {
        client: { select: { name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });
    if (!job.published && existing.published) {
      await cancelCareerApplicationsForJobListing(req.params.id);
    }
    res.json({ data: serializeAdminJob(job) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

// Admin: duplicate job
router.post("/:id/duplicate", async (req, res) => {
  try {
    const source = await prisma.jobListing.findUnique({ where: { id: req.params.id } });
    if (!source) {
      return res.status(404).json({ error: "Job not found" });
    }

    const newSlug = await allocateDuplicateSlug(source.slug);
    const referenceNumber = await allocateJobReferenceNumber();
    const order = await allocateNextJobOrder();

    const job = await prisma.jobListing.create({
      data: {
        slug: newSlug,
        referenceNumber,
        title: `${source.title} (Copy)`,
        location: source.location,
        country: source.country,
        flag: source.flag,
        locations: source.locations ?? undefined,
        type: source.type,
        listingType: source.listingType,
        workMode: source.workMode,
        category: source.category,
        technology: source.technology,
        department: source.department,
        clientId: source.clientId,
        description: source.description,
        published: false,
        isHot: false,
        likeCount: 0,
        order,
        opportunityId: null,
        publishedDate: new Date(),
        level: source.level,
        positionsCount: source.positionsCount,
        city: source.city,
        endClient: source.endClient,
        budget: source.budget,
        recruiterIds: source.recruiterIds ?? undefined,
      },
      include: {
        client: { select: { name: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ data: serializeAdminJob(job) });
  } catch (error) {
    console.error("Error duplicating job:", error);
    res.status(500).json({ error: "Failed to duplicate job" });
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
