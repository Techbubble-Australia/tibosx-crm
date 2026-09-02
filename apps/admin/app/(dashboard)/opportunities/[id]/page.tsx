"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Link2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  SALES_CURRENCIES,
  type OpportunityStatus,
} from "@/lib/opportunity-status";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientOption = { id: string; name: string; status: string };

type LinkedJob = {
  id: string;
  title: string;
  referenceNumber: string;
  published: boolean;
  type: string;
  order: number;
};

type AvailableJob = LinkedJob & {
  opportunityId: string | null;
};

type Defaults = {
  name: string;
  clientId: string;
  currency: string;
  amount: number;
  status: OpportunityStatus;
  comments: string;
  order: number;
  jobs?: LinkedJob[];
};

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [linkedJobs, setLinkedJobs] = useState<LinkedJob[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [showLinkJob, setShowLinkJob] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [linkingJobId, setLinkingJobId] = useState<string | null>(null);
  const [unlinkingJobId, setUnlinkingJobId] = useState<string | null>(null);

  async function loadOpportunity() {
    try {
      const [oppRes, clientsRes] = await Promise.all([
        adminFetch(`/api/admin/opportunities/${id}`),
        adminFetch("/api/admin/clients"),
      ]);
      const oppData = await oppRes.json();
      const clientsData = await clientsRes.json();
      const row = oppData.data as Defaults;
      setDefaults(row);
      setLinkedJobs(row.jobs ?? []);
      setClientId(row.clientId);
      setClients(
        ((clientsData.data ?? []) as ClientOption[]).filter(
          (c) => c.status === "ACTIVE" || c.status === "PROSPECT" || c.id === row.clientId,
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void loadOpportunity();
  }, [id]);

  async function openLinkJob() {
    setShowLinkJob(true);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/available-jobs`);
      const data = await res.json();
      setAvailableJobs((data.data ?? []) as AvailableJob[]);
    } catch (error) {
      console.error(error);
      alert("Failed to load jobs for linking");
    }
  }

  async function linkJob(jobId: string) {
    setLinkingJobId(jobId);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/link-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to link job");
      }
      setLinkedJobs((prev) => {
        const exists = prev.some((job) => job.id === data.data.id);
        return exists ? prev.map((job) => (job.id === data.data.id ? data.data : job)) : [...prev, data.data];
      });
      setAvailableJobs((prev) => prev.filter((job) => job.id !== jobId));
      setShowLinkJob(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to link job");
    } finally {
      setLinkingJobId(null);
    }
  }

  async function unlinkJob(jobId: string) {
    if (!confirm("Unlink this job from the opportunity?")) return;
    setUnlinkingJobId(jobId);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unlink job");
      setLinkedJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to unlink job");
    } finally {
      setUnlinkingJobId(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          clientId: formData.get("clientId"),
          currency: formData.get("currency"),
          amount: formData.get("amount"),
          status: formData.get("status"),
          comments: formData.get("comments") ?? "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      router.push(`/opportunities?clientId=${encodeURIComponent(String(formData.get("clientId") ?? ""))}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update opportunity");
    } finally {
      setIsLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">Opportunity not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/opportunities" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Opportunity</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/jobs/new?clientId=${encodeURIComponent(defaults.clientId)}&opportunityId=${encodeURIComponent(id)}`}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </Link>
          <button
            type="button"
            onClick={() => void openLinkJob()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            <Link2 className="h-4 w-4" />
            Link Job
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Linked jobs</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Jobs associated with this opportunity. Each job can only be linked to one opportunity.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {linkedJobs.length}
          </span>
        </div>
        {linkedJobs.length === 0 ? (
          <p className="text-sm text-gray-400">No jobs linked yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {linkedJobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {job.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {job.referenceNumber} · {job.type} · {job.published ? "Active" : "Inactive"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void unlinkJob(job.id)}
                  disabled={unlinkingJobId === job.id}
                  className="inline-flex items-center gap-1 rounded p-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                >
                  {unlinkingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showLinkJob ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Link existing job</h3>
            <button
              type="button"
              onClick={() => setShowLinkJob(false)}
              className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
          {availableJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No available jobs for this client.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {availableJobs
                .filter((job) => !job.opportunityId || job.opportunityId === id)
                .filter((job) => !linkedJobs.some((linked) => linked.id === job.id))
                .map((job) => (
                  <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{job.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {job.referenceNumber} · {job.type} · {job.published ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void linkJob(job.id)}
                      disabled={linkingJobId === job.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      {linkingJobId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Link
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name *</label>
          <input name="name" required defaultValue={defaults.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Client *</label>
          <select name="clientId" required value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Currency *</label>
            <select name="currency" required defaultValue={defaults.currency} className={inputClass}>
              {SALES_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Amount *</label>
            <input name="amount" type="number" required min="0.01" step="0.01" defaultValue={defaults.amount} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Status *</label>
          <select name="status" required defaultValue={defaults.status} className={inputClass}>
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>{OPPORTUNITY_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Comments</label>
          <textarea name="comments" rows={4} defaultValue={defaults.comments} className={inputClass} />
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </form>
    </div>
  );
}
