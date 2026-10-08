"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type SupportProject = { id: string; name: string; slug: string };

export default function SupportProjectsPage() {
  const { role } = useAdminSession();
  const [projects, setProjects] = useState<SupportProject[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    void adminFetch("/api/admin/ticketing/organizations")
      .then((res) => res.json())
      .then((data) => setProjects((data.data as SupportProject[]) ?? []));
  }

  useEffect(() => {
    if (role !== "admin") return;
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
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create project");
      setName("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  if (role !== "admin") {
    return <p className="text-gray-500">Admin only.</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/support-tickets" className="text-sm text-blue-600 hover:underline">← Support tickets</Link>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Support projects</h1>
        <p className="mt-1 text-sm text-gray-500">
          Client projects in the support portal (separate from TBOS CRM clients). Assign consultants under{" "}
          <Link href="/support-tickets/assignments" className="text-blue-600 hover:underline">Consultant access</Link>.
        </p>
      </div>

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
              <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
              <span className="font-mono text-xs text-gray-400">{p.slug}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
