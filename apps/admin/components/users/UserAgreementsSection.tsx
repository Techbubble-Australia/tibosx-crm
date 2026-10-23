"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { resolveDocumentHref } from "@/lib/media-url";
import { adminFetch } from "@/lib/admin-api";

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

function isoDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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
  editableUserId?: string;
  onRecordsChange?: (records: AgreementRecordRow[]) => void;
  onEditAgreement?: (record: AgreementRecordRow) => void;
};

export function UserAgreementsSection({
  records,
  emptyMessage,
  headerAction,
  editableUserId,
  onRecordsChange,
  onEditAgreement,
}: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);

  async function patchRecord(recordId: string, body: Record<string, unknown>) {
    if (!editableUserId || !onRecordsChange) return;
    setSavingId(recordId);
    try {
      const res = await adminFetch(`/api/admin/users/${editableUserId}/agreements/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Update failed");
      onRecordsChange((data.data?.agreementRecords as AgreementRecordRow[]) ?? []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteForEdit(record: AgreementRecordRow) {
    if (!editableUserId || !onRecordsChange) return;
    const ok = window.confirm("This will delete the agreement record. Do you want to continue?");
    if (!ok) return;
    setSavingId(record.id);
    try {
      const res = await adminFetch(`/api/admin/users/${editableUserId}/agreements/${record.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Delete failed");
      const next = (data.data?.agreementRecords as AgreementRecordRow[]) ?? [];
      onRecordsChange(next);
      onEditAgreement?.(record);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setSavingId(null);
    }
  }

  const editable = Boolean(editableUserId && onRecordsChange);

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
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700">
                <th className="py-2 pr-3">Document</th>
                <th className="py-2 pr-3">Start date</th>
                <th className="py-2 pr-3">End date</th>
                <th className="py-2 pr-3">Status</th>
                {editable ? <th className="py-2 pr-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {records.map((row) => {
                const status = agreementStatus(row);
                const busy = savingId === row.id;
                return (
                  <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3">
                      {row.documentUrl ? (
                        <a
                          href={resolveDocumentHref(row.documentUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {row.templateName}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-gray-100">{row.templateName}</span>
                      )}
                      {row.signedAt ? (
                        <p className="mt-0.5 text-xs text-gray-500">Signed {formatDate(row.signedAt)}</p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {editable ? (
                        <input
                          type="date"
                          disabled={busy}
                          className="rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                          value={isoDateInput(row.startDate)}
                          onChange={(e) =>
                            void patchRecord(row.id, {
                              startDate: e.target.value ? e.target.value : null,
                            })
                          }
                        />
                      ) : (
                        formatDate(row.startDate, row.startDateDisplay)
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {editable ? (
                        <input
                          type="date"
                          disabled={busy}
                          className="rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                          value={isoDateInput(row.endDate)}
                          onChange={(e) =>
                            void patchRecord(row.id, {
                              endDate: e.target.value ? e.target.value : null,
                            })
                          }
                        />
                      ) : (
                        formatDate(row.endDate, row.endDateDisplay)
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {editable ? (
                        <select
                          disabled={busy}
                          className="rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                          value={status === "awaiting" ? "awaiting_signature" : "signed"}
                          onChange={(e) =>
                            void patchRecord(row.id, { status: e.target.value as "awaiting_signature" | "signed" })
                          }
                        >
                          <option value="awaiting_signature">Awaiting signature</option>
                          <option value="signed" disabled={!row.documentUrl}>
                            Signed / active
                          </option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}
                        >
                          {statusLabel(status)}
                        </span>
                      )}
                      {busy ? <Loader2 className="mt-1 inline h-3 w-3 animate-spin text-gray-400" /> : null}
                    </td>
                    {editable ? (
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteForEdit(row)}
                          className="text-sm text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                        >
                          Edit agreement
                        </button>
                      </td>
                    ) : null}
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
