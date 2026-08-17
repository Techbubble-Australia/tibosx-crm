"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { useAdminSession } from "@/contexts/AdminSessionContext";

interface ProfileRow {
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
  sourcedByName?: string | null;
  isDuplicate?: boolean;
  duplicateCount?: number;
  duplicateMatchReason?: string | null;
}

type SortKey =
  | "name"
  | "email"
  | "phone"
  | "city"
  | "country"
  | "technology"
  | "expectedRate"
  | "sourcedByName"
  | "duplicate";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      ) : (
        <span className="inline-block h-3.5 w-3.5 opacity-0" aria-hidden />
      )}
    </button>
  );
}

function DuplicateBadge({ row }: { row: ProfileRow }) {
  if (!row.isDuplicate) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      title={`Matches ${row.duplicateCount ?? 0} other profile(s) by ${row.duplicateMatchReason ?? "email or phone"}`}
    >
      <AlertTriangle className="h-3 w-3" aria-hidden />
      Duplicate
    </span>
  );
}

function formatRate(row: ProfileRow): string {
  const rate = new Intl.NumberFormat("en-US").format(row.expectedRate);
  return `${row.currency} ${rate} (${row.mode})`;
}

export default function ProfilesPage() {
  const { canDeleteProfiles } = useAdminSession();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const {
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    totalItems,
    totalSourceItems,
  } = useListView(rows, (row) =>
    buildSearchHaystack([
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      row.country,
      row.city,
      row.technology,
      row.currency,
      row.mode,
    ]),
  );

  useEffect(() => {
    void fetchRows();
  }, []);

  async function fetchRows() {
    try {
      const res = await adminFetch("/api/admin/profiles");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this profile?")) return;
    try {
      const res = await adminFetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((row) => row.id !== id));
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  }

  const [expandedTechnologies, setExpandedTechnologies] = useState<Set<string>>(() => new Set());

  function toggleTechnologyGroup(technology: string) {
    setExpandedTechnologies((prev) => {
      const next = new Set(prev);
      if (next.has(technology)) {
        next.delete(technology);
      } else {
        next.add(technology);
      }
      return next;
    });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedProfiles = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone);
          break;
        case "city":
          cmp = (a.city || "").localeCompare(b.city || "");
          break;
        case "country":
          cmp = (a.country || "").localeCompare(b.country || "");
          break;
        case "technology":
          cmp = a.technology.localeCompare(b.technology);
          break;
        case "expectedRate":
          cmp = a.expectedRate - b.expectedRate;
          break;
        case "sourcedByName":
          cmp = (a.sourcedByName || "").localeCompare(b.sourcedByName || "");
          break;
        case "duplicate":
          cmp = Number(b.isDuplicate) - Number(a.isDuplicate);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedProfiles.slice(start, start + pageSize);
  }, [sortedProfiles, page, pageSize]);

  const groupedByTechnology = useMemo(() => {
    const map = new Map<string, ProfileRow[]>();
    for (const row of paginatedProfiles) {
      const key = row.technology.trim() || "Unknown";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [paginatedProfiles]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profiles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search candidate profiles and manage the talent database.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/database/profiles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Link>
        </div>
      </div>

      <AdminSearchField
        id="profile-search"
        value={search}
        onChange={setSearch}
        placeholder="Search by name, email, phone, city, country, technology…"
        filteredCount={totalItems}
        totalCount={totalSourceItems}
      />

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Name" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Email" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Phone" sortKey="phone" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="City" sortKey="city" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Country" sortKey="country" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Technology" sortKey="technology" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Expected rate" sortKey="expectedRate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Sourced by" sortKey="sourcedByName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Status" sortKey="duplicate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    No profile records yet.
                  </td>
                </tr>
              ) : totalItems === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No profiles match your search.</td>
                </tr>
              ) : (
                paginatedProfiles.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>{row.firstName} {row.lastName}</span>
                        <DuplicateBadge row={row} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.phone}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.technology}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatRate(row)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.sourcedByName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {row.isDuplicate ? (
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          {row.duplicateCount} match{(row.duplicateCount ?? 0) === 1 ? "" : "es"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/database/profiles/${row.id}`}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {canDeleteProfiles ? (
                          <button
                            type="button"
                            onClick={() => void deleteRow(row.id)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {rows.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profile records yet.
            </div>
          ) : totalItems === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profiles match your search.
            </div>
          ) : groupedByTechnology.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No profiles on this page.
            </div>
          ) : (
            groupedByTechnology.map(([technology, profiles]) => {
              const isExpanded = expandedTechnologies.has(technology);
              const panelId = `profile-group-${technology.replace(/\s+/g, "-").toLowerCase()}`;

              return (
                <section
                  key={technology}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                >
                  <button
                    type="button"
                    onClick={() => toggleTechnologyGroup(technology)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                      <h3 className="truncate font-semibold text-gray-900 dark:text-gray-100">{technology}</h3>
                    </span>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {profiles.length}
                    </span>
                  </button>
                  {isExpanded ? (
                    <div
                      id={panelId}
                      className="grid grid-cols-1 gap-4 border-t border-gray-100 p-4 sm:grid-cols-2 xl:grid-cols-3 dark:border-gray-800"
                    >
                      {profiles.map((row) => (
                        <article
                          key={row.id}
                          className="flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 truncate font-semibold text-gray-900 dark:text-gray-100">
                              <span className="truncate">{row.firstName} {row.lastName}</span>
                              <DuplicateBadge row={row} />
                            </p>
                            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.phone}</p>
                            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                              {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">{formatRate(row)}</p>
                            {row.sourcedByName ? (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sourced by {row.sourcedByName}</p>
                            ) : null}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Link
                              href={`/database/profiles/${row.id}`}
                              className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
                            >
                              View
                            </Link>
                            {canDeleteProfiles ? (
                              <button
                                type="button"
                                onClick={() => void deleteRow(row.id)}
                                className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                aria-label={`Delete ${row.firstName} ${row.lastName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
          {rows.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
