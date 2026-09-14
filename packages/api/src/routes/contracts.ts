import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma, type Prisma } from "@techbubble/database";
import { CONTRACT_STATUSES } from "../lib/contract-status";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_UNITS,
  type ContractType,
} from "../lib/contract-types";

const router: IRouter = Router();

const decimalField = z.coerce.number().nonnegative();

const contractBaseSchema = z.object({
  title: z.string().min(1).max(200),
  clientId: z.string().min(1),
  type: z.enum(CONTRACT_TYPES),
  status: z.enum(CONTRACT_STATUSES).default("DRAFT"),
  startDate: z.coerce.date(),
  endDate: z.union([z.coerce.date(), z.null()]).optional(),
  unit: z.enum(CONTRACT_UNITS).optional().nullable(),
  currency: z.string().min(1).max(8),
  rate: decimalField,
  contractValue: decimalField,
  consumed: decimalField.optional().default(0),
  comments: z.string().max(10000).optional().default(""),
  fileUrls: z.array(z.string().min(1)).optional().default([]),
});

const variationSchema = z.object({
  variationDate: z.coerce.date(),
  comments: z.string().min(1).max(5000),
  unit: z.enum(CONTRACT_UNITS).optional().nullable(),
  rate: decimalField.optional().nullable(),
  variationValue: decimalField.optional(),
});

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function computeRemaining(contractValue: number, totalVariation: number, consumed: number): number {
  return contractValue - totalVariation - consumed;
}

async function allocateContractNumber(): Promise<string> {
  const rows = await prisma.contract.findMany({
    select: { contractNumber: true },
  });
  let max = 0;
  for (const row of rows) {
    const match = row.contractNumber.match(/^CON(\d+)$/i);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
    }
  }
  return `CON${String(max + 1).padStart(3, "0")}`;
}

async function ensureContractClient(clientId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("CLIENT_NOT_FOUND");
  return client;
}

function validateContractPayload(
  data: z.infer<typeof contractBaseSchema>,
  existingStatus?: string,
) {
  if (data.type === "T_AND_M" && !data.unit) {
    throw new Error("UNIT_REQUIRED");
  }
  if (data.type !== "T_AND_M" && data.unit) {
    data.unit = null;
  }
  const status = data.status ?? existingStatus ?? "DRAFT";
  if (status !== "DRAFT" && data.contractValue < 0) {
    throw new Error("CONTRACT_VALUE_REQUIRED");
  }
}

function variationValueForType(
  type: ContractType,
  input: z.infer<typeof variationSchema>,
): number {
  if (type === "T_AND_M") {
    if (!input.unit || input.rate == null) {
      throw new Error("VARIATION_TM_FIELDS_REQUIRED");
    }
    return input.rate;
  }
  if (input.variationValue == null) {
    throw new Error("VARIATION_VALUE_REQUIRED");
  }
  return input.variationValue;
}

