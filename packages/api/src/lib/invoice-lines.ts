import { z } from "zod";
import { toNumber } from "./decimal";

export type InvoiceLineItem = { description: string; qty: number; rate: number };
export type InvoiceFile = { name: string; url: string };

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  qty: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
});

export const invoiceFileSchema = z.object({
  name: z.string().trim().min(1).max(300),
  url: z.string().trim().min(1).max(2000),
});

/** Subtotal of all lines (before tax), rounded to cents. */
export function lineItemsSubtotal(lines: InvoiceLineItem[]): number {
  return Math.round(lines.reduce((sum, line) => sum + line.qty * line.rate, 0) * 100) / 100;
}

/** Stored line items, or a single line built from the invoice's own description / qty / rate. */
export function invoiceLineItems(row: {
  lineItems: unknown;
  description: string;
  qty: unknown;
  rate: unknown;
}): InvoiceLineItem[] {
  const parsed = z.array(invoiceLineItemSchema).safeParse(row.lineItems);
  if (parsed.success && parsed.data.length) return parsed.data;
  return [{ description: row.description, qty: toNumber(row.qty as never), rate: toNumber(row.rate as never) }];
}

/** Attached documents, including the older single `fileUrl`. */
export function invoiceFiles(row: { fileUrls: unknown; fileUrl: string | null }): InvoiceFile[] {
  const parsed = z.array(invoiceFileSchema).safeParse(row.fileUrls);
  const files = parsed.success ? parsed.data : [];
  if (row.fileUrl && !files.some((f) => f.url === row.fileUrl)) {
    files.unshift({ name: "Invoice file", url: row.fileUrl });
  }
  return files;
}
