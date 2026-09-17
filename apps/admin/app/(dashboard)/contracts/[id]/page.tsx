"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ContractForm, type ContractFormValues } from "@/components/contracts/ContractForm";
import { contractsListPathForStatus } from "@/lib/contract-redirect";
import type { ContractStatus } from "@/lib/contract-status";
import {
  CONTRACT_MOVE_TO_DRAFT_REASONS,
  CONTRACT_MOVE_TO_DRAFT_REASON_LABELS,
  type ContractMoveToDraftReason,
} from "@/lib/contract-groups";

type ContractActivityLog = {
  id: string;
  action: string;
  reason: string | null;
  reasonLabel: string | null;
  otherReason: string | null;
  performedByName: string;
  createdAt: string;
};

type ContractDetail = ContractFormValues & {
  status: ContractStatus;
  activityLogs?: ContractActivityLog[];
};

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  MOVE_TO_DRAFT: "Moved to Draft",
  AUTO_EXPIRED: "Auto-expired",
};

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
      alert("Please select a reason.");
      return;
    }
    if (reason === "OTHER" && !otherReason.trim()) {
      alert("Please enter the other reason.");
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
      alert(error instanceof Error ? error.message : "Failed to move contract to draft");
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

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [defaults, setDefaults] = useState<ContractDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showMoveToDraft, setShowMoveToDraft] = useState(false);

  useEffect(() => {
    void adminFetch(`/api/admin/contracts/${id}`)
      .then((res) => res.json())
      .then((data) => setDefaults(data.data as ContractDetail))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id]);

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
      const updated = data.data as ContractDetail;
      setDefaults(updated);
      router.push(contractsListPathForStatus(updated.status));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update contract");
    } finally {
      setIsSaving(false);
    }
  }

  function handleMovedToDraft(updated: ContractDetail) {
    setDefaults(updated);
    setShowMoveToDraft(false);
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">Contract not found.</p>;

  const listPath = contractsListPathForStatus(defaults.status);
  const activityLogs = defaults.activityLogs ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={listPath} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Contract</h2>
        </div>
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ContractForm key={defaults.id} defaults={defaults} onSubmit={handleSubmit} isSaving={isSaving} />
      </div>
      {activityLogs.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {activityLogs.map((log) => (
              <li key={log.id} className="py-3 text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {ACTIVITY_ACTION_LABELS[log.action] ?? log.action}
                </p>
                {log.reasonLabel ? (
                  <p className="text-gray-600 dark:text-gray-400">Reason: {log.reasonLabel}</p>
                ) : null}
                {log.otherReason ? (
                  <p className="text-gray-600 dark:text-gray-400">{log.otherReason}</p>
                ) : null}
                <p className="mt-1 text-xs text-gray-400">
                  {formatActivityDate(log.createdAt)}
                  {log.performedByName ? ` · ${log.performedByName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
