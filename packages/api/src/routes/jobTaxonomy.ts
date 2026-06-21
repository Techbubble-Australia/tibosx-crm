import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const nameSchema = z.object({
  name: z.string().min(1).max(120),
  order: z.number().int().default(0),
});

function createTaxonomyRouter(model: "jobCategory" | "jobDepartment", jobField: "category" | "department") {
  const router: IRouter = Router();

  router.get("/", async (_req, res) => {
    try {
      const items = await prisma[model].findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
      res.json({ data: items });
    } catch (error) {
      console.error(`Error fetching job ${jobField}:`, error);
      res.status(500).json({ error: `Failed to fetch ${jobField}` });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const data = nameSchema.parse(req.body);
      const item = await prisma[model].create({ data });
      res.status(201).json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error(`Error creating job ${jobField}:`, error);
      res.status(500).json({ error: `Failed to create ${jobField}` });
    }
  });

  router.put("/:id", async (req, res) => {
    try {
      const data = nameSchema.partial().parse(req.body);
      const existing = await prisma[model].findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      const item = await prisma[model].update({
        where: { id: req.params.id },
        data,
      });
      if (data.name && data.name !== existing.name) {
        await prisma.jobListing.updateMany({
          where: { [jobField]: existing.name },
          data: { [jobField]: data.name },
        });
      }
      res.json({ data: item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error(`Error updating job ${jobField}:`, error);
      res.status(500).json({ error: `Failed to update ${jobField}` });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const existing = await prisma[model].findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: "Not found" });
      }
      await prisma[model].delete({ where: { id: req.params.id } });
      res.json({ message: "Deleted" });
    } catch (error) {
      console.error(`Error deleting job ${jobField}:`, error);
      res.status(500).json({ error: `Failed to delete ${jobField}` });
    }
  });

  return router;
}

export const jobCategoryRoutes = createTaxonomyRouter("jobCategory", "category");
export const jobDepartmentRoutes = createTaxonomyRouter("jobDepartment", "department");
