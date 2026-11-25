import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const fieldSchema = z.object({
  entityType: z.enum(["client", "contact", "lead", "opportunity"]),
  key: z.string().min(1).max(80).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(120),
  fieldType: z.enum(["text", "number", "date", "select", "boolean"]).default("text"),
  options: z.array(z.string()).optional().nullable(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

router.get("/custom-fields", async (req: AuthRequest, res) => {
  const entityType =
    typeof req.query.entityType === "string" ? req.query.entityType : undefined;
  const fields = await prisma.customFieldDef.findMany({
    where: {
      tenantId: req.tenant!.tenantId,
      ...(entityType ? { entityType } : {}),
    },
    orderBy: [{ entityType: "asc" }, { order: "asc" }],
  });
  return res.json({ data: fields });
});

router.post("/custom-fields", async (req: AuthRequest, res) => {
  const parsed = fieldSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const field = await prisma.customFieldDef.create({
    data: {
      tenantId: req.tenant!.tenantId,
      entityType: parsed.data.entityType,
      key: parsed.data.key,
      label: parsed.data.label,
      fieldType: parsed.data.fieldType,
      options: parsed.data.options ?? undefined,
      required: parsed.data.required ?? false,
      order: parsed.data.order ?? 0,
      active: parsed.data.active ?? true,
    },
  });
  return res.status(201).json({ data: field });
});

router.put("/custom-fields/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.customFieldDef.findFirst({
    where: { id: req.params.id, tenantId: req.tenant!.tenantId },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });
  const parsed = fieldSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const field = await prisma.customFieldDef.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      options: parsed.data.options === null ? undefined : parsed.data.options,
    },
  });
  return res.json({ data: field });
});

router.delete("/custom-fields/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.customFieldDef.findFirst({
    where: { id: req.params.id, tenantId: req.tenant!.tenantId },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });
  await prisma.customFieldDef.delete({ where: { id: existing.id } });
  return res.json({ ok: true });
});

/** CSV import dry-run / commit for clients, leads, opportunities. */
router.post("/import", async (req: AuthRequest, res) => {
  const schema = z.object({
    entity: z.enum(["clients", "leads", "opportunities"]),
    dryRun: z.boolean().default(true),
    rows: z.array(z.record(z.string())).min(1).max(5000),
    columnMap: z.record(z.string()),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tenantId = req.tenant!.tenantId;
  const errors: Array<{ row: number; message: string }> = [];
  const preview: Array<Record<string, string>> = [];

  const mapRow = (row: Record<string, string>) => {
    const out: Record<string, string> = {};
    for (const [target, source] of Object.entries(parsed.data.columnMap)) {
      out[target] = (row[source] ?? "").trim();
    }
    return out;
  };

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const raw = parsed.data.rows[i] ?? {};
    const mapped = mapRow(raw);
    preview.push(mapped);
    if (parsed.data.entity === "clients" && !mapped.name) {
      errors.push({ row: i + 1, message: "name required" });
    }
    if (parsed.data.entity === "leads" && (!mapped.email || !mapped.firstName)) {
      errors.push({ row: i + 1, message: "firstName and email required" });
    }
    if (parsed.data.entity === "opportunities" && (!mapped.name || !mapped.clientName)) {
      errors.push({ row: i + 1, message: "name and clientName required" });
    }
  }

  if (parsed.data.dryRun || errors.length) {
    return res.json({
      data: {
        dryRun: true,
        rowCount: parsed.data.rows.length,
        errorCount: errors.length,
        errors: errors.slice(0, 50),
        preview: preview.slice(0, 20),
      },
    });
  }

  let created = 0;
  if (parsed.data.entity === "clients") {
    for (const mapped of preview) {
      const name = mapped.name ?? "";
      try {
        await prisma.client.create({
          data: {
            tenantId,
            name,
            country: mapped.country || "Australia",
            website: mapped.website || "",
            status: mapped.status === "PROSPECT" ? "PROSPECT" : "ACTIVE",
          },
        });
        created += 1;
      } catch (e: any) {
        errors.push({ row: created + 1, message: e?.message || "create failed" });
      }
    }
  } else if (parsed.data.entity === "leads") {
    for (const mapped of preview) {
      const firstName = mapped.firstName ?? "";
      const email = (mapped.email ?? "").toLowerCase();
      try {
        await prisma.lead.create({
          data: {
            tenantId,
            firstName,
            lastName: mapped.lastName || "",
            email,
            company: mapped.company || null,
            phone: mapped.phone || null,
            source: mapped.source || "import",
            country: mapped.country || null,
          },
        });
        created += 1;
      } catch (e: any) {
        errors.push({ row: created + 1, message: e?.message || "create failed" });
      }
    }
  } else {
    const pipeline = await prisma.crmPipeline.findFirst({
      where: { tenantId, isDefault: true },
      include: { stages: { orderBy: { order: "asc" }, take: 1 } },
    });
    for (const mapped of preview) {
      const oppName = mapped.name ?? "";
      const clientName = mapped.clientName ?? "";
      try {
        let client = await prisma.client.findFirst({
          where: { tenantId, name: clientName },
        });
        if (!client) {
          client = await prisma.client.create({
            data: {
              tenantId,
              name: clientName,
              country: mapped.country || "Australia",
              status: "PROSPECT",
            },
          });
        }
        await prisma.opportunity.create({
          data: {
            tenantId,
            name: oppName,
            clientId: client.id,
            location: mapped.location || client.country || "Australia",
            type: "FIXED_PRICE",
            currency: mapped.currency || "AUD",
            amount: Number(mapped.amount || 0),
            status: "DRAFT",
            pipelineId: pipeline?.id,
            stageId: pipeline?.stages[0]?.id,
            probability: pipeline?.stages[0]?.winProbability ?? 10,
            ownerId: req.user?.id,
          },
        });
        created += 1;
      } catch (e: any) {
        errors.push({ row: created + 1, message: e?.message || "create failed" });
      }
    }
  }

  return res.json({
    data: { dryRun: false, created, errorCount: errors.length, errors: errors.slice(0, 50) },
  });
});

router.get("/export", async (req: AuthRequest, res) => {
  const entity = typeof req.query.entity === "string" ? req.query.entity : "clients";
  const tenantId = req.tenant!.tenantId;
  if (entity === "leads") {
    const rows = await prisma.lead.findMany({ where: { tenantId }, take: 5000 });
    return res.json({
      data: rows.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        company: r.company,
        status: r.status,
        source: r.source,
      })),
    });
  }
  if (entity === "opportunities") {
    const rows = await prisma.opportunity.findMany({
      where: { tenantId },
      include: { client: true, stage: true },
      take: 5000,
    });
    return res.json({
      data: rows.map((r) => ({
        name: r.name,
        clientName: r.client.name,
        amount: Number(r.amount),
        currency: r.currency,
        status: r.status,
        stage: r.stage?.name,
        active: r.active,
      })),
    });
  }
  const rows = await prisma.client.findMany({ where: { tenantId }, take: 5000 });
  return res.json({
    data: rows.map((r) => ({
      name: r.name,
      country: r.country,
      website: r.website,
      status: r.status,
    })),
  });
});

export { router as crmSettingsRoutes };
