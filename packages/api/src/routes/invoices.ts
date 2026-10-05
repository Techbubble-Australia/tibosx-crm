import { Router, type IRouter } from "express";
import { prisma, type Prisma } from "@techbubble/database";
import { CONTRACT_INVOICE_STATUSES } from "../lib/contract-invoice-status";

const router: IRouter = Router();

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

const SORT_FIELDS = ["dueDate", "issueDate", "invoiceNumber", "clientName", "totalAmount", "status"] as const;
type SortField = (typeof SORT_FIELDS)[number];

router.get("/clients", async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { contracts: { some: { invoices: { some: {} } } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json({ data: clients });
  } catch (error) {
    console.error("Error fetching invoice client filter options:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
    const dueFilter = typeof req.query.due === "string" ? req.query.due.trim() : "";
    const sortByRaw = typeof req.query.sortBy === "string" ? req.query.sortBy.trim() : "dueDate";
    const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";
    const sortBy: SortField = (SORT_FIELDS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as SortField)
      : "dueDate";

    const where: Prisma.ContractInvoiceWhereInput = {};
    if (status && (CONTRACT_INVOICE_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (clientId) {
      where.contract = { clientId };
    }

    const today = startOfUtcDay();
    if (dueFilter === "overdue") {
      where.dueDate = { lt: today };
      where.status = "AWAITING_PAYMENT";
    } else if (dueFilter === "due_this_month") {
      where.dueDate = { gte: today, lte: endOfUtcMonth(today) };
    }

    const orderBy: Prisma.ContractInvoiceOrderByWithRelationInput[] =
      sortBy === "clientName"
        ? [{ contract: { client: { name: sortDir } } }]
        : sortBy === "invoiceNumber" || sortBy === "totalAmount" || sortBy === "status"
          ? [{ [sortBy]: sortDir }]
          : [{ [sortBy]: sortDir }];

    const rows = await prisma.contractInvoice.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            clientId: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy,
    });

    res.json({
      data: rows.map((row) => ({
        id: row.id,
        contractId: row.contractId,
        contractNumber: row.contract.contractNumber,
        contractTitle: row.contract.title,
        clientId: row.contract.clientId,
        clientName: row.contract.client.name,
        invoiceNumber: row.invoiceNumber,
        reference: row.reference,
        issueDate: row.issueDate.toISOString(),
        dueDate: row.dueDate.toISOString(),
        status: row.status,
        currency: row.currency,
        description: row.description,
        qty: row.qty,
        rate: toNumber(row.rate),
        amount: toNumber(row.amount),
        taxRate: toNumber(row.taxRate),
        taxAmount: toNumber(row.taxAmount),
        totalAmount: toNumber(row.totalAmount),
        fileUrl: row.fileUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

export { router as invoiceRoutes };
