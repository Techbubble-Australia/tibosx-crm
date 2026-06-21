import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(120),
  order: z.number().int().default(0),
});

const subcategorySchema = z.object({
  name: z.string().min(1).max(120),
  order: z.number().int().default(0),
});

// Public: list categories with subcategories
router.get("/", async (_req, res) => {
  try {
    const categories = await prisma.caseStudyCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        subcategories: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      },
    });
    res.json({ data: categories });
  } catch (error) {
    console.error("Error fetching case study categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Admin: create category
router.post("/", async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.caseStudyCategory.create({ data });
    res.status(201).json({ data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating case study category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Admin: update category
router.put("/:id", async (req, res) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const existing = await prisma.caseStudyCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }
    const category = await prisma.caseStudyCategory.update({
      where: { id: req.params.id },
      data,
    });
    if (data.name && data.name !== existing.name) {
      await prisma.caseStudy.updateMany({
        where: { category: existing.name },
        data: { category: data.name },
      });
    }
    res.json({ data: category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating case study category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Admin: delete category
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.caseStudyCategory.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }
    await prisma.caseStudyCategory.delete({ where: { id: req.params.id } });
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting case study category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Admin: create subcategory
router.post("/:categoryId/subcategories", async (req, res) => {
  try {
    const data = subcategorySchema.parse(req.body);
    const category = await prisma.caseStudyCategory.findUnique({ where: { id: req.params.categoryId } });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const subcategory = await prisma.caseStudySubcategory.create({
      data: { ...data, categoryId: req.params.categoryId },
    });
    res.status(201).json({ data: subcategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating subcategory:", error);
    res.status(500).json({ error: "Failed to create subcategory" });
  }
});

// Admin: update subcategory
router.put("/:categoryId/subcategories/:subId", async (req, res) => {
  try {
    const data = subcategorySchema.partial().parse(req.body);
    const existing = await prisma.caseStudySubcategory.findFirst({
      where: { id: req.params.subId, categoryId: req.params.categoryId },
      include: { category: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Subcategory not found" });
    }
    const subcategory = await prisma.caseStudySubcategory.update({
      where: { id: req.params.subId },
      data,
    });
    if (data.name && data.name !== existing.name) {
      await prisma.caseStudy.updateMany({
        where: { category: existing.category.name, subcategory: existing.name },
        data: { subcategory: data.name },
      });
    }
    res.json({ data: subcategory });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating subcategory:", error);
    res.status(500).json({ error: "Failed to update subcategory" });
  }
});

// Admin: delete subcategory
router.delete("/:categoryId/subcategories/:subId", async (req, res) => {
  try {
    const existing = await prisma.caseStudySubcategory.findFirst({
      where: { id: req.params.subId, categoryId: req.params.categoryId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Subcategory not found" });
    }
    await prisma.caseStudySubcategory.delete({ where: { id: req.params.subId } });
    res.json({ message: "Subcategory deleted" });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ error: "Failed to delete subcategory" });
  }
});

export { router as caseStudyCategoryRoutes };
