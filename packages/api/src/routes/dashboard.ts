import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const activeApplicationWhere = {
  OR: [{ jobListing: { published: true } }, { jobListingId: null }],
};

/** Profiles created in the current month and the two before it, counted per sourcing recruiter. */
async function profilesByRecruiter(now = new Date()) {
  const months = [2, 1, 0].map((back) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    return d.toISOString().slice(0, 7);
  });
  const from = new Date(`${months[0]}-01T00:00:00.000Z`);
  const profiles = await prisma.candidateProfile.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true, sourcedById: true, sourcedBy: { select: { name: true, email: true } } },
  });

  const byRecruiter = new Map<string, { recruiterId: string | null; recruiterName: string; counts: number[] }>();
  for (const profile of profiles) {
    const index = months.indexOf(profile.createdAt.toISOString().slice(0, 7));
    if (index < 0) continue;
    const key = profile.sourcedById ?? "unassigned";
    const row = byRecruiter.get(key) ?? {
      recruiterId: profile.sourcedById,
      recruiterName: profile.sourcedBy?.name?.trim() || profile.sourcedBy?.email || "Not assigned",
      counts: months.map(() => 0),
    };
    row.counts[index] = (row.counts[index] ?? 0) + 1;
    byRecruiter.set(key, row);
  }
  const rows = [...byRecruiter.values()]
    .map((row) => ({ ...row, total: row.counts.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total || a.recruiterName.localeCompare(b.recruiterName));
  return { months, rows };
}

router.get("/stats", async (req, res) => {
  try {
    const countryFilter = typeof req.query.country === "string" ? req.query.country.trim() : "";
    const clientFilter = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";

    const [
      profiles,
      activeApplications,
      interviewScheduled,
      awaitingFeedback,
      activeRoles,
      activeJobs,
      clientsWithActiveJobs,
      recruiterStats,
    ] =
      await Promise.all([
        prisma.candidateProfile.findMany({
          select: { technology: true, country: true },
        }),
        prisma.careerApplication.count({ where: activeApplicationWhere }),
        prisma.careerApplication.count({
          where: {
            AND: [{ status: "INTERVIEW_SCHEDULED" }, activeApplicationWhere],
          },
        }),
        prisma.careerApplication.count({
          where: {
            AND: [{ status: "AWAITING_FEEDBACK" }, activeApplicationWhere],
          },
        }),
        prisma.jobListing.count({ where: { published: true } }),
        prisma.jobListing.findMany({
          where: { published: true, ...(clientFilter ? { clientId: clientFilter } : {}) },
          select: {
            id: true,
            title: true,
            clientId: true,
            client: { select: { name: true } },
            applications: { select: { id: true } },
          },
          orderBy: [{ order: "asc" }, { title: "asc" }],
        }),
        prisma.client.findMany({
          where: {
            status: "ACTIVE",
            jobs: { some: { published: true } },
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        profilesByRecruiter(),
      ]);

    const countries = [...new Set(profiles.map((p) => p.country.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );

    const filtered = countryFilter
      ? profiles.filter((p) => p.country.trim().toLowerCase() === countryFilter.toLowerCase())
      : profiles;

    const techCounts = new Map<string, number>();
    for (const profile of filtered) {
      const tech = profile.technology.trim() || "Unknown";
      techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
    }

    const profilesByTechnology = [...techCounts.entries()]
      .map(([technology, count]) => ({ technology, count }))
      .sort((a, b) => b.count - a.count || a.technology.localeCompare(b.technology));

    const applicationsByActiveJob = activeJobs
      .map((job) => ({
        jobId: job.id,
        jobTitle: job.title,
        clientId: job.clientId,
        clientName: job.client.name,
        count: job.applications.length,
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count || a.jobTitle.localeCompare(b.jobTitle));

    res.json({
      data: {
        totalProfiles: profiles.length,
        activeApplications,
        interviewScheduled,
        awaitingFeedback,
        activeRoles,
        countries,
        clients: clientsWithActiveJobs,
        profilesByTechnology,
        applicationsByActiveJob,
        profilesByRecruiter: recruiterStats,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export { router as dashboardRoutes };
