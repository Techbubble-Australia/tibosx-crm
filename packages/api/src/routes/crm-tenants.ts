import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { TENANT_MODULES, type TenantModuleKey } from "../lib/tenant";

const router: IRouter = Router();

router.get("/", async (req: AuthRequest, res) => {
  if (!req.tenant?.isPlatformAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const tenants = await prisma.tenant.findMany({
    include: {
      plan: true,
      modules: true,
      _count: { select: { memberships: true, clients: true } },
    },
    orderBy: { name: "asc" },
  });
  return res.json({
    data: tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      region: t.region,
      active: t.active,
      plan: t.plan ? { id: t.plan.id, name: t.plan.name, slug: t.plan.slug } : null,
      modules: Object.fromEntries(t.modules.map((m) => [m.module, m.enabled])),
      memberCount: t._count.memberships,
      clientCount: t._count.clients,
      createdAt: t.createdAt,
    })),
  });
});

router.get("/me", async (req: AuthRequest, res) => {
  return res.json({ data: req.tenant });
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  region: z.string().min(1).max(20).default("au"),
  planId: z.string().optional().nullable(),
});

router.post("/", async (req: AuthRequest, res) => {
  if (!req.tenant?.isPlatformAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tenant = await prisma.tenant.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      region: parsed.data.region,
      planId: parsed.data.planId ?? undefined,
      modules: {
        create: TENANT_MODULES.map((module) => ({
          module,
          enabled: module === "sales_crm",
        })),
      },
    },
    include: { modules: true, plan: true },
  });
  return res.status(201).json({ data: tenant });
});

const moduleSchema = z.object({
  modules: z.record(z.boolean()),
});

router.put("/:id/modules", async (req: AuthRequest, res) => {
  if (!req.tenant?.isPlatformAdmin && req.params.id !== req.tenant?.tenantId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!req.tenant?.isPlatformAdmin && req.params.id === req.tenant?.tenantId) {
    // tenant admins can toggle their own modules
  }
  const parsed = moduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tenantId = req.params.id as string;
  for (const [module, enabled] of Object.entries(parsed.data.modules)) {
    if (!TENANT_MODULES.includes(module as TenantModuleKey)) continue;
    await prisma.tenantModule.upsert({
      where: { tenantId_module: { tenantId, module } },
      create: { tenantId, module, enabled },
      update: { enabled },
    });
  }
  const modules = await prisma.tenantModule.findMany({ where: { tenantId } });
  return res.json({
    data: Object.fromEntries(modules.map((m) => [m.module, m.enabled])),
  });
});

const viewAsSchema = z.object({
  reason: z.string().max(2000).optional(),
  minutes: z.number().int().min(5).max(60).default(60),
});

router.post("/:id/view-as", async (req: AuthRequest, res) => {
  if (!req.tenant?.isPlatformAdmin || !req.user?.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const parsed = viewAsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });
  const expiresAt = new Date(Date.now() + parsed.data.minutes * 60_000);
  const session = await prisma.supportAccessSession.create({
    data: {
      tenantId: tenant.id,
      adminUserId: req.user.id,
      reason: parsed.data.reason ?? null,
      expiresAt,
    },
  });
  return res.status(201).json({
    data: {
      id: session.id,
      tenantId: tenant.id,
      expiresAt: session.expiresAt,
    },
  });
});

export { router as crmTenantRoutes };
