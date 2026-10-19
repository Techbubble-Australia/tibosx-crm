"use client";

import { resolveDocumentHref } from "@/lib/media-url";

export type AgreementRecordRow = {
  id: string;
  templateName: string;
  startDate: string | null;
  endDate: string | null;
  startDateDisplay?: string | null;
  endDateDisplay?: string | null;
  signedAt: string | null;
  documentUrl: string | null;
};

function formatDate(iso: string | null | undefined, display?: string | null) {
  if (display?.trim()) return display.trim();
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function endDateForRow(row: AgreementRecordRow): Date | null {
  if (row.endDate) {
    const d = new Date(row.endDate);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (row.endDateDisplay?.trim()) {
    const d = new Date(row.endDateDisplay.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

type AgreementStatus = "awaiting" | "active" | "expiring" | "expired";

function agreementStatus(row: AgreementRecordRow): AgreementStatus {
  const signed = Boolean(row.signedAt || row.documentUrl);
  if (!signed) return "awaiting";
  const end = endDateForRow(row);
  if (!end) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  if (endDay < today) return "expired";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  if (endDay <= soon) return "expiring";
  return "active";
}

function statusLabel(status: AgreementStatus): string {
  switch (status) {
    case "awaiting":
      return "Awaiting signature";
    case "expiring":
      return "Expiring soon";
    case "expired":
      return "Expired";
    default:
      return "Active";
  }
}

function statusClass(status: AgreementStatus): string {
  switch (status) {
    case "awaiting":
      return "bg-amber-100 text-amber-900";
    case "expiring":
      return "bg-orange-100 text-orange-900";
    case "expired":
      return "bg-red-100 text-red-800";
    default:
      return "bg-green-100 text-green-900";
  }
}

type Props = {
  records: AgreementRecordRow[];
  emptyMessage?: string;
  headerAction?: React.ReactNode;
};

export function UserAgreementsSection({ records, emptyMessage, headerAction }: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Agreements</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Contract history with start and expiry dates. Signed PDFs are opened from the Document column — not under Files.
          </p>
        </div>
        {headerAction}
      </div>
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700">
                <th className="py-2 pr-3">Template</th>
                <th className="py-2 pr-3">Start date</th>
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2 pr-3">Signed</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Document</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => {
                const status = agreementStatus(row);
                return (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">{row.templateName}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(row.startDate, row.startDateDisplay)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(row.endDate, row.endDateDisplay)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(row.signedAt)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td className="py-2">
                      {row.documentUrl ? (
                        <a
                          href={resolveDocumentHref(row.documentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage ?? "No agreements on file yet."}
        </p>
      )}
    </section>
  );
}
