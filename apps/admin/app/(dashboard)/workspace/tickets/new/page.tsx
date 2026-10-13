"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { workspaceFetch } from "@/lib/workspace-fetch";
import {
  CLIENT_REQUEST_TYPES,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
} from "@/lib/support-ticket-labels";
import { FileUploadField } from "@/components/workspace/FileUploadField";

type Me = { role: string; tbosRole?: string | null; organization?: { id: string; name: string } | null };
type Org = { id: string; name: string };

export default function NewTicketPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [type, setType] = useState("TECHNICAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isConsultant = me?.role === "CONSULTANT";
  const isTbosAdmin = (me?.tbosRole || "").toLowerCase() === "admin";

  useEffect(() => {
    void workspaceFetch("/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setMe(data.data as Me);
      });
  }, []);

  useEffect(() => {
    if (!me) return;
    if (me.role !== "CLIENT" && me.role !== "CONSULTANT") return;
    void workspaceFetch("/organizations")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data as Org[]) ?? [];
        setOrgs(list);
        if (list.length === 1) {
          setOrganizationId(list[0]!.id);
        } else if (me.role === "CLIENT" && me.organization?.id) {
          const defaultId = list.some((o) => o.id === me.organization?.id)
            ? me.organization.id
            : list[0]?.id ?? "";
          if (defaultId) setOrganizationId(defaultId);
        }
      });
  }, [me]);

  async function uploadFiles(ticketId: string) {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await workspaceFetch(`/tickets/${ticketId}/attachments/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : `Failed to upload ${file.name}`);
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!organizationId) {
        throw new Error("Select the project this ticket is for.");
      }
      const res = await workspaceFetch("/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          priority,
          subject,
          description,
          organizationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");
      const ticketId = data.data.id as string;
      if (files.length > 0) await uploadFiles(ticketId);
      router.push(`/workspace/tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/workspace/tickets" className="text-sm text-sky-600 hover:underline">← Back to tickets</Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {isConsultant ? "Create ticket" : "New support request"}
        </h1>
        <p className="text-sm text-slate-500">
          {isConsultant
            ? isTbosAdmin
              ? "Choose an active support project, then enter ticket details."
              : "Choose the client project, then enter ticket details."
            : "Describe your issue and attach any helpful files."}
        </p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Project *</label>
          {orgs.length <= 1 && orgs.length > 0 ? (
            <input
              readOnly
              value={orgs[0]?.name ?? me?.organization?.name ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            />
          ) : (
            <select
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select project…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          {orgs.length === 0 && me ? (
            <p className="mt-1 text-xs text-amber-700">No active projects are available</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Request type *</label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {(isConsultant
                ? Object.entries(TICKET_TYPE_LABELS)
                : CLIENT_REQUEST_TYPES.map((row) => [row.value, row.label] as const)
              ).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority *</label>
            <select
              required
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subject *</label>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Brief summary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description *</label>
          <textarea required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Steps to reproduce, expected behavior, etc." />
        </div>
        <FileUploadField files={files} onChange={setFiles} />
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 sm:w-auto">
          {loading ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}
