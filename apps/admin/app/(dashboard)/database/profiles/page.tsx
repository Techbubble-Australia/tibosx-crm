"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { TablePagination } from "@/components/ui/TablePagination";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProfilesListTable, type ProfileListRow, type ProfileListEditingState } from "@/components/profiles/ProfilesListTable";
import { exportProfilesAsExcel } from "@/lib/export-profiles-excel";
import { ListColumnPersonalizer } from "@/components/ui/ListColumnPersonalizer";
import { useColumnVisibility, type ListColumnDef } from "@/hooks/useColumnVisibility";
import { PROFILE_LEVELS } from "@/lib/profile-levels";

const PROFILE_LIST_COLUMNS: ListColumnDef[] = [
  { id: "name", label: "Name" },
  { id: "citizen", label: "Citizen" },
  { id: "city", label: "City" },
  { id: "country", label: "Country" },
  { id: "technology", label: "Technology" },
  { id: "level", label: "Level" },
  { id: "relevantExperience", label: "Relevant exp." },
  { id: "expectedRate", label: "Expected rate" },
  { id: "sourcedBy", label: "Sourced by" },
  { id: "createdAt", label: "Created on" },
  { id: "docs", label: "Docs" },
];

interface ProfileRow extends ProfileListRow {
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
  | "createdAt"
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

const filterSelectClass =
  "h-10 min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

function collectSortedOptions(rows: ProfileRow[], field: "country" | "category" | "technology"): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const value = row[field].trim();
    if (value) set.add(value);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function ProfilesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <ProfilesPageInner />
    </Suspense>
  );
}

