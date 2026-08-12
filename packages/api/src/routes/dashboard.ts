import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const countryFilter = typeof req.query.country === "string" ? req.query.country.trim() : "";

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [profiles, applications30d, openRoles] = await Promise.all([
      prisma.candidateProfile.findMany({
        select: { technology: true, country: true },
      }),
      prisma.careerApplication.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.jobListing.count({ where: { published: true } }),
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

    res.json({
      data: {
        totalProfiles: profiles.length,
        applications30d,
        openRoles,
        countries,
        profilesByTechnology,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export { router as dashboardRoutes };
