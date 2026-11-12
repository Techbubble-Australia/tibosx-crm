"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { messageFromApiError } from "@/lib/api-error";
import { AdminSearchField } from "@/components/ui/AdminSearchField";
import { buildSearchHaystack, matchesSearch } from "@/lib/search-text";

type TimesheetRow = {
  id: string;
  memberName: string;
  startDate: string;
  endDate: string;
  targetLabel: string;
  /** This user is the timesheet's assigned client approver (and it is still submitted). */
  canApprove?: boolean;
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
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700">
            Cancel
          </button>
          <button type="submit" disabled={busy || !reason.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            Reject
          </button>
        </div>
      </form>
    </div>
  );
}

type Props = {
  mode: "submitted" | "approved";
};

export function WorkspaceClientTimesheetsView({ mode }: Props) {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [canApprove, setCanApprove] = useState(false);
  const [role, setRole] = useState<string>("CLIENT");
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    // Everyone with access to the project sees its timesheets; approve/reject is per row.
    const listPath = mode === "submitted" ? "/timesheets?status=SUBMITTED" : "/timesheets?status=APPROVED";
    void Promise.all([
      workspaceFetch("/auth/me").then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error((body as { error?: string }).error || "Could not load workspace session.");
        return body;
      }),
      workspaceFetch(listPath).then(async (r) => {
        const data = await r.json();
        if (!r.ok) return [] as TimesheetRow[];
        return (data.data as TimesheetRow[]) ?? [];
      }),
    ])
      .then(([meData, list]) => {
        const me = meData?.data as { canApproveTimesheets?: boolean; role?: string } | undefined;
        if (!me) {
          throw new Error("Could not load workspace profile.");
        }
        const workspaceRole = (me.role ?? "CLIENT").toUpperCase();
        setRole(workspaceRole);
        setCanApprove(Boolean(me.canApproveTimesheets) || workspaceRole === "ADMIN");
        setRows(Array.isArray(list) ? list : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load timesheets"))
      .finally(() => setLoading(false));
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      matchesSearch(
        buildSearchHaystack([row.memberName, row.targetLabel, formatDate(row.startDate), formatDate(row.endDate)]),
        q,
      ),
    );
  }, [rows, search]);

  async function approve(id: string) {
    if (
      !(await appConfirm("You're about to approve this timesheet. Do you want to continue?"))
    ) {
      return;
    }
    setActingId(id);
    try {
      const res = await workspaceFetch(`/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to approve"));
      load();
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Failed to approve");
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
      appAlert(e instanceof Error ? e.message : "Failed to reject");
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

  if (role !== "CLIENT" && role !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
        <p className="font-medium text-slate-900">Approve/Reject Timesheets</p>
        <p className="mt-2 text-sm">This area is for client contacts who approve timesheets.</p>
        <Link href="/timesheets" className="mt-4 inline-block text-sm text-sky-600 hover:underline">Open Project Management timesheets</Link>
      </div>
    );
  }

  const title = mode === "submitted" ? "Submitted timesheets" : "Approved timesheets";
  const subtitle =
    mode === "submitted"
      ? "Timesheets submitted for your projects and waiting for approval."
      : "Previously approved timesheets for reference.";
  const anyApprovable = rows.some((row) => row.canApprove);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      {mode === "submitted" && rows.length > 0 && !anyApprovable ? (
        <p className="mb-4 text-sm text-slate-500">
          You can view these timesheets. Only the project&apos;s <strong>Timesheet approver</strong> can approve or reject them.
        </p>
      ) : null}
      {(
        <>
          <AdminSearchField
            id="workspace-timesheet-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by member, project, ticket, or dates…"
            filteredCount={filtered.length}
            totalCount={rows.length}
          />

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Timesheet period</th>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  {mode === "submitted" ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={mode === "submitted" ? 4 : 3} className="px-4 py-10 text-center text-gray-500">
                      {mode === "submitted" ? "No submitted timesheets." : "No approved timesheets yet."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <Link
                          href={`/workspace/timesheets/${row.id}`}
                          className="font-medium text-sky-600 hover:underline dark:text-sky-400"
                        >
                          {formatDate(row.startDate)} – {formatDate(row.endDate)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{row.memberName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.targetLabel || "—"}</td>
                      {mode === "submitted" ? (
                        <td className="px-4 py-3 text-right">
                          {row.canApprove ? (
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              disabled={actingId === row.id || !canApprove}
                              onClick={() => void approve(row.id)}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actingId === row.id || !canApprove}
                              onClick={() => setRejectId(row.id)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
                            >
                              Reject
                            </button>
                          </div>
                          ) : (
                            <span className="text-xs text-gray-400">View only</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
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
