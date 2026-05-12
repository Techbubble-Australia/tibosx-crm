import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const testimonialSchema = z.object({
  quote: z.string().min(1),
  authorName: z.string().min(1),
  authorTitle: z.string().min(1),
  authorCompany: z.string().min(1),
  authorInitials: z.string().min(1),
  authorImageUrl: z.string().default(""),
  order: z.number().int().default(0),
  published: z.boolean().default(true),
});

/** Admin: list all testimonials (including unpublished). Mounted at /api/admin/testimonials. */
router.get("/all", async (_req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json({ data: testimonials });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = testimonialSchema.parse(req.body);
    const testimonial = await prisma.testimonial.create({ data });
    res.status(201).json({ data: testimonial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating testimonial:", error);
    res.status(500).json({ error: "Failed to create testimonial" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = testimonialSchema.partial().parse(req.body);
    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ data: testimonial });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating testimonial:", error);
    res.status(500).json({ error: "Failed to update testimonial" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ message: "Testimonial deleted" });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

export { router as testimonialAdminRoutes };
