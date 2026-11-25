"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Link2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import {
  OpportunityFields,
  readOpportunityFormData,
  toNextStepDueIso,
  type OpportunityFormValues,
} from "@/components/opportunities/OpportunityFields";

type LinkedJob = {
  id: string;
  title: string;
  referenceNumber: string;
  published: boolean;
  type: string;
  order: number;
  location?: string;
};

type AvailableJob = LinkedJob & {
  opportunityId: string | null;
};

type QuoteRow = {
  id: string;
  quoteNumber: string;
  status: string;
  totalAmount: number;
};

type StageRow = {
  id: string;
  name: string;
  stageType: string;
  winProbability: number;
  order: number;
};

type PipelineRow = {
  id: string;
  name: string;
  isDefault?: boolean;
  stages: StageRow[];
};

type StageHistoryRow = {
  id: string;
  createdAt: string;
  note: string | null;
  fromStage?: { id: string; name: string } | null;
  toStage?: { id: string; name: string } | null;
};

type Defaults = OpportunityFormValues & {
  id: string;
  order: number;
  pipelineId?: string | null;
  stageId?: string | null;
  stageName?: string;
  stageType?: string | null;
  probability?: number | null;
  jobs?: LinkedJob[];
  quotes?: QuoteRow[];
  stageHistory?: StageHistoryRow[];
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatHistoryDay(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [linkedJobs, setLinkedJobs] = useState<LinkedJob[]>([]);
  const [showLinkJob, setShowLinkJob] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [linkingJobId, setLinkingJobId] = useState<string | null>(null);
  const [unlinkingJobId, setUnlinkingJobId] = useState<string | null>(null);
  const [pipelines, setPipelines] = useState<PipelineRow[]>([]);
  const [movingStage, setMovingStage] = useState(false);
  const [nextStep, setNextStep] = useState("");
  const [nextStepDue, setNextStepDue] = useState("");
  const [savingNextStep, setSavingNextStep] = useState(false);

  const loadOpportunity = useCallback(async () => {
    try {
      const oppRes = await adminFetch(`/api/admin/opportunities/${id}`);
      const oppData = await oppRes.json();
      const row = oppData.data as Defaults;
      setDefaults(row);
      setLinkedJobs(row.jobs ?? []);
      setNextStep(row.nextStep ?? "");
      setNextStepDue(toDateInputValue(row.nextStepDue));
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOpportunity();
  }, [loadOpportunity]);

  useEffect(() => {
    void adminFetch("/api/admin/crm/pipelines")
      .then((res) => res.json())
      .then((body) => setPipelines((body.data ?? []) as PipelineRow[]))
      .catch(console.error);
  }, []);

  const stages = useMemo(() => {
    if (!defaults) return [] as StageRow[];
    const pipeline =
      pipelines.find((p) => p.id === defaults.pipelineId) ||
      pipelines.find((p) => p.isDefault) ||
      pipelines[0];
    return pipeline?.stages ?? [];
  }, [defaults, pipelines]);

  const wonStage = useMemo(() => stages.find((s) => s.stageType === "won"), [stages]);
  const lostStage = useMemo(() => stages.find((s) => s.stageType === "lost"), [stages]);

  async function moveToStage(stageId: string, closeReason?: string) {
    setMovingStage(true);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, ...(closeReason ? { closeReason } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to move stage");
      await loadOpportunity();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to move stage");
    } finally {
      setMovingStage(false);
    }
  }

  async function saveNextStep() {
    setSavingNextStep(true);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextStep: nextStep.trim() || null,
          nextStepDue: toNextStepDueIso(nextStepDue),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to save next step");
      }
      await loadOpportunity();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to save next step");
    } finally {
      setSavingNextStep(false);
    }
  }

  async function markWon() {
    if (!wonStage) {
      appAlert("No won stage configured on this pipeline.");
      return;
    }
    if (!(await appConfirm(`Mark this opportunity as won (${wonStage.name})?`))) return;
    await moveToStage(wonStage.id);
  }

  async function markLost() {
    if (!lostStage) {
      appAlert("No lost stage configured on this pipeline.");
      return;
    }
    const reason = window.prompt("Lost reason (optional):");
    if (reason === null) return;
    if (!(await appConfirm(`Mark this opportunity as lost (${lostStage.name})?`))) return;
    await moveToStage(lostStage.id, reason.trim() || undefined);
  }

  async function openLinkJob() {
    setShowLinkJob(true);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/available-jobs`);
      const data = await res.json();
      setAvailableJobs((data.data ?? []) as AvailableJob[]);
    } catch (error) {
      console.error(error);
      appAlert("Failed to load jobs for linking");
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
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to link job");
    } finally {
      setLinkingJobId(null);
    }
  }

  async function unlinkJob(jobId: string) {
    if (!(await appConfirm("Unlink this job from the opportunity?"))) return;
    setUnlinkingJobId(jobId);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unlink job");
      setLinkedJobs((prev) => prev.filter((job) => job.id !== jobId));
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to unlink job");
    } finally {
      setUnlinkingJobId(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = readOpportunityFormData(formData);
    try {
      const res = await adminFetch(`/api/admin/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      const inactive = payload.active === false || payload.status === "REJECTED";
      router.push(inactive ? "/opportunities/inactive" : "/opportunities/active");
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to update opportunity");
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

  const quotes = defaults.quotes ?? [];
  const stageHistory = defaults.stageHistory ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/opportunities/active" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{defaults.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {defaults.stageName || defaults.status}
              {defaults.probability != null ? ` · ${defaults.probability}%` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void markWon()}
            disabled={movingStage || !wonStage || defaults.stageType === "won"}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            Mark won
          </button>
          <button
            type="button"
            onClick={() => void markLost()}
            disabled={movingStage || !lostStage || defaults.stageType === "lost"}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            Mark lost
          </button>
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

      {stages.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Stage path</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stages.map((stage, index) => {
              const current = stage.id === defaults.stageId;
              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={movingStage || current}
                  onClick={() => void moveToStage(stage.id)}
                  className={`flex min-w-[7.5rem] shrink-0 flex-col rounded-lg border px-3 py-2 text-left transition ${
                    current
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                  } disabled:cursor-default`}
                >
                  <span className="text-[10px] opacity-70">{index + 1}</span>
                  <span className="text-sm font-medium">{stage.name}</span>
                  <span className={`text-[11px] ${current ? "opacity-80" : "text-gray-500"}`}>
                    {stage.winProbability}%
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Next step</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Action</label>
            <input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className={inputClass}
              placeholder="e.g. Follow up on proposal"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Due</label>
            <input
              type="date"
              value={nextStepDue}
              onChange={(e) => setNextStepDue(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void saveNextStep()}
              disabled={savingNextStep}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black sm:w-auto"
            >
              {savingNextStep ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </section>

      {quotes.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Linked quotes</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {quotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link href={`/quotes/${q.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {q.quoteNumber}
                </Link>
                <span className="text-sm text-gray-500">
                  {q.status} · {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(q.totalAmount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {stageHistory.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Stage history</h3>
          <ol className="relative space-y-4 border-l border-gray-200 pl-4 dark:border-gray-700">
            {stageHistory.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {entry.fromStage?.name ? `${entry.fromStage.name} → ` : ""}
                  {entry.toStage?.name ?? "—"}
                </p>
                <p className="text-xs text-gray-500">{formatHistoryDay(entry.createdAt)}</p>
                {entry.note ? <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

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
                    {job.referenceNumber} · {job.location || "—"} · {job.type} · {job.published ? "Active" : "Inactive"}
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
        <OpportunityFields key={defaults.id} defaults={defaults} />
        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </form>
    </div>
  );
}
