"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { messageFromApiError } from "@/lib/api-error";

type Target = { kind: "project" | "ticket"; id: string; label: string };

function targetKey(t: Target) {
  return `${t.kind}:${t.id}`;
}

export default function NewMemberTimesheetPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [selected, setSelected] = useState("");
  const [managerName, setManagerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void workspaceFetch("/member-timesheets/targets")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data as Target[]) ?? [];
        setTargets(list);
        if (list[0]) setSelected(targetKey(list[0]));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setManagerName("");
      return;
    }
    const [kind, id] = selected.split(":");
    if (!kind || !id) return;
    const query =
      kind === "project"
        ? `projectId=${encodeURIComponent(id)}`
        : `ticketId=${encodeURIComponent(id)}`;
    void workspaceFetch(`/member-timesheets/target-meta?${query}`)
      .then((r) => r.json())
      .then((data) => setManagerName((data.data as { managerName?: string }).managerName ?? ""))
      .catch(() => setManagerName(""));
  }, [selected]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const [kind, id] = selected.split(":");
    if (!kind || !id) {
      setError("Select a project or case.");
      setSaving(false);
      return;
    }
    try {
      const body: Record<string, unknown> = { startDate, endDate };
      if (kind === "project") body.projectId = id;
      else body.ticketId = id;
      const res = await workspaceFetch("/member-timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save"));
      router.push("/workspace/timesheets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/workspace/timesheets" className="text-sm text-sky-600 hover:underline">← Timesheets</Link>
      <h1 className="text-2xl font-semibold text-slate-900">New timesheet</h1>
      <p className="text-sm text-slate-500">Select a project or support case assigned to you.</p>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">Project or case *</label>
          <select
            required
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {targets.length === 0 ? <option value="">No assignments</option> : null}
            {targets.map((t) => (
              <option key={targetKey(t)} value={targetKey(t)}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Project manager / case creator</label>
          <input readOnly value={managerName} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Start date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End date *</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || targets.length === 0}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      </form>
    </div>
  );
}
