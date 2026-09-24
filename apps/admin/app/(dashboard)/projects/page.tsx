"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/project-types";

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
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => setRows(data.data || []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <ProjectManagementGuard requireManageProjects>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage projects, members, and financials.</p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" /> New project
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400">No projects yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">PM</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Dates</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{row.projectNumber}</td>
                    <td className="px-4 py-3">{row.title}</td>
                    <td className="px-4 py-3 text-gray-500">{row.clientName}</td>
                    <td className="px-4 py-3">{PROJECT_STATUS_LABELS[row.status]}</td>
                    <td className="px-4 py-3 text-gray-500">{row.projectManagerName}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(row.startDate)} – {formatDate(row.endDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/projects/${row.id}`} className="inline-flex rounded-lg border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-600">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProjectManagementGuard>
  );
}
