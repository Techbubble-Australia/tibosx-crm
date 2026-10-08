"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ticketingFetch } from "@/lib/ticketing-fetch";
import { TICKET_PRIORITIES, TICKET_PRIORITY_LABELS, TICKET_TYPES, TICKET_TYPE_LABELS } from "@/lib/ticket-labels";
import { FileUploadField } from "@/components/FileUploadField";

export default function NewTicketPage() {
  const router = useRouter();
  const [type, setType] = useState("TECHNICAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(ticketId: string) {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const res = await ticketingFetch(`/api/tickets/${ticketId}/attachments/upload`, {
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
      const res = await ticketingFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, priority, subject, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");
      const ticketId = data.data.id as string;
      if (files.length > 0) await uploadFiles(ticketId);
      router.push(`/tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/tickets" className="text-sm text-sky-600 hover:underline">← Back to tickets</Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">New support request</h1>
        <p className="text-sm text-slate-500">Describe your issue and attach any helpful files.</p>
      </div>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Request type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {TICKET_TYPES.map((t) => (
                <option key={t} value={t}>{TICKET_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>{TICKET_PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Brief summary" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
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
