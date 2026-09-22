import { Router, type IRouter } from "express";
import { prisma, type Prisma } from "@techbubble/database";
import { CONTRACT_INVOICE_STATUSES } from "../lib/contract-invoice-status";

const router: IRouter = Router();

function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

router.get("/", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const where: Prisma.ContractInvoiceWhereInput = {};
    if (status && (CONTRACT_INVOICE_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }

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
      orderBy: [{ dueDate: "desc" }],
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
