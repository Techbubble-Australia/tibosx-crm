"use client";

import { resolveDocumentHref } from "@/lib/media-url";

export type AgreementRecordRow = {
  id: string;
  templateName: string;
  projectLabel: string | null;
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

type Props = {
  records: AgreementRecordRow[];
  emptyMessage?: string;
  headerAction?: React.ReactNode;
};

export function UserAgreementsSection({ records, emptyMessage, headerAction }: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Agreements</h3>
        {headerAction}
      </div>
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-700">
                <th className="py-2 pr-3">Template</th>
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">End</th>
                <th className="py-2 pr-3">Signed</th>
                <th className="py-2">Document</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3">{row.templateName}</td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{row.projectLabel ?? "—"}</td>
                  <td className="py-2 pr-3">{formatDate(row.startDate, row.startDateDisplay)}</td>
                  <td className="py-2 pr-3">{formatDate(row.endDate, row.endDateDisplay)}</td>
                  <td className="py-2 pr-3">{formatDate(row.signedAt)}</td>
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
              ))}
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
