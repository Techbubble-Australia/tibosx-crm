"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ContractForm, type ContractFormValues } from "@/components/contracts/ContractForm";
import { ContractActivityLogSection } from "@/components/contracts/ContractActivityLogSection";
import { contractsListPathForStatus } from "@/lib/contract-redirect";
import type { ContractStatus } from "@/lib/contract-status";
import type { ContractActivityLogEntry } from "@/lib/contract-activity";
import {
  CONTRACT_MOVE_TO_DRAFT_REASONS,
  CONTRACT_MOVE_TO_DRAFT_REASON_LABELS,
  type ContractMoveToDraftReason,
} from "@/lib/contract-groups";

type ContractDetail = ContractFormValues & {
  status: ContractStatus;
  activityLogs?: ContractActivityLogEntry[];
  clientName?: string;
  opportunityId?: string | null;
  opportunity?: { id: string; name?: string | null } | null;
  quoteId?: string | null;
  quote?: { id: string; quoteNumber?: string | null; name?: string | null } | null;
};

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function MoveToDraftDialog({
  contractId,
  onCancel,
  onMoved,
}: {
  contractId: string;
  onCancel: () => void;
  onMoved: (updated: ContractDetail) => void;
}) {
  const [reason, setReason] = useState<ContractMoveToDraftReason | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      appAlert("Please select a reason.");
      return;
    }
    if (reason === "OTHER" && !otherReason.trim()) {
      appAlert("Please enter the other reason.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${contractId}/move-to-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          otherReason: reason === "OTHER" ? otherReason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to move contract to draft");
      }
      onMoved(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to move contract to draft");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Move to Draft</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This contract will be moved back to Draft status. Please provide a reason.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ContractMoveToDraftReason)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Select reason…</option>
              {CONTRACT_MOVE_TO_DRAFT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {CONTRACT_MOVE_TO_DRAFT_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          {reason === "OTHER" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Other reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                required
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Moving…" : "Move to Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditContractPage() {
  const params = useParams();
  const id = params.id as string;
  const [defaults, setDefaults] = useState<ContractDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showMoveToDraft, setShowMoveToDraft] = useState(false);

  useEffect(() => {
    void refreshContract();
  }, [id]);

  async function refreshContract() {
    setFetching(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`);
      const data = await res.json();
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to update contract");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivate() {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to activate contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to activate contract");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTerminate() {
    if (!(await appConfirm("Terminate this contract?"))) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}/terminate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to terminate contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to terminate contract");
    } finally {
      setActionLoading(false);
    }
  }

  function handleMovedToDraft(updated: ContractDetail) {
    setDefaults(updated);
    setShowMoveToDraft(false);
  }

  const kpis = useMemo(() => {
    if (!defaults) return null;
    const value = (defaults.contractValue ?? 0) + (defaults.totalVariation ?? 0);
    const consumed = defaults.consumed ?? 0;
    const remaining =
      typeof defaults.remaining === "number" ? defaults.remaining : value - consumed;
    const consumedPct = value > 0 ? Math.round((consumed / value) * 100) : 0;
    return { value, consumed, remaining, consumedPct };
  }, [defaults]);

  const linkedOpportunity =
    defaults?.opportunity ??
    (defaults?.opportunityId ? { id: defaults.opportunityId, name: null } : null);
  const linkedQuote =
    defaults?.quote ?? (defaults?.quoteId ? { id: defaults.quoteId, quoteNumber: null, name: null } : null);

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults || !kpis) return <p className="text-gray-500">Contract not found.</p>;

  const listPath = contractsListPathForStatus(defaults.status);
  const activityLogs = defaults.activityLogs ?? [];
  const currency = defaults.currency || "AUD";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={listPath} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {defaults.contractNumber ? `${defaults.contractNumber} · ` : ""}
              {defaults.title || "Edit Contract"}
            </h2>
            {defaults.clientName ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{defaults.clientName}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {defaults.status === "DRAFT" ? (
            <button
              type="button"
              onClick={() => void handleActivate()}
              disabled={actionLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
          ) : null}
          {defaults.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => void handleTerminate()}
              disabled={actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Terminate
            </button>
          ) : null}
          {defaults.status !== "DRAFT" ? (
            <button
              type="button"
              onClick={() => setShowMoveToDraft(true)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Move to Draft
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Value</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatMoney(currency, kpis.value)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Consumed</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatMoney(currency, kpis.consumed)}
          </p>
          <p className="text-xs text-gray-500">{kpis.consumedPct}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatMoney(currency, kpis.remaining)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">End date</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {formatDate(defaults.endDate)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="#contract-variations"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Add variation
        </a>
        <button
          type="button"
          onClick={() => appAlert("Contract renewal workflow is coming soon.")}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Renew
        </button>
        <Link
          href={`/invoices/new?contractId=${encodeURIComponent(id)}`}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          Create invoice
        </Link>
      </div>

      {linkedOpportunity || linkedQuote ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Linked</p>
          <div className="flex flex-wrap gap-4">
            {linkedOpportunity ? (
              <div>
                <span className="text-gray-500">Opportunity · </span>
                <Link
                  href={`/opportunities/${linkedOpportunity.id}`}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {linkedOpportunity.name || linkedOpportunity.id}
                </Link>
              </div>
            ) : null}
            {linkedQuote ? (
              <div>
                <span className="text-gray-500">Quote · </span>
                <Link
                  href={`/quotes/${linkedQuote.id}`}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {linkedQuote.quoteNumber || linkedQuote.name || linkedQuote.id}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ContractForm key={`${defaults.id}-${defaults.status}`} defaults={defaults} onSubmit={handleSubmit} isSaving={isSaving} />
      </div>
      <ContractActivityLogSection logs={activityLogs} />
      {showMoveToDraft ? (
        <MoveToDraftDialog
          contractId={id}
          onCancel={() => setShowMoveToDraft(false)}
          onMoved={handleMovedToDraft}
        />
      ) : null}
    </div>
  );
}
