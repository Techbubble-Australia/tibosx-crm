"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { messageFromApiError } from "@/lib/api-error";

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

type AllRow = {
  id: string;
  status: string;
  memberName: string;
  startDate: string;
  endDate: string;
};

type MemberRow = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  targetLabel: string;
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await workspaceFetch(path);
    const data = await res.json();
    if (!res.ok) return fallback;
    return (data.data as T) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function ClientTimesheetsPage() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [allRows, setAllRows] = useState<AllRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [role, setRole] = useState<string>("CLIENT");
  const [memberRows, setMemberRows] = useState<MemberRow[]>([]);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    void Promise.all([
      workspaceFetch("/auth/me").then(async (r) => {
        const body = await r.json();
        if (!r.ok) {
          throw new Error(
            (body as { error?: string }).error ||
              "Could not load workspace session. Ensure your contact has client access on an active customer-support project.",
          );
        }
        return body;
      }),
      fetchJson<PendingRow[]>("/timesheets/pending-approval", []),
      fetchJson<AllRow[]>(`/timesheets`, []),
      fetchJson<MemberRow[]>("/member-timesheets", []),
    ])
      .then(([meData, pending, all, member]) => {
        const me = meData.data as { canApproveTimesheets?: boolean; role?: string };
        setRole(me.role ?? "CLIENT");
        setCanApprove(Boolean(me.canApproveTimesheets) || me.role === "admin");
        setRows(pending);
        setAllRows(all);
        setMemberRows(member);
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
      const res = await workspaceFetch(`/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to approve"));
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
      const res = await workspaceFetch(`/timesheets/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to reject"));
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

  if (role !== "CLIENT" && role !== "admin") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
        <p className="font-medium text-slate-900">Approve/Reject Timesheets</p>
        <p className="mt-2 text-sm">This area is for client contacts who approve timesheets. To create or edit your own timesheets, use Project Management.</p>
        <Link href="/timesheets" className="mt-4 inline-block text-sm text-sky-600 hover:underline">Open Project Management timesheets</Link>
      </div>
    );
  }

  const approvedRows = allRows.filter((row) => row.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Approve/Reject Timesheets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review submitted timesheets and approve or reject. Approved timesheets are listed for reference.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Submitted</h2>
        {!canApprove ? (
          <p className="text-sm text-slate-500">
            To approve timesheets, ask your project manager to enable <strong>Timesheet approver</strong> on your client
            contact in TBOS.
          </p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            <p className="font-medium text-slate-700">No submitted timesheets</p>
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
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-slate-900">Approved</h2>
        {approvedRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
            <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-700">No approved timesheets yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {approvedRows.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{row.memberName}</p>
                <p className="text-slate-600">
                  {formatDate(row.startDate)} – {formatDate(row.endDate)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

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
