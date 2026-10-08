"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { ticketingFetch } from "@/lib/ticketing-fetch";

type PendingRow = {
  id: string;
  memberName: string;
  startDate: string;
  endDate: string;
  targetLabel: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RejectDialog({
  onCancel,
  onConfirm,
  busy,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = reason.trim();
          if (!trimmed) return;
          onConfirm(trimmed);
        }}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">Reject timesheet</h2>
        <p className="mt-1 text-sm text-slate-500">The team member will see your reason and can revise and resubmit.</p>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection"
          required
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !reason.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ClientTimesheetsPage() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    void Promise.all([
      ticketingFetch("/api/auth/me").then((r) => r.json()),
      ticketingFetch("/api/timesheets/pending-approval").then((r) => r.json()),
    ])
      .then(([meData, listData]) => {
        const me = meData.data as { canApproveTimesheets?: boolean };
        setCanApprove(Boolean(me.canApproveTimesheets));
        if (!listData.data && listData.error) {
          throw new Error(String(listData.error));
        }
        setRows((listData.data as PendingRow[]) ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load timesheets"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setActingId(id);
    try {
      const res = await ticketingFetch(`/api/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to approve");
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string, reason: string) {
    setActingId(id);
    try {
      const res = await ticketingFetch(`/api/timesheets/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to reject");
      setRejectId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActingId(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Timesheet approvals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and approve time submitted by your support team for this project.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {!canApprove ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">You are not set up as a timesheet approver</p>
          <p className="mt-1 text-sm">Ask your project manager to enable approver access on your client contact.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">No timesheets waiting for approval</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{row.memberName}</p>
                <p className="text-sm text-slate-600">{row.targetLabel || "Project / case"}</p>
                <p className="text-xs text-slate-400">
                  {formatDate(row.startDate)} – {formatDate(row.endDate)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={actingId === row.id}
                  onClick={() => void approve(row.id)}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={actingId === row.id}
                  onClick={() => setRejectId(row.id)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rejectId ? (
        <RejectDialog
          busy={actingId === rejectId}
          onCancel={() => setRejectId(null)}
          onConfirm={(reason) => void reject(rejectId, reason)}
        />
      ) : null}
    </div>
  );
}
