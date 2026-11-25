import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const pipelines = await prisma.crmPipeline.findMany({
    where: { tenantId },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return res.json({ data: pipelines });
});

const stageSchema = z.object({
  name: z.string().min(1).max(120),
  stageType: z.enum(["open", "won", "lost"]).default("open"),
  winProbability: z.number().int().min(0).max(100).default(0),
  order: z.number().int().default(0),
  requiredFields: z.array(z.string()).optional().nullable(),
});

const pipelineSchema = z.object({
  name: z.string().min(1).max(120),
  kind: z.string().max(40).default("services"),
  isDefault: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  stages: z.array(stageSchema).optional(),
});

router.post("/", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const parsed = pipelineSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.isDefault) {
    await prisma.crmPipeline.updateMany({
      where: { tenantId },
      data: { isDefault: false },
    });
  }

  const pipeline = await prisma.crmPipeline.create({
    data: {
      tenantId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      isDefault: parsed.data.isDefault ?? false,
      order: parsed.data.order ?? 0,
      active: parsed.data.active ?? true,
      stages: parsed.data.stages?.length
        ? {
            create: parsed.data.stages.map((s, i) => ({
              name: s.name,
              stageType: s.stageType,
              winProbability: s.winProbability,
              order: s.order ?? i,
              requiredFields: s.requiredFields ?? undefined,
            })),
          }
        : undefined,
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  return res.status(201).json({ data: pipeline });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const existing = await prisma.crmPipeline.findFirst({
    where: { id: req.params.id, tenantId },
  });
  if (!existing) return res.status(404).json({ error: "Pipeline not found" });
  const parsed = pipelineSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.isDefault) {
    await prisma.crmPipeline.updateMany({
      where: { tenantId, NOT: { id: existing.id } },
      data: { isDefault: false },
    });
  }

  const pipeline = await prisma.crmPipeline.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      isDefault: parsed.data.isDefault,
      order: parsed.data.order,
      active: parsed.data.active,
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  return res.json({ data: pipeline });
});

router.post("/:id/stages", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const pipeline = await prisma.crmPipeline.findFirst({
    where: { id: req.params.id, tenantId },
  });
  if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });
  const parsed = stageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const stage = await prisma.crmStage.create({
    data: {
      pipelineId: pipeline.id,
      name: parsed.data.name,
      stageType: parsed.data.stageType,
      winProbability: parsed.data.winProbability,
      order: parsed.data.order,
      requiredFields: parsed.data.requiredFields ?? undefined,
    },
  });
  return res.status(201).json({ data: stage });
});

router.put("/stages/:stageId", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const stage = await prisma.crmStage.findFirst({
    where: { id: req.params.stageId, pipeline: { tenantId } },
  });
  if (!stage) return res.status(404).json({ error: "Stage not found" });
  const parsed = stageSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.crmStage.update({
    where: { id: stage.id },
    data: {
      name: parsed.data.name,
      stageType: parsed.data.stageType,
      winProbability: parsed.data.winProbability,
      order: parsed.data.order,
      requiredFields: parsed.data.requiredFields === null ? undefined : parsed.data.requiredFields,
    },
  });
  return res.json({ data: updated });
});

router.delete("/stages/:stageId", async (req: AuthRequest, res) => {
  const tenantId = req.tenant!.tenantId;
  const stage = await prisma.crmStage.findFirst({
    where: { id: req.params.stageId, pipeline: { tenantId } },
    include: { _count: { select: { opportunities: true } } },
  });
  if (!stage) return res.status(404).json({ error: "Stage not found" });
  if (stage._count.opportunities > 0) {
    return res.status(400).json({ error: "Stage has opportunities; move them first" });
  }
  await prisma.crmStage.delete({ where: { id: stage.id } });
  return res.json({ ok: true });
});

export { router as crmPipelineRoutes };
