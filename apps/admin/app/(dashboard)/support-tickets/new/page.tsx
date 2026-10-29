"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
} from "@/lib/support-ticket-labels";
import { FileUploadField } from "@/components/workspace/FileUploadField";

type Org = { id: string; name: string };

export default function AdminNewTicketPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [type, setType] = useState("TECHNICAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void adminFetch("/api/admin/ticketing/organizations")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to load projects");
        }
        const list = (data.data as Org[]) ?? [];
        setOrgs(list);
        if (list.length === 1) setOrganizationId(list[0]!.id);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load projects");
      });
  }, []);

  async function uploadFiles(ticketId: string) {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await adminFetch(`/api/admin/ticketing/tickets/${ticketId}/attachments/upload`, {
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
      if (!organizationId) throw new Error("Select the project this ticket is for.");
      const res = await adminFetch("/api/admin/ticketing/tickets", {
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
      router.push(`/support-tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/support-tickets" className="text-sm text-sky-600 hover:underline">← Back to tickets</Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Create ticket</h1>
        <p className="text-sm text-gray-500">Choose a support project and enter ticket details.</p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-sm font-medium">Project *</label>
          {orgs.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              No active Customer Support projects available. Enable Customer Support on a project to raise tickets
              against it.
            </p>
          ) : orgs.length === 1 ? (
            <input readOnly value={orgs[0]?.name ?? ""} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
          ) : (
            <select
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="">Select project…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Request type *</label>
            <select required value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority *</label>
            <select required value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800">
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subject *</label>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description *</label>
          <textarea required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
        </div>
        <FileUploadField files={files} onChange={setFiles} />
        <button type="submit" disabled={loading} className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
          {loading ? "Creating…" : "Create ticket"}
        </button>
      </form>
    </div>
  );
}
