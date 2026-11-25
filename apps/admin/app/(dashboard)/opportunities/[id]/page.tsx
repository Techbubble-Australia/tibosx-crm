"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatCrmMoney, formatCrmShortDate, titleCaseToken } from "@/lib/crm-format";
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
  contracts?: Array<{ id: string; contractNumber: string; title: string; status: string }>;
  clientName?: string;
  typeLabel?: string;
  engagementModel?: string | null;
  contactName?: string;
  contactEmail?: string;
  contactPosition?: string;
  customFields?: unknown;
  createdAt?: string;
};

type ActivityKind = "Call" | "Email" | "Note";
type TimelineKind = ActivityKind | "Stage";
type TimelineEntry = { id: string; kind: TimelineKind; at: string; text: string };

/** Logged activity lives in `comments` as lines: `[2026-11-24|Call] Meenakshi interviewed`. */
const ACTIVITY_LINE = /^\[(\d{4}-\d{2}-\d{2})\|(Call|Email|Note)\]\s*(.+)$/;

function buildTimeline(opp: Defaults): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const freeText: string[] = [];
  (opp.comments ?? "").split("\n").forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = ACTIVITY_LINE.exec(trimmed);
    if (match) {
      entries.push({
        id: `log-${index}`,
        kind: match[2] as ActivityKind,
        at: `${match[1]}T12:00:00.000Z`,
        text: match[3] ?? "",
      });
    } else {
      freeText.push(trimmed);
    }
  });
  if (freeText.length > 0) {
    entries.push({
      id: "comments",
      kind: "Note",
      at: opp.createdAt ?? new Date().toISOString(),
      text: freeText.join(" "),
    });
  }
  for (const h of opp.stageHistory ?? []) {
    const to = h.toStage?.name ?? "—";
    entries.push({
      id: `stage-${h.id}`,
      kind: "Stage",
      at: h.createdAt,
      text: `${h.fromStage?.name ? `${h.fromStage.name} to ` : "Moved to "}${to}${h.note ? ` (${h.note})` : ""}`,
    });
  }
  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

const QUALIFICATION_KEYS: Array<{ label: string; keys: string[]; chip?: boolean }> = [
  { label: "Budget", keys: ["budget"], chip: true },
  { label: "Authority", keys: ["authority"], chip: true },
  { label: "Need", keys: ["need"] },
  { label: "Timeline", keys: ["timeline"] },
  { label: "Competitors", keys: ["competitors", "competitor"] },
  { label: "Source", keys: ["source", "leadSource"] },
];

