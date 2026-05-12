import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const publicRouter: IRouter = Router();
const adminRouter: IRouter = Router();

const upsertSchema = z.object({
  label: z.string().optional(),
  payload: z.unknown(),
});

/** Public: single document by key (e.g. marketing_home) */
publicRouter.get("/:key", async (req, res) => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { key: req.params.key },
    });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    res.set("Cache-Control", "no-store");
    res.json({ data: { key: row.key, label: row.label, payload: row.payload } });
  } catch (error) {
    console.error("Error fetching site content:", error);
    res.status(500).json({ error: "Failed to fetch site content" });
  }
});

/** Admin: list keys */
adminRouter.get("/all", async (_req, res) => {
  try {
    const rows = await prisma.siteContent.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, label: true, updatedAt: true },
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("Error listing site content:", error);
    res.status(500).json({ error: "Failed to list site content" });
  }
});

/** Admin: single document (full payload) */
adminRouter.get("/:key", async (req, res) => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { key: req.params.key },
    });
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ data: row });
  } catch (error) {
    console.error("Error fetching site content:", error);
    res.status(500).json({ error: "Failed to fetch site content" });
  }
});

/** Admin: upsert by key */
adminRouter.put("/:key", async (req, res) => {
  try {
    const body = upsertSchema.parse(req.body);
    const row = await prisma.siteContent.upsert({
      where: { key: req.params.key },
      create: {
        key: req.params.key,
        label: body.label ?? "",
        payload: body.payload as object,
      },
      update: {
        ...(body.label !== undefined ? { label: body.label } : {}),
        payload: body.payload as object,
      },
    });
    res.json({ data: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error saving site content:", error);
    res.status(500).json({ error: "Failed to save site content" });
  }
});

/** Admin: delete by key */
adminRouter.delete("/:key", async (req, res) => {
  try {
    await prisma.siteContent.delete({
      where: { key: req.params.key },
    });
    res.json({ message: "Site content deleted" });
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("Error deleting site content:", error);
    res.status(500).json({ error: "Failed to delete site content" });
  }
});

export { publicRouter as siteContentPublicRoutes, adminRouter as siteContentAdminRoutes };