function serializeVariation(row: {
  id: string;
  contractId: string;
  variationDate: Date;
  comments: string;
  unit: string | null;
  rate: { toString(): string } | number | null;
  variationValue: { toString(): string } | number;
  createdAt: Date;
}) {
  return {
    id: row.id,
    contractId: row.contractId,
    variationDate: row.variationDate.toISOString(),
    comments: row.comments,
    unit: row.unit,
    rate: row.rate == null ? null : toNumber(row.rate),
    variationValue: toNumber(row.variationValue),
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeContract(row: {
  id: string;
  contractNumber: string;
  title: string;
  clientId: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  unit: string | null;
  currency: string;
  rate: { toString(): string } | number;
  contractValue: { toString(): string } | number;
  totalVariation: { toString(): string } | number;
  consumed: { toString(): string } | number;
  comments: string;
  fileUrls: unknown;
  createdAt: Date;
  updatedAt: Date;
  client?: { id: string; name: string } | null;
  variations?: Array<{
    id: string;
    contractId: string;
    variationDate: Date;
    comments: string;
    unit: string | null;
    rate: { toString(): string } | number | null;
    variationValue: { toString(): string } | number;
    createdAt: Date;
  }>;
}) {
  const type = row.type as keyof typeof CONTRACT_TYPE_LABELS;
  const contractValue = toNumber(row.contractValue);
  const totalVariation = toNumber(row.totalVariation);
  const consumed = toNumber(row.consumed);
  const fileUrls = Array.isArray(row.fileUrls)
    ? row.fileUrls.filter((url): url is string => typeof url === "string")
    : [];

  return {
    id: row.id,
    contractNumber: row.contractNumber,
    title: row.title,
    clientId: row.clientId,
    clientName: row.client?.name ?? "",
    type: row.type,
    typeLabel: CONTRACT_TYPE_LABELS[type] ?? row.type,
    status: row.status,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate?.toISOString() ?? null,
    unit: row.unit,
    currency: row.currency,
    rate: toNumber(row.rate),
    contractValue,
    totalVariation,
    consumed,
    remaining: computeRemaining(contractValue, totalVariation, consumed),
    comments: row.comments,
    fileUrls,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    variations: row.variations?.map(serializeVariation) ?? undefined,
  };
}

const contractInclude = {
  client: { select: { id: true, name: true } },
};

router.get("/", async (req, res) => {
  try {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const where: Prisma.ContractWhereInput = clientId ? { clientId } : {};
    const rows = await prisma.contract.findMany({
      where,
      include: contractInclude,
      orderBy: [{ createdAt: "desc" }],
    });
    res.json({ data: rows.map(serializeContract) });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({ error: "Failed to fetch contracts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        ...contractInclude,
        variations: { orderBy: { variationDate: "desc" } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeContract(row) });
  } catch (error) {
    console.error("Error fetching contract:", error);
    res.status(500).json({ error: "Failed to fetch contract" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = contractBaseSchema.parse(req.body);
    validateContractPayload(data);
    await ensureContractClient(data.clientId);
    const contractNumber = await allocateContractNumber();
    const contractValue = data.type === "T_AND_M" ? 0 : data.contractValue;

    const row = await prisma.contract.create({
      data: {
        contractNumber,
        title: data.title,
        clientId: data.clientId,
        type: data.type,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        unit: data.type === "T_AND_M" ? data.unit : null,
        currency: data.currency,
        rate: data.rate,
        contractValue,
        consumed: data.consumed ?? 0,
        comments: data.comments ?? "",
        fileUrls: data.fileUrls ?? [],
      },
      include: contractInclude,
    });

    res.status(201).json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "UNIT_REQUIRED") {
      return res.status(400).json({ error: "Unit is required for T&M contracts" });
    }
    console.error("Error creating contract:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = contractBaseSchema.partial().parse(req.body);
    const existing = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const nextType = (data.type ?? existing.type) as ContractType;
    const nextStatus = data.status ?? existing.status;
    const merged = {
      title: data.title ?? existing.title,
      clientId: data.clientId ?? existing.clientId,
      type: nextType,
      status: nextStatus,
      startDate: data.startDate ?? existing.startDate,
      endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
      unit: data.unit !== undefined ? data.unit : existing.unit,
      currency: data.currency ?? existing.currency,
      rate: data.rate ?? toNumber(existing.rate),
      contractValue:
        nextStatus !== "DRAFT"
          ? toNumber(existing.contractValue)
          : nextType === "T_AND_M"
            ? 0
            : data.contractValue ?? toNumber(existing.contractValue),
      consumed: data.consumed ?? toNumber(existing.consumed),
      comments: data.comments ?? existing.comments,
      fileUrls:
        data.fileUrls ??
        (Array.isArray(existing.fileUrls)
          ? existing.fileUrls.filter((url): url is string => typeof url === "string")
          : []),
    };

    validateContractPayload(
      {
        ...merged,
        endDate: merged.endDate,
      } as z.infer<typeof contractBaseSchema>,
      existing.status,
    );

    if (data.clientId) await ensureContractClient(data.clientId);

    const row = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        title: merged.title,
        clientId: merged.clientId,
        type: merged.type,
        status: merged.status,
        startDate: merged.startDate,
        endDate: merged.endDate,
        unit: merged.type === "T_AND_M" ? merged.unit : null,
        currency: merged.currency,
        rate: merged.rate,
        contractValue: merged.contractValue,
        consumed: merged.consumed,
        comments: merged.comments,
        fileUrls: merged.fileUrls,
      },
      include: {
        ...contractInclude,
        variations: { orderBy: { variationDate: "desc" } },
      },
    });

    res.json({ data: serializeContract(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "CLIENT_NOT_FOUND") {
      return res.status(400).json({ error: "Client not found" });
    }
    if (error instanceof Error && error.message === "UNIT_REQUIRED") {
      return res.status(400).json({ error: "Unit is required for T&M contracts" });
    }
    console.error("Error updating contract:", error);
    res.status(500).json({ error: "Failed to update contract" });
  }
});

router.post("/:id/variations", async (req, res) => {
  try {
    const input = variationSchema.parse(req.body);
    const contract = await prisma.contract.findUnique({ where: { id: req.params.id } });
    if (!contract) return res.status(404).json({ error: "Not found" });

    const variationValue = variationValueForType(contract.type as ContractType, input);

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.contractVariation.create({
        data: {
          contractId: contract.id,
          variationDate: input.variationDate,
          comments: input.comments.trim(),
          unit: contract.type === "T_AND_M" ? input.unit : null,
          rate: contract.type === "T_AND_M" ? input.rate : null,
          variationValue,
        },
      });
      const nextTotal = toNumber(contract.totalVariation) + variationValue;
      await tx.contract.update({
        where: { id: contract.id },
        data: { totalVariation: nextTotal },
      });
      return created;
    });

    res.status(201).json({ data: serializeVariation(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    if (error instanceof Error && error.message === "VARIATION_TM_FIELDS_REQUIRED") {
      return res.status(400).json({ error: "Unit and rate are required for T&M variations" });
    }
    if (error instanceof Error && error.message === "VARIATION_VALUE_REQUIRED") {
      return res.status(400).json({ error: "Variation value is required" });
    }
    console.error("Error adding contract variation:", error);
    res.status(500).json({ error: "Failed to add variation" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ error: "Failed to delete contract" });
  }
});

export { router as contractRoutes };