function ProfilesPageInner() {
  const searchParams = useSearchParams();
  const { canDeleteProfiles, canManageProfileOwnership } = useAdminSession();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [sourcers, setSourcers] = useState<Array<{ id: string; label: string }>>([]);
  const [technologies, setTechnologies] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("");
  const [citizenFilter, setCitizenFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [listEditingState, setListEditingState] = useState<ProfileListEditingState>({
    editingId: null,
    hasChanges: false,
  });
  const [saveRequestKey, setSaveRequestKey] = useState(0);
  const { columns: profileColumnDefs, visibleIds, isVisible: isColumnVisible, toggleColumn } =
    useColumnVisibility("tbos:profiles-columns", PROFILE_LIST_COLUMNS);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const dimensionFiltered = useMemo(() => {
    return rows.filter((row) => {
      if (countryFilter && row.country !== countryFilter) return false;
      if (categoryFilter && row.category !== categoryFilter) return false;
      if (technologyFilter && row.technology !== technologyFilter) return false;
      if (citizenFilter === "yes" && !row.isCitizen) return false;
      if (citizenFilter === "no" && row.isCitizen) return false;
      if (levelFilter && (row.level ?? "Developer") !== levelFilter) return false;
      const exp = row.relevantExperience ?? 0;
      if (experienceMin && exp < Number.parseInt(experienceMin, 10)) return false;
      if (experienceMax && exp > Number.parseInt(experienceMax, 10)) return false;
      return true;
    });
  }, [rows, countryFilter, categoryFilter, technologyFilter, citizenFilter, levelFilter, experienceMin, experienceMax]);

  const countryOptions = useMemo(() => collectSortedOptions(rows, "country"), [rows]);
  const categoryOptions = useMemo(() => collectSortedOptions(rows, "category"), [rows]);
  const technologyOptions = useMemo(() => collectSortedOptions(rows, "technology"), [rows]);

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
    pageSizeOptions,
  } = useListView(dimensionFiltered, (row) =>
    buildSearchHaystack([
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      row.country,
      row.city,
      row.category,
      row.technology,
      row.level,
      row.relevantExperience,
      row.currency,
      row.mode,
      row.isCitizen ? "citizen yes" : "citizen no",
    ]),
    {
      initialPageSize: 100,
      pageSizeStorageKey: "tbos:profiles-page-size",
      pageSizeOptions: [25, 50, 100, 200],
    },
  );

  useEffect(() => {
    setPage(1);
  }, [countryFilter, categoryFilter, technologyFilter, citizenFilter, levelFilter, experienceMin, experienceMax, setPage]);

  useEffect(() => {
    void fetchRows();
    void loadMeta();
  }, []);

  useEffect(() => {
    const technology = searchParams.get("technology")?.trim();
    const country = searchParams.get("country")?.trim();
    if (technology) setTechnologyFilter(technology);
    if (country) setCountryFilter(country);
  }, [searchParams]);

  async function loadMeta() {
    try {
      const [sourcersRes, techRes] = await Promise.all([
        adminFetch("/api/admin/profiles/meta/sourcers"),
        adminFetch("/api/admin/job-technologies"),
      ]);
      const sourcersData = await sourcersRes.json();
      const techData = await techRes.json();
      setSourcers(sourcersData.data ?? []);
      setTechnologies((techData.data ?? []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
    } catch (error) {
      console.error("Error loading profile meta:", error);
    }
  }

  function handleRowUpdated(updated: ProfileListRow) {
    setRows((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
  }

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
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: string[], selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function handleExportExcel() {
    const selected = rows.filter((row) => selectedIds.has(row.id));
    if (selected.length === 0) return;
    exportProfilesAsExcel(selected);
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

  function handleSaveListEdits() {
    if (!listEditingState.hasChanges) return;
    if (!confirm("Save changes to this profile?")) return;
    setSaveRequestKey((key) => key + 1);
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
        case "createdAt":
          cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
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
          {viewMode === "list" ? (
            <>
              <ListColumnPersonalizer
                columns={profileColumnDefs}
                visibleIds={visibleIds}
                onToggle={toggleColumn}
              />
              <button
                type="button"
                disabled={!listEditingState.hasChanges}
                onClick={handleSaveListEdits}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Save
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Export as Excel
              </button>
            </>
          ) : null}
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

      {rows.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className={filterSelectClass}
            aria-label="Filter by country"
          >
            <option value="">All countries</option>
            {countryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={filterSelectClass}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={technologyFilter}
            onChange={(e) => setTechnologyFilter(e.target.value)}
            className={filterSelectClass}
            aria-label="Filter by technology"
          >
            <option value="">All technologies</option>
            {technologyOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <select
            value={citizenFilter}
            onChange={(e) => setCitizenFilter(e.target.value)}
            className={filterSelectClass}
            aria-label="Filter by Citizen"
          >
            <option value="">All Citizen</option>
            <option value="yes">Citizen: Yes</option>
            <option value="no">Citizen: No</option>
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className={filterSelectClass}
            aria-label="Filter by level"
          >
            <option value="">All levels</option>
            {PROFILE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={80}
            value={experienceMin}
            onChange={(e) => setExperienceMin(e.target.value)}
            placeholder="Exp. min"
            className={`${filterSelectClass} min-w-[100px]`}
            aria-label="Minimum relevant experience"
          />
          <input
            type="number"
            min={0}
            max={80}
            value={experienceMax}
            onChange={(e) => setExperienceMax(e.target.value)}
            placeholder="Exp. max"
            className={`${filterSelectClass} min-w-[100px]`}
            aria-label="Maximum relevant experience"
          />
          {(countryFilter || categoryFilter || technologyFilter || citizenFilter || levelFilter || experienceMin || experienceMax) ? (
            <button
              type="button"
              onClick={() => {
                setCountryFilter("");
                setCategoryFilter("");
                setTechnologyFilter("");
                setCitizenFilter("");
                setLevelFilter("");
                setExperienceMin("");
                setExperienceMax("");
              }}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-400">No profile records yet.</p>
          ) : totalItems === 0 ? (
            <p className="px-4 py-8 text-center text-gray-400">No profiles match your search or filters.</p>
          ) : (
            <ProfilesListTable
              rows={paginatedProfiles}
              canDeleteProfiles={canDeleteProfiles}
              canManageProfileOwnership={canManageProfileOwnership}
              sourcers={sourcers}
              technologies={technologies}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onRowUpdated={handleRowUpdated}
              onDelete={(id) => void deleteRow(id)}
              isColumnVisible={isColumnVisible}
              onEditingStateChange={setListEditingState}
              saveRequestKey={saveRequestKey}
            />
          )}
          {rows.length > 0 ? (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={pageSizeOptions}
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
              No profiles match your search or filters.
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
              pageSizeOptions={pageSizeOptions}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
