"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";
import { messageFromApiError } from "@/lib/api-error";

function RejectDialog({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) {
            alert("Reject reason is required.");
            return;
          }
          onConfirm(reason.trim());
        }}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reject timesheet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please add a reason for rejection.</p>
        <textarea
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason"
          required
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isEffectiveProjectMember } = useAdminSession();
  const [timesheet, setTimesheet] = useState<
    (TimesheetFormValues & { canApprove?: boolean; canSubmit?: boolean }) | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoadError(null);
    setIsLoading(true);
    void adminFetch(`/api/admin/timesheets/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(messageFromApiError(data, r.status === 403 ? "You cannot view this timesheet" : "Timesheet not found"));
        }
        setTimesheet(data.data as TimesheetFormValues & { canApprove?: boolean; canSubmit?: boolean });
      })
      .catch((error) => {
        setTimesheet(null);
        setLoadError(error instanceof Error ? error.message : "Failed to load timesheet");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save timesheet"));
      setTimesheet(data.data as TimesheetFormValues);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save timesheet");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitForApproval() {
    setActionLoading(true);
    try {
      const res = await adminFetch("/api/admin/timesheets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id,
              approverKind: timesheet?.approverKind ?? "PM",
              ...(timesheet?.approverKind === "CLIENT_CONTACT" && timesheet.projectClientContactId
                ? { projectClientContactId: timesheet.projectClientContactId }
                : {}),
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to submit"));
      const detail = await adminFetch(`/api/admin/timesheets/${id}`).then((r) => r.json());
      setTimesheet(detail.data as TimesheetFormValues);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setActionLoading(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await adminFetch(
        `/api/admin/timesheets/export?timesheetId=${encodeURIComponent(id)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(messageFromApiError(data, "Failed to export timesheet"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheet-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  async function approve() {
    if (!window.confirm("Do you want to continue to approve?")) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to approve"));
      setTimesheet(data.data as TimesheetFormValues);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function reject(reason: string) {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to reject"));
      setTimesheet(data.data as TimesheetFormValues);
      setShowReject(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  const status = timesheet?.status ?? "DRAFT";
  const awaitingClient =
    status === "SUBMITTED" && timesheet?.approverKind === "CLIENT_CONTACT";
  const pmCanAct = Boolean(timesheet?.canApprove);
  const canSubmitTimesheet = Boolean(timesheet?.canSubmit) && isEffectiveProjectMember;

  return (
    <ProjectManagementGuard>
      <div>
        <Link href="/timesheets" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to timesheets
        </Link>

        {timesheet ? (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        ) : null}

        {awaitingClient ? (
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            Waiting for client approval
            {timesheet.approverLabel ? ` (${timesheet.approverLabel})` : ""} in the{" "}
            <strong>TBOS workspace</strong> (Timesheet approvals). PM approve/reject is disabled for this submission.
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : loadError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        ) : !timesheet ? (
          <p className="text-sm text-gray-400">Timesheet not found.</p>
        ) : (
          <TimesheetForm
            defaults={timesheet}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            readOnly={status !== "DRAFT"}
            showSubmitForApproval={canSubmitTimesheet}
            submitForApprovalLoading={actionLoading}
            onSubmitForApproval={() => void submitForApproval()}
            footerActions={
              pmCanAct ? (
                <>
                  <button
                    type="button"
                    onClick={() => void approve()}
                    disabled={actionLoading}
                    className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    disabled={actionLoading}
                    className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              ) : null
            }
          />
        )}

        {showReject ? (
          <RejectDialog
            onCancel={() => setShowReject(false)}
            onConfirm={(reason) => void reject(reason)}
            saving={actionLoading}
          />
        ) : null}
      </div>
    </ProjectManagementGuard>
  );
}
