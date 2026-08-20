import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const countryFilter = typeof req.query.country === "string" ? req.query.country.trim() : "";
    const clientFilter = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [profiles, applications30d, openRoles, activeJobs, clients] = await Promise.all([
      prisma.candidateProfile.findMany({
        select: { technology: true, country: true },
      }),
      prisma.careerApplication.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
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
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
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
        applications30d,
        openRoles,
        countries,
        clients,
        profilesByTechnology,
        applicationsByActiveJob,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export { router as dashboardRoutes };
