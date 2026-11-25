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

const workspaceSettingSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subdomain: z.string().max(80).optional(),
  dataRegion: z.string().max(40).optional(),
  baseCurrency: z.string().max(10).optional(),
  fiscalYearStarts: z.string().max(40).optional(),
  tax: z.string().max(40).optional(),
});

const putMeSettingsSchema = z.object({
  workspace: workspaceSettingSchema,
});

router.get("/me/settings", async (req: AuthRequest, res) => {
  const tenantId = req.tenant?.tenantId;
  if (!tenantId) return res.status(403).json({ error: "Forbidden" });

  const row = await prisma.tenantSetting.findUnique({
    where: { tenantId_key: { tenantId, key: "workspace" } },
  });
  const stored =
    row?.value && typeof row.value === "object" && !Array.isArray(row.value)
      ? (row.value as Record<string, unknown>)
      : {};

  return res.json({
    data: {
      workspace: {
        name: typeof stored.name === "string" ? stored.name : req.tenant?.tenantName ?? "",
        subdomain:
          typeof stored.subdomain === "string" ? stored.subdomain : req.tenant?.tenantSlug ?? "",
        dataRegion:
          typeof stored.dataRegion === "string" ? stored.dataRegion : req.tenant?.region ?? "au",
        baseCurrency: typeof stored.baseCurrency === "string" ? stored.baseCurrency : "AUD",
        fiscalYearStarts:
          typeof stored.fiscalYearStarts === "string" ? stored.fiscalYearStarts : "July",
        tax: typeof stored.tax === "string" ? stored.tax : "GST 10%",
      },
    },
  });
});

router.put("/me/settings", async (req: AuthRequest, res) => {
  const tenantId = req.tenant?.tenantId;
  if (!tenantId) return res.status(403).json({ error: "Forbidden" });

  const parsed = putMeSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existing = await prisma.tenantSetting.findUnique({
    where: { tenantId_key: { tenantId, key: "workspace" } },
  });
  const prev =
    existing?.value && typeof existing.value === "object" && !Array.isArray(existing.value)
      ? (existing.value as Record<string, unknown>)
      : {};
  const next = { ...prev, ...parsed.data.workspace };

  const row = await prisma.tenantSetting.upsert({
    where: { tenantId_key: { tenantId, key: "workspace" } },
    create: { tenantId, key: "workspace", value: next },
    update: { value: next },
  });

  return res.json({
    data: {
      workspace:
        row.value && typeof row.value === "object" && !Array.isArray(row.value)
          ? row.value
          : next,
    },
  });
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
