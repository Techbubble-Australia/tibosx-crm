"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit, Trash2, Info, FileText } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";
import { getSortedCountryOptions } from "@/lib/country-flags";

export type ProfileListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city?: string | null;
  category: string;
  technology: string;
  expectedRate: number;
  currency: string;
  mode: string;
  sourcedById?: string | null;
  sourcedByName?: string | null;
  isCitizen?: boolean;
  comments?: string | null;
  documentUrls?: string[];
  isDuplicate?: boolean;
};

type SourcerOption = { id: string; label: string };
type TechnologyOption = { id: string; name: string };

type Props = {
  rows: ProfileListRow[];
  canDeleteProfiles: boolean;
  canManageProfileOwnership: boolean;
  sourcers: SourcerOption[];
  technologies: TechnologyOption[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], selected: boolean) => void;
  onRowUpdated: (row: ProfileListRow) => void;
  onDelete: (id: string) => void;
};

const inlineSelectClass =
  "w-full min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

const inlineInputClass =
  "w-full min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function formatRate(row: ProfileListRow): string {
  const rate = new Intl.NumberFormat("en-US").format(row.expectedRate);
  return `${row.currency} ${rate} (${row.mode})`;
}

function firstDocumentUrl(row: ProfileListRow): string | null {
  const docs = row.documentUrls ?? [];
  return docs.length > 0 ? (docs[0] ?? null) : null;
}

export function ProfilesListTable({
  rows,
  canDeleteProfiles,
  canManageProfileOwnership,
  sourcers,
  technologies,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowUpdated,
  onDelete,
}: Props) {
  const countryOptions = getSortedCountryOptions();
  const [editingSourcedById, setEditingSourcedById] = useState<string | null>(null);
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  async function patchField(id: string, patch: Record<string, unknown>) {
    try {
      const res = await adminFetch(`/api/admin/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        onRowUpdated(data.data as ProfileListRow);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <tr>
          <th className="w-10 px-2 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll(rows.map((r) => r.id), e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
              aria-label="Select all profiles on this page"
            />
          </th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Citizen</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">City</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Expected rate</th>
          <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sourced by</th>
          <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Docs</th>
          <th className="px-3 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => {
          const docUrl = firstDocumentUrl(row);
          const tooltip = [
            row.email,
            row.phone,
            row.comments?.trim() ? `Comments: ${row.comments.trim()}` : null,
          ]
            .filter(Boolean)
            .join("\n");
          const isEditingSourcedBy = editingSourcedById === row.id;

          return (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => onToggleSelect(row.id)}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label={`Select ${row.firstName} ${row.lastName}`}
                />
              </td>
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-1.5">
                  <span className="group relative">
                    <Info className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                    <span
                      className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg group-hover:block dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
                      role="tooltip"
                    >
                      {tooltip || "No additional details"}
                    </span>
                  </span>
                  <span>{row.firstName} {row.lastName}</span>
                  {row.isDuplicate ? (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      Dup
                    </span>
                  ) : null}
                </span>
              </td>
              <td className="px-3 py-2">
                <select
                  value={row.isCitizen ? "yes" : "no"}
                  onChange={(e) => void patchField(row.id, { isCitizen: e.target.value === "yes" })}
                  className={inlineSelectClass}
                  aria-label={`Citizen status for ${row.firstName}`}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </td>
              <td className="px-3 py-2">
                <input
                  type="text"
                  value={row.city ?? ""}
                  onChange={(e) => onRowUpdated({ ...row, city: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== (row.city ?? "")) {
                      void patchField(row.id, { city: e.target.value.trim() || null });
                    }
                  }}
                  className={inlineInputClass}
                  aria-label={`City for ${row.firstName}`}
                />
              </td>
              <td className="px-3 py-2">
                <select
                  value={row.country}
                  onChange={(e) => void patchField(row.id, { country: e.target.value })}
                  className={inlineSelectClass}
                  aria-label={`Country for ${row.firstName}`}
                >
                  {countryOptions.map((opt) => (
                    <option key={opt.code} value={opt.name}>{opt.name}</option>
                  ))}
                  {row.country && !countryOptions.some((o) => o.name === row.country) ? (
                    <option value={row.country}>{row.country}</option>
                  ) : null}
                </select>
              </td>
              <td className="px-3 py-2">
                <select
                  value={row.technology}
                  onChange={(e) => void patchField(row.id, { technology: e.target.value })}
                  className={inlineSelectClass}
                  aria-label={`Technology for ${row.firstName}`}
                >
                  {technologies.map((tech) => (
                    <option key={tech.id} value={tech.name}>{tech.name}</option>
                  ))}
                  {row.technology && !technologies.some((t) => t.name === row.technology) ? (
                    <option value={row.technology}>{row.technology}</option>
                  ) : null}
                </select>
              </td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatRate(row)}</td>
              <td className="px-3 py-2">
                {canManageProfileOwnership ? (
                  isEditingSourcedBy ? (
                    <select
                      value={row.sourcedById ?? ""}
                      autoFocus
                      onChange={(e) => {
                        void patchField(row.id, { sourcedById: e.target.value || null });
                        setEditingSourcedById(null);
                      }}
                      onBlur={() => setEditingSourcedById(null)}
                      className={inlineSelectClass}
                      aria-label={`Sourced by for ${row.firstName}`}
                    >
                      <option value="">—</option>
                      {sourcers.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onDoubleClick={() => setEditingSourcedById(row.id)}
                      className="w-full rounded border border-transparent px-1 py-0.5 text-left text-xs text-gray-600 hover:border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
                      title="Double-click to change"
                    >
                      {row.sourcedByName || "—"}
                    </button>
                  )
                ) : (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{row.sourcedByName || "—"}</span>
                )}
              </td>
              <td className="px-3 py-2 text-center">
                {docUrl ? (
                  <a
                    href={resolveDocumentHref(docUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                    aria-label={`View documents for ${row.firstName} ${row.lastName}`}
                  >
                    <FileText className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex items-center gap-1">
                  <Link
                    href={`/database/profiles/${row.id}`}
                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  {canDeleteProfiles ? (
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
