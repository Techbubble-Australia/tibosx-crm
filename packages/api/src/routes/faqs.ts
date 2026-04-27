import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().default("general"),
  order: z.number().int().default(0),
  published: z.boolean().default(true),
});

// Public: list published FAQs
router.get("/", async (req, res) => {
  try {
    const where: { published: boolean; category?: string } = { published: true };
    if (req.query.category) {
      where.category = req.query.category as string;
    }
    const faqs = await prisma.faqItem.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json({ data: faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// Admin: list all FAQs (including unpublished)
router.get("/admin/all", async (req, res) => {
  try {
    const faqs = await prisma.faqItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json({ data: faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// Admin: create FAQ
router.post("/", async (req, res) => {
  try {
    const data = faqSchema.parse(req.body);
    const faq = await prisma.faqItem.create({ data });
    res.status(201).json({ data: faq });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating FAQ:", error);
    res.status(500).json({ error: "Failed to create FAQ" });
  }
});

// Admin: update FAQ
router.put("/:id", async (req, res) => {
  try {
    const data = faqSchema.partial().parse(req.body);
    const faq = await prisma.faqItem.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ data: faq });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating FAQ:", error);
    res.status(500).json({ error: "Failed to update FAQ" });
  }
});

// Admin: delete FAQ
router.delete("/:id", async (req, res) => {
  try {
    await prisma.faqItem.delete({ where: { id: req.params.id } });
    res.json({ message: "FAQ deleted" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});

export { router as faqRoutes };
