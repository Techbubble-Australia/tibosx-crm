"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/project-types";
import { TablePagination } from "@/components/ui/TablePagination";
import { SortableTh, toggleSortKey, type SortDir } from "@/components/ui/SortableTh";
import { ViewModeToggle, type ViewMode } from "@/components/ui/ViewModeToggle";

type ProjectRow = {
  id: string;
  projectNumber: string;
  title: string;
  clientName: string;
  status: ProjectStatus;
  projectManagerName: string;
  startDate: string;
  endDate: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canManageProjects, isProjectMember } = useAdminSession();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState(() => searchParams.get("client") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<
    "projectNumber" | "title" | "clientName" | "status" | "projectManagerName" | "startDate"
  >("projectNumber");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setClientFilter(searchParams.get("client") ?? "");
    setStatusFilter(searchParams.get("status") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (clientFilter) params.set("client", clientFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    if (qs === searchParams.toString()) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [clientFilter, statusFilter, pathname, router, searchParams]);

  const listReturnHref = useMemo(() => {
    const params = new URLSearchParams();
    if (clientFilter) params.set("client", clientFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [clientFilter, statusFilter, pathname]);

  function projectHref(id: string) {
    return `/projects/${id}?return=${encodeURIComponent(listReturnHref)}`;
  }

  useEffect(() => {
    void adminFetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => setRows(data.data || []))
      .finally(() => setIsLoading(false));
  }, []);

  const clientOptions = useMemo(() => {
    const names = new Set(rows.map((r) => r.clientName).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (clientFilter && row.clientName !== clientFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, clientFilter, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "projectNumber":
          return a.projectNumber.localeCompare(b.projectNumber) * dir;
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "clientName":
          return a.clientName.localeCompare(b.clientName) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "projectManagerName":
          return a.projectManagerName.localeCompare(b.projectManagerName) * dir;
        case "startDate":
        default:
          return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const groupedByClient = useMemo(() => {
    const map = new Map<string, ProjectRow[]>();
    for (const row of sorted) {
      const key = row.clientName || "—";
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sorted]);

  function handleSort(
    key: "projectNumber" | "title" | "clientName" | "status" | "projectManagerName" | "startDate",
  ) {
    const next = toggleSortKey(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.dir);
    setPage(1);
  }

  async function deleteProject(id: string) {
    if (!(await appConfirm("Delete this draft project? This cannot be undone."))) return;
    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete project");
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProjectManagementGuard>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isProjectMember ? "Projects you are assigned to." : "Manage projects, members, and financials."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            {canManageProjects ? (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" /> New project
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All clients</option>
              {clientOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((key) => (
                <option key={key} value={key}>{PROJECT_STATUS_LABELS[key]}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : viewMode === "card" ? (
          <div className="space-y-8">
            {groupedByClient.map(([clientName, projects]) => (
              <section key={clientName}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{clientName}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((row) => (
                    <Link
                      key={row.id}
                      href={canManageProjects ? projectHref(row.id) : "#"}
                      className={`block rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 ${
                        canManageProjects ? "hover:border-sky-300 hover:shadow-sm" : ""
                      }`}
                    >
                      <p className="font-mono text-xs text-gray-500">{row.projectNumber}</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{row.title}</p>
                      <p className="mt-2 text-sm text-gray-500">{PROJECT_STATUS_LABELS[row.status]}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(row.startDate)} – {formatDate(row.endDate)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <table className="min-w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                  <tr>
                    <SortableTh label="Number" sortKey="projectNumber" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    <SortableTh label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    <SortableTh label="Client" sortKey="clientName" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    <SortableTh label="Project Manager" sortKey="projectManagerName" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    <SortableTh label="Dates" sortKey="startDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} className="px-4 py-3" />
                    {canManageProjects ? (
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="px-4 py-3 font-mono">
                        {canManageProjects ? (
                          <Link href={projectHref(row.id)} className="text-blue-600 hover:underline dark:text-blue-400">
                            {row.projectNumber}
                          </Link>
                        ) : (
                          <span className="text-gray-900 dark:text-gray-100">{row.projectNumber}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canManageProjects ? (
                          <Link href={projectHref(row.id)} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                            {row.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100">{row.title}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.clientName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          {row.status === "ACTIVE" ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden />
                          ) : null}
                          {PROJECT_STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.projectManagerName}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(row.startDate)} – {formatDate(row.endDate)}</td>
                      {canManageProjects ? (
                        <td className="px-4 py-3 text-right">
                          {row.status === "DRAFT" ? (
                            <button
                              type="button"
                              onClick={() => void deleteProject(row.id)}
                              disabled={deletingId === row.id}
                              className="inline-flex rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-red-950/30"
                              aria-label="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={sorted.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </div>
    </ProjectManagementGuard>
  );
}
