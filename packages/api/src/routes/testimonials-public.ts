import { Router, type IRouter } from "express";
import { prisma } from "@techbubble/database";

/** Public: published testimonials only (mounted at /api/testimonials). */
const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.set("Cache-Control", "no-store");
    res.json({ data: testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

export { router as testimonialPublicRoutes };
