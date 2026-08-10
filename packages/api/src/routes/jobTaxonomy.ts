import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const nameSchema = z.object({
  name: z.string().min(1).max(120),
  order: z.number().int().default(0),
});

type TaxonomyRow = { id: string; name: string; order: number };

type TaxonomyStore = {
  label: string;
  jobField: "category" | "department" | "technology";
  findMany: () => Promise<TaxonomyRow[]>;
  create: (data: { name: string; order: number }) => Promise<TaxonomyRow>;
  findUnique: (id: string) => Promise<TaxonomyRow | null>;
  update: (id: string, data: { name?: string; order?: number }) => Promise<TaxonomyRow>;
  delete: (id: string) => Promise<void>;
};

function buildTaxonomyRouter(store: TaxonomyStore): IRouter {
  const router: IRouter = Router();

  router.get("/", async (_req, res) => {
    try {
      const items = await store.findMany();
      res.json({ data: items });
    } catch (error) {
      console.error(`Error fetching job ${store.label}:`, error);
      res.status(500).json({ error: `Failed to fetch ${store.label}` });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const data = nameSchema.parse(req.body);
      const item = await store.create(data);
      res.status(201).json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error(`Error creating job ${store.label}:`, error);
      res.status(500).json({ error: `Failed to create ${store.label}` });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const data = nameSchema.partial().parse(req.body);
      const existing = await store.findUnique(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      const item = await store.update(req.params.id, data);
      if (data.name && data.name !== existing.name) {
        await prisma.jobListing.updateMany({
          where: { [store.jobField]: existing.name },
          data: { [store.jobField]: data.name },
        });
      }
      res.json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error(`Error updating job ${store.label}:`, error);
      res.status(500).json({ error: `Failed to update ${store.label}` });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const existing = await store.findUnique(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      await store.delete(req.params.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error(`Error deleting job ${store.label}:`, error);
      res.status(500).json({ error: `Failed to delete ${store.label}` });
    }
  });

  return router;
}

export const jobCategoryRoutes = buildTaxonomyRouter({
  label: "category",
  jobField: "category",
  findMany: () =>
    prisma.jobCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  create: (data) => prisma.jobCategory.create({ data }),
  findUnique: (id) => prisma.jobCategory.findUnique({ where: { id } }),
  update: (id, data) => prisma.jobCategory.update({ where: { id }, data }),
  delete: (id) => prisma.jobCategory.delete({ where: { id } }).then(() => undefined),
});

export const jobDepartmentRoutes = buildTaxonomyRouter({
  label: "department",
  jobField: "department",
  findMany: () =>
    prisma.jobDepartment.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
  create: (data) => prisma.jobDepartment.create({ data }),
  findUnique: (id) => prisma.jobDepartment.findUnique({ where: { id } }),
  update: (id, data) => prisma.jobDepartment.update({ where: { id }, data }),
  delete: (id) => prisma.jobDepartment.delete({ where: { id } }).then(() => undefined),
});

export const jobTechnologyRoutes = (() => {
  const router: IRouter = Router();
  const technologySchema = z.object({
    name: z.string().min(1).max(120),
    categoryId: z.string().min(1),
    order: z.number().int().default(0),
  });

  router.get("/", async (_req, res) => {
    try {
      const items = await prisma.jobTechnology.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { category: { select: { id: true, name: true } } },
      });
      res.json({ data: items });
    } catch (error) {
      console.error("Error fetching job technology:", error);
      res.status(500).json({ error: "Failed to fetch technology" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const data = technologySchema.parse(req.body);
      const category = await prisma.jobCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return res.status(400).json({ error: "Category not found" });
      }
      const item = await prisma.jobTechnology.create({ data });
      res.status(201).json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating job technology:", error);
      res.status(500).json({ error: "Failed to create technology" });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const data = technologySchema.partial().parse(req.body);
      const existing = await prisma.jobTechnology.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      if (data.categoryId) {
        const category = await prisma.jobCategory.findUnique({ where: { id: data.categoryId } });
        if (!category) {
          return res.status(400).json({ error: "Category not found" });
        }
      }
      const item = await prisma.jobTechnology.update({ where: { id: req.params.id }, data });
      if (data.name && data.name !== existing.name) {
        await prisma.jobListing.updateMany({
          where: { technology: existing.name },
          data: { technology: data.name },
        });
      }
      res.json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating job technology:", error);
      res.status(500).json({ error: "Failed to update technology" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const existing = await prisma.jobTechnology.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      await prisma.jobTechnology.delete({ where: { id: req.params.id } });
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error("Error deleting job technology:", error);
      res.status(500).json({ error: "Failed to delete technology" });
    }
  });

  return router;
})();
