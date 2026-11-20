"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Info, FileText, Pencil } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";
import { getSortedCountryOptions } from "@/lib/country-flags";
import { PROFILE_LEVELS } from "@/lib/profile-levels";

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
  level?: string;
  relevantExperience?: number;
  sourcedById?: string | null;
  sourcedByName?: string | null;
  available?: boolean;
  availableFrom?: string | null;
  isCitizen?: boolean;
  comments?: string | null;
  documentUrls?: string[];
  isDuplicate?: boolean;
  createdAt?: string;
};

type SourcerOption = { id: string; label: string };
type TechnologyOption = { id: string; name: string };

export type ProfileListEditingState = {
  editingId: string | null;
  hasChanges: boolean;
};

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
  isColumnVisible: (id: string) => boolean;
  onEditingStateChange?: (state: ProfileListEditingState) => void;
  saveRequestKey?: number;
  onSaveComplete?: () => void;
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

function rowsEqual(a: ProfileListRow, b: ProfileListRow): boolean {
  return (
    a.isCitizen === b.isCitizen &&
    (a.city ?? "") === (b.city ?? "") &&
    a.country === b.country &&
    a.technology === b.technology &&
    (a.level ?? "Developer") === (b.level ?? "Developer") &&
    (a.relevantExperience ?? 0) === (b.relevantExperience ?? 0) &&
    (a.sourcedById ?? "") === (b.sourcedById ?? "")
  );
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
  isColumnVisible,
  onEditingStateChange,
  saveRequestKey,
  onSaveComplete,
}: Props) {
  const countryOptions = getSortedCountryOptions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProfileListRow | null>(null);
  const [original, setOriginal] = useState<ProfileListRow | null>(null);

  const hasChanges = useMemo(() => {
    if (!draft || !original) return false;
    return !rowsEqual(draft, original);
  }, [draft, original]);

  useEffect(() => {
    onEditingStateChange?.({ editingId, hasChanges });
  }, [editingId, hasChanges, onEditingStateChange]);

  useEffect(() => {
    if (!saveRequestKey || !draft || !editingId || !hasChanges) return;
    void saveDraft();
  }, [saveRequestKey]);

  function startEdit(row: ProfileListRow) {
    setEditingId(row.id);
    setDraft({ ...row });
    setOriginal({ ...row });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setOriginal(null);
  }

  async function saveDraft() {
    if (!draft || !original || !hasChanges) {
      cancelEdit();
      onSaveComplete?.();
      return;
    }

    const patch: Record<string, unknown> = {};
    if (draft.isCitizen !== original.isCitizen) patch.isCitizen = draft.isCitizen;
    if ((draft.city ?? "") !== (original.city ?? "")) patch.city = draft.city?.trim() || null;
    if (draft.country !== original.country) patch.country = draft.country;
    if (draft.technology !== original.technology) patch.technology = draft.technology;
    if ((draft.level ?? "Developer") !== (original.level ?? "Developer")) patch.level = draft.level;
    if ((draft.relevantExperience ?? 0) !== (original.relevantExperience ?? 0)) {
      patch.relevantExperience = draft.relevantExperience ?? 0;
    }
    if ((draft.sourcedById ?? "") !== (original.sourcedById ?? "")) {
      patch.sourcedById = draft.sourcedById || null;
    }

    try {
      const res = await adminFetch(`/api/admin/profiles/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        onRowUpdated(data.data as ProfileListRow);
        cancelEdit();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      onSaveComplete?.();
    }
  }

  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  return (
    <table className="w-full min-w-[1280px] text-sm">
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
          {isColumnVisible("name") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Name</th>
          ) : null}
          {isColumnVisible("available") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Available?</th>
          ) : null}
          {isColumnVisible("availableFrom") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Available from</th>
          ) : null}
          {isColumnVisible("citizen") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Citizen</th>
          ) : null}
          {isColumnVisible("city") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">City</th>
          ) : null}
          {isColumnVisible("country") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Country</th>
          ) : null}
          {isColumnVisible("technology") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Technology</th>
          ) : null}
          {isColumnVisible("level") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Level</th>
          ) : null}
          {isColumnVisible("relevantExperience") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Relevant exp.</th>
          ) : null}
          {isColumnVisible("expectedRate") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Expected rate</th>
          ) : null}
          {isColumnVisible("sourcedBy") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Sourced by</th>
          ) : null}
          {isColumnVisible("createdAt") ? (
            <th className="px-3 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Created on</th>
          ) : null}
          {isColumnVisible("docs") ? (
            <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300">Docs</th>
          ) : null}
          <th className="sticky right-0 z-10 bg-gray-50 px-3 py-3 text-right font-medium text-gray-600 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)] dark:bg-gray-800 dark:text-gray-300">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => {
          const isEditing = editingId === row.id;
          const view = isEditing && draft ? draft : row;
          const docUrl = firstDocumentUrl(row);
          const tooltip = [
            row.email,
            row.phone,
            row.comments?.trim() ? `Comments: ${row.comments.trim()}` : null,
          ]
            .filter(Boolean)
            .join("\n");

          return (
            <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => onToggleSelect(row.id)}
                  className="h-4 w-4 rounded border-gray-300"
                  aria-label={`Select ${row.firstName} ${row.lastName}`}
                />
              </td>
              {isColumnVisible("name") ? (
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
                    <Link
                      href={`/database/profiles/${row.id}`}
                      className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                    >
                      {row.firstName} {row.lastName}
                    </Link>
                    {row.isDuplicate ? (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        Dup
                      </span>
                    ) : null}
                  </span>
                </td>
              ) : null}
              {isColumnVisible("available") ? (
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${row.available !== false ? "bg-green-500" : "bg-red-500"}`}
                      aria-hidden
                    />
                    {row.available !== false ? "Yes" : "No"}
                  </span>
                </td>
              ) : null}
              {isColumnVisible("availableFrom") ? (
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {row.availableFrom
                    ? new Date(row.availableFrom).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              ) : null}
              {isColumnVisible("citizen") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={view.isCitizen ? "yes" : "no"}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, isCitizen: e.target.value === "yes" } : prev,
                        )
                      }
                      className={inlineSelectClass}
                      aria-label={`Citizen status for ${row.firstName}`}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.isCitizen ? "Yes" : "No"}
                    </span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("city") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={view.city ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, city: e.target.value } : prev))
                      }
                      className={inlineInputClass}
                      aria-label={`City for ${row.firstName}`}
                    />
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{row.city || "—"}</span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("country") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={view.country}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, country: e.target.value } : prev))
                      }
                      className={inlineSelectClass}
                      aria-label={`Country for ${row.firstName}`}
                    >
                      {countryOptions.map((opt) => (
                        <option key={opt.code} value={opt.name}>{opt.name}</option>
                      ))}
                      {view.country && !countryOptions.some((o) => o.name === view.country) ? (
                        <option value={view.country}>{view.country}</option>
                      ) : null}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{row.country}</span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("technology") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={view.technology}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, technology: e.target.value } : prev))
                      }
                      className={inlineSelectClass}
                      aria-label={`Technology for ${row.firstName}`}
                    >
                      {technologies.map((tech) => (
                        <option key={tech.id} value={tech.name}>{tech.name}</option>
                      ))}
                      {view.technology && !technologies.some((t) => t.name === view.technology) ? (
                        <option value={view.technology}>{view.technology}</option>
                      ) : null}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{row.technology}</span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("level") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <select
                      value={view.level ?? "Developer"}
                      onChange={(e) =>
                        setDraft((prev) => (prev ? { ...prev, level: e.target.value } : prev))
                      }
                      className={inlineSelectClass}
                      aria-label={`Level for ${row.firstName}`}
                    >
                      {PROFILE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{row.level ?? "Developer"}</span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("relevantExperience") ? (
                <td className="px-3 py-2">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={view.relevantExperience ?? 0}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                relevantExperience: Number.parseInt(e.target.value, 10) || 0,
                              }
                            : prev,
                        )
                      }
                      className={`${inlineInputClass} w-16`}
                      aria-label={`Relevant experience for ${row.firstName}`}
                    />
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.relevantExperience ?? 0}
                    </span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("expectedRate") ? (
                <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatRate(row)}</td>
              ) : null}
              {isColumnVisible("sourcedBy") ? (
                <td className="px-3 py-2">
                  {canManageProfileOwnership && isEditing ? (
                    <select
                      value={view.sourcedById ?? ""}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev ? { ...prev, sourcedById: e.target.value || null } : prev,
                        )
                      }
                      className={inlineSelectClass}
                      aria-label={`Sourced by for ${row.firstName}`}
                    >
                      <option value="">—</option>
                      {sourcers.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.sourcedByName || "—"}
                    </span>
                  )}
                </td>
              ) : null}
              {isColumnVisible("createdAt") ? (
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              ) : null}
              {isColumnVisible("docs") ? (
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
              ) : null}
              <td
                className={`sticky right-0 z-10 px-3 py-2 text-right shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.12)] ${
                  isEditing
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50"
                }`}
              >
                <div className="inline-flex items-center gap-1">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                      aria-label={`Edit ${row.firstName} ${row.lastName}`}
                      title="Edit row"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
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
