"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { canAccessWorkspace } from "@/lib/admin-roles";

type SupportProject = {
  id: string;
  name: string;
  slug: string;
  projectId: string | null;
  projectNumber: string | null;
  projectTitle: string | null;
};

type TbosProject = {
  id: string;
  projectNumber: string;
  title: string;
  supportOrganizationId?: string | null;
};

export default function SupportProjectsPage() {
  const { role } = useAdminSession();
  const [projects, setProjects] = useState<SupportProject[]>([]);
  const [tbosProjects, setTbosProjects] = useState<TbosProject[]>([]);
  const [name, setName] = useState("");
  const [linkProjectId, setLinkProjectId] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    void adminFetch("/api/admin/ticketing/organizations")
      .then((res) => res.json())
      .then((data) => setProjects((data.data as SupportProject[]) ?? []));
    void adminFetch("/api/admin/projects")
      .then((res) => res.json())
      .then((data) => setTbosProjects((data.data as TbosProject[]) ?? []));
  }

  const unlinkedTbosProjects = useMemo(
    () => tbosProjects.filter((p) => !p.supportOrganizationId),
    [tbosProjects],
  );

  useEffect(() => {
    if (!canAccessWorkspace(role)) return;
    load();
  }, [role]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/ticketing/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          projectId: linkProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create project");
      setName("");
      setLinkProjectId("");
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  async function linkExistingTbosProject(projectId: string) {
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/ticketing/organizations/from-project/${projectId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to link project");
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to link project");
    } finally {
      setSaving(false);
    }
  }

  if (!canAccessWorkspace(role)) {
    return <p className="text-gray-500">You do not have access to Workspace.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/support-tickets" className="text-sm text-blue-600 hover:underline">← Tickets</Link>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Support projects</h1>
        <p className="mt-1 text-sm text-gray-500">
          Portal projects for ticketing. Link them to TBOS delivery projects so names stay in sync and project managers get consultant access after SSO.
          Assign extra consultants under{" "}
          <Link href="/support-tickets/assignments" className="text-blue-600 hover:underline">Consultant access</Link>.
        </p>
      </div>

      {unlinkedTbosProjects.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">TBOS projects without a support portal</p>
          <ul className="mt-2 space-y-2">
            {unlinkedTbosProjects.slice(0, 8).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-gray-900 dark:text-gray-100">
                  {p.projectNumber} — {p.title}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void linkExistingTbosProject(p.id)}
                  className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-medium dark:border-amber-700"
                >
                  Create & link portal project
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={createProject} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="min-w-[240px] flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Demo Corp"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            required
          />
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Link TBOS project (optional)</label>
          <select
            value={linkProjectId}
            onChange={(e) => setLinkProjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">None</option>
            {unlinkedTbosProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectNumber} — {p.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          {saving ? "Creating…" : "Add project"}
        </button>
      </form>

      <ul className="divide-y rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
        {projects.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-gray-500">No support projects yet.</li>
        ) : (
          projects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                {p.projectId ? (
                  <p className="mt-0.5 text-xs text-gray-500">
                    TBOS:{" "}
                    <span className="text-gray-600 dark:text-gray-300">
                      {p.projectNumber ?? p.projectId}
                      {p.projectTitle ? ` — ${p.projectTitle}` : ""}
                    </span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-gray-400">Not linked to a TBOS delivery project</p>
                )}
              </div>
              <span className="font-mono text-xs text-gray-400">{p.slug}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