function customFieldMap(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function readQualification(raw: unknown) {
  const map = customFieldMap(raw);
  const lower = new Map(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  const out: Array<{ label: string; value: string; chip: boolean }> = [];
  for (const def of QUALIFICATION_KEYS) {
    const hit = def.keys.map((k) => lower.get(k.toLowerCase())).find((v) => typeof v === "string" && v.trim());
    if (typeof hit === "string") out.push({ label: def.label, value: hit.trim(), chip: Boolean(def.chip) });
  }
  return out;
}

function readCloseDate(raw: unknown): string {
  const map = customFieldMap(raw);
  for (const key of ["closeDate", "expectedCloseDate", "expectedClose"]) {
    const value = map[key];
    if (typeof value === "string" && value) return formatCrmShortDate(value);
  }
  return "";
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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
  const [editingNext, setEditingNext] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logKind, setLogKind] = useState<ActivityKind>("Call");
  const [logText, setLogText] = useState("");
  const [savingLog, setSavingLog] = useState(false);

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

  async function logActivity() {
    const text = logText.trim().replace(/\s*\n\s*/g, " ");
    if (!text || !defaults) return;
    setSavingLog(true);
    try {
      const line = `[${new Date().toISOString().slice(0, 10)}|${logKind}] ${text}`;
      const comments = [(defaults.comments ?? "").trimEnd(), line].filter(Boolean).join("\n");
      const res = await adminFetch(`/api/admin/opportunities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to log activity");
      }
      setLogText("");
      setShowLogForm(false);
      await loadOpportunity();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to log activity");
    } finally {
      setSavingLog(false);
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
  const contracts = defaults.contracts ?? [];
  const currency = defaults.currency || "AUD";
  const amount = Number(defaults.amount) || 0;
  const probability = defaults.probability ?? null;
  const weighted = probability != null ? Math.round((amount * probability) / 100) : null;
  const closeDate = readCloseDate(defaults.customFields);
  const timeline = buildTimeline(defaults);
  const qualification = readQualification(defaults.customFields);
  const barStages = stages.filter((s) => s.stageType !== "lost" && s.stageType !== "won");
  const isWon = defaults.stageType === "won";
  const currentIdx = barStages.findIndex((s) => s.id === defaults.stageId);
  const dueLabel = formatCrmShortDate(defaults.nextStepDue);

  return (
    <div className="max-w-6xl space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href="/opportunities"
              className="mt-0.5 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Back to opportunities"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">{defaults.name}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{defaults.clientName || "—"}</span>
                <span>·</span>
                <span>Owner {defaults.ownerName || "unassigned"}</span>
                <span>·</span>
                {defaults.engagementModel || defaults.typeLabel ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {defaults.engagementModel
                      ? titleCaseToken(defaults.engagementModel)
                      : defaults.typeLabel}
                  </span>
                ) : null}
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {defaults.stageName || defaults.status}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {formatCrmMoney(amount, currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {probability != null ? `${probability}%` : "—"}
                {weighted != null ? ` · weighted ${formatCrmMoney(weighted, currency)}` : ""}
                {closeDate ? ` · close ${closeDate}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void markLost()}
                disabled={movingStage || !lostStage || defaults.stageType === "lost"}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Mark lost
              </button>
              <button
                type="button"
                onClick={() => void markWon()}
                disabled={movingStage || !wonStage || isWon}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Mark won
              </button>
            </div>
          </div>
        </div>

        {barStages.length > 0 ? (
          <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${barStages.length}, minmax(0, 1fr))` }}>
            {barStages.map((stage, index) => {
              const filled = isWon || (currentIdx >= 0 && index <= currentIdx);
              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={movingStage || stage.id === defaults.stageId}
                  onClick={() => void moveToStage(stage.id)}
                  title={`${stage.name} · ${stage.winProbability}%`}
                  className="group text-left disabled:cursor-default"
                >
                  <span
                    className={`block h-1 rounded-full transition-colors ${
                      filled
                        ? "bg-gray-900 dark:bg-gray-100"
                        : "bg-gray-200 group-hover:bg-gray-300 dark:bg-gray-700 dark:group-hover:bg-gray-600"
                    }`}
                  />
                  <span
                    className={`mt-1 block truncate text-xs ${
                      stage.id === defaults.stageId
                        ? "font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stage.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Next step</h3>
            {editingNext ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_10rem_auto]">
                <input
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Follow up on proposal"
                  autoFocus
                />
                <input
                  type="date"
                  value={nextStepDue}
                  onChange={(e) => setNextStepDue(e.target.value)}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveNextStep().then(() => setEditingNext(false))}
                    disabled={savingNextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                  >
                    {savingNextStep ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNextStep(defaults.nextStep ?? "");
                      setNextStepDue(toDateInputValue(defaults.nextStepDue));
                      setEditingNext(false);
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-gray-900 dark:bg-amber-900/20 dark:text-gray-100">
                {defaults.nextStep ? (
                  <>
                    {defaults.nextStep}
                    {dueLabel ? (
                      <>
                        {" · due "}
                        <span className="font-semibold">{dueLabel}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <span className="text-gray-500">No next step set.</span>
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowLogForm((v) => !v)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Log activity
              </button>
              <button
                type="button"
                onClick={() => setEditingNext(true)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                Reschedule
              </button>
            </div>
            {showLogForm ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr_auto]">
                <select
                  value={logKind}
                  onChange={(e) => setLogKind(e.target.value as ActivityKind)}
                  className={inputClass}
                >
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="Note">Note</option>
                </select>
                <input
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  className={inputClass}
                  placeholder="What happened?"
                />
                <button
                  type="button"
                  onClick={() => void logActivity()}
                  disabled={savingLog || !logText.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {savingLog ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Add
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Calls, emails and notes you log, plus every stage change.
            </p>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {timeline.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 text-sm text-gray-900 dark:text-gray-100">
                    <span
                      className={`mt-0.5 inline-flex w-14 shrink-0 justify-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        entry.kind === "Email"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {entry.kind}
                    </span>
                    <span>
                      <span className="text-gray-500 dark:text-gray-400">{formatCrmShortDate(entry.at)}: </span>
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Buying committee</h3>
            {defaults.contactId && defaults.contactName ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Contact</th>
                      <th className="px-3 py-2 font-medium">Role in deal</th>
                      <th className="px-3 py-2 font-medium">Last touch</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">
                        {defaults.contactName}
                        {defaults.contactEmail ? (
                          <span className="block text-xs text-gray-500">{defaults.contactEmail}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {defaults.contactPosition || "Primary contact"}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {formatCrmShortDate(timeline.find((t) => t.kind !== "Stage")?.at) || "none yet"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No contact linked. Choose one in Edit opportunity below.</p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Qualification</h3>
            {qualification.length === 0 ? (
              <p className="text-sm text-gray-400">
                No qualification captured yet (budget, authority, need, timeline, competitors, source).
              </p>
            ) : (
              <dl className="space-y-2.5 text-sm">
                {qualification.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">{item.label}</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {item.chip ? (
                        <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {item.value}
                        </span>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Linked records</h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Roles (Recruitment)</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {linkedJobs.length > 0
                    ? `${linkedJobs.length} job listing${linkedJobs.length !== 1 ? "s" : ""}`
                    : "None linked"}
                  <span className="ml-2 inline-flex gap-2 text-xs">
                    <Link
                      href={`/jobs/new?clientId=${encodeURIComponent(defaults.clientId)}&opportunityId=${encodeURIComponent(id)}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Create
                    </Link>
                    <button
                      type="button"
                      onClick={() => void openLinkJob()}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Link
                    </button>
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Quote</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {quotes.length === 0 ? (
                    <span className="text-gray-400">None yet</span>
                  ) : (
                    quotes.map((q) => (
                      <Link
                        key={q.id}
                        href={`/quotes/${q.id}`}
                        className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 hover:underline dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        {q.quoteNumber} {q.status.toLowerCase()}
                      </Link>
                    ))
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Contract</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {contracts.length === 0 ? (
                    <span className="text-gray-500">Created on win</span>
                  ) : (
                    contracts.map((c) => (
                      <Link
                        key={c.id}
                        href={`/contracts/${c.id}`}
                        className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {c.contractNumber}
                      </Link>
                    ))
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Project</dt>
                <dd className="text-gray-500">Created on contract start</dd>
              </div>
            </dl>
          </section>
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
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit opportunity</h3>
        <OpportunityFields key={defaults.id} defaults={defaults} />
        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </form>
    </div>
  );
}
