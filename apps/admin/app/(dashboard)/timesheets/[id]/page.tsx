"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";
import { TimesheetRejectDialog } from "@/components/timesheets/TimesheetRejectDialog";
import { messageFromApiError } from "@/lib/api-error";

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isEffectiveProjectMember, userId, role } = useAdminSession();
  const [timesheet, setTimesheet] = useState<
    (TimesheetFormValues & { canApprove?: boolean; canSubmit?: boolean }) | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadTimesheet = useCallback(async (timesheetId: string) => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const r = await adminFetch(`/api/admin/timesheets/${timesheetId}`);
      const data = await r.json();
      if (!r.ok) {
        throw new Error(
          messageFromApiError(data, r.status === 403 ? "You cannot view this timesheet" : "Timesheet not found"),
        );
      }
      setTimesheet(data.data as TimesheetFormValues & { canApprove?: boolean; canSubmit?: boolean });
    } catch (error) {
      setTimesheet(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load timesheet");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimesheet(id);
  }, [id, loadTimesheet]);

  const handleWeekTimesheetResolved = useCallback(
    (detail: TimesheetFormValues) => {
      if (!detail.id || detail.id !== id) return;
      void loadTimesheet(detail.id);
    },
    [id, loadTimesheet],
  );

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        const existingId = (data as { data?: { id?: string } }).data?.id;
        if (existingId) {
          window.location.href = `/timesheets/${existingId}`;
          return;
        }
      }
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save timesheet"));
      setTimesheet(data.data as TimesheetFormValues);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save timesheet");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitForApproval() {
    if (
      !(await appConfirm(
        "You won't be able to make any further changes after submission. Do you want to continue?",
        { title: "Submit for approval" },
      ))
    ) {
      return;
    }
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
      appAlert(error instanceof Error ? error.message : "Failed to submit");
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
      appAlert(error instanceof Error ? error.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  }

  async function approve() {
    if (!(await appConfirm("You're about to approve this timesheet. Do you want to continue?"))) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to approve"));
      setTimesheet(data.data as TimesheetFormValues);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to approve");
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
      appAlert(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  const status = timesheet?.status ?? "DRAFT";
  const pmCanAct = Boolean(timesheet?.canApprove);
  const awaitingClient =
    status === "SUBMITTED" && timesheet?.approverKind === "CLIENT_CONTACT" && !pmCanAct;
  const canSubmitTimesheet = Boolean(timesheet?.canSubmit) && isEffectiveProjectMember;
  const viewingOthersSheet = Boolean(
    timesheet?.memberUserId && userId && timesheet.memberUserId !== userId,
  );
  const formReadOnly = status !== "DRAFT" || viewingOthersSheet;

  return (
    <ProjectManagementGuard>
      <div>
        <Link href="/timesheets" className="mb-1 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to timesheets
        </Link>

        {timesheet ? (
          <div className="mb-1 flex justify-end">
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
          <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            Waiting for approver
            {timesheet.approverLabel ? ` (${timesheet.approverLabel})` : ""} in the{" "}
            <strong>TIBOSX workspace</strong> to approve/reject this timesheet.
          </div>
        ) : null}

        {timesheet && viewingOthersSheet ? (
          <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            Viewing {timesheet.memberName ? `${timesheet.memberName}'s` : "another member's"} timesheet
            (read-only). Week navigation shows that member&apos;s records for this project.
          </div>
        ) : null}

        {loadError && !timesheet ? (
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        ) : isLoading && !timesheet ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : !timesheet ? (
          <p className="text-sm text-gray-400">Timesheet not found.</p>
        ) : (
          <TimesheetForm
            key={`${timesheet.id}-${timesheet.startDate}-${timesheet.status}`}
            defaults={timesheet}
            routeTimesheetId={id}
            onWeekTimesheetResolved={handleWeekTimesheetResolved}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            readOnly={formReadOnly}
            canStartTimesheetForEmptyWeek={!viewingOthersSheet && isEffectiveProjectMember}
            weekNavigationLoading={isLoading}
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
          <TimesheetRejectDialog
            onCancel={() => setShowReject(false)}
            onConfirm={(reason) => void reject(reason)}
            saving={actionLoading}
          />
        ) : null}
      </div>
    </ProjectManagementGuard>
  );
}
