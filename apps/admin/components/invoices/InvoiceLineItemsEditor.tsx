"use client";

import { Plus, Trash2 } from "lucide-react";

export type InvoiceLineDraft = { description: string; qty: string; rate: string };

export function emptyInvoiceLine(): InvoiceLineDraft {
  return { description: "", qty: "1", rate: "" };
}

export function invoiceLineAmount(line: InvoiceLineDraft): number {
  return (Number.parseFloat(line.qty) || 0) * (Number.parseFloat(line.rate) || 0);
}

export function invoiceLinesSubtotal(lines: InvoiceLineDraft[]): number {
  return lines.reduce((sum, line) => sum + invoiceLineAmount(line), 0);
}

/** Lines ready to send to the API (blank rows dropped). */
export function invoiceLinesPayload(lines: InvoiceLineDraft[]) {
  return lines
    .filter((line) => line.description.trim() || Number.parseFloat(line.rate))
    .map((line) => ({
      description: line.description.trim(),
      qty: Number.parseFloat(line.qty) || 0,
      rate: Number.parseFloat(line.rate) || 0,
    }));
}

/** Returns a message when a line can't be saved, otherwise null. */
export function invoiceLinesProblem(lines: InvoiceLineDraft[]): string | null {
  const payload = invoiceLinesPayload(lines);
  if (!payload.length) return "Add at least one line item.";
  if (payload.some((line) => !line.description)) return "Each line item needs a description.";
  if (payload.some((line) => line.qty <= 0)) return "Each line item needs a quantity above 0.";
  return null;
}

type Props = {
  lines: InvoiceLineDraft[];
  onChange: (lines: InvoiceLineDraft[]) => void;
  currency: string;
  readOnly?: boolean;
};

const cellInput =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 read-only:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function money(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

export function InvoiceLineItemsEditor({ lines, onChange, currency, readOnly = false }: Props) {
  const update = (index: number, patch: Partial<InvoiceLineDraft>) =>
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Line items</label>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => onChange([...lines, emptyInvoiceLine()])}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <Plus className="h-3.5 w-3.5" /> Add line item
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="pb-1 pr-2 font-medium">Description</th>
              <th className="w-24 pb-1 pr-2 font-medium">Qty</th>
              <th className="w-32 pb-1 pr-2 font-medium">Rate</th>
              <th className="w-36 pb-1 pr-2 text-right font-medium">Amount</th>
              {!readOnly ? <th className="w-8 pb-1" /> : null}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="align-top">
                <td className="py-1 pr-2">
                  <input
                    value={line.description}
                    onChange={(e) => update(index, { description: e.target.value })}
                    readOnly={readOnly}
                    placeholder="e.g. Consulting services, August 2026"
                    className={cellInput}
                    aria-label={`Line ${index + 1} description`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.qty}
                    onChange={(e) => update(index, { qty: e.target.value })}
                    readOnly={readOnly}
                    className={cellInput}
                    aria-label={`Line ${index + 1} quantity`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.rate}
                    onChange={(e) => update(index, { rate: e.target.value })}
                    readOnly={readOnly}
                    className={cellInput}
                    aria-label={`Line ${index + 1} rate`}
                  />
                </td>
                <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums">{money(currency, invoiceLineAmount(line))}</td>
                {!readOnly ? (
                  <td className="py-1">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => onChange(lines.filter((_, i) => i !== index))}
                      className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950/30"
                      aria-label={`Remove line ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
