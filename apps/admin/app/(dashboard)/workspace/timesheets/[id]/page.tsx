"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { messageFromApiError } from "@/lib/api-error";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";
import { TimesheetRejectDialog } from "@/components/timesheets/TimesheetRejectDialog";

type TimesheetDetail = TimesheetFormValues & { canApprove?: boolean };

export default function WorkspaceTimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [timesheet, setTimesheet] = useState<TimesheetDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const loadTimesheet = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const r = await workspaceFetch(`/timesheets/${id}`);
      const data = await r.json();
      if (!r.ok) {
        throw new Error(messageFromApiError(data, r.status === 403 ? "You cannot view this timesheet" : "Timesheet not found"));
      }
      setTimesheet(data.data as TimesheetDetail);
    } catch (error) {
      setTimesheet(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load timesheet");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTimesheet();
  }, [loadTimesheet]);

  const backHref =
    timesheet?.status === "APPROVED" ? "/workspace/timesheets/approved" : "/workspace/timesheets/submitted";

  async function approve() {
    if (
      !(await appConfirm("You're about to approve this timesheet. Do you want to continue?"))
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await workspaceFetch(`/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to approve"));
      await loadTimesheet();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function reject(reason: string) {
    setActionLoading(true);
    try {
      const res = await workspaceFetch(`/timesheets/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to reject"));
      setShowReject(false);
      await loadTimesheet();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  const canApprove = Boolean(timesheet?.canApprove) && timesheet?.status === "SUBMITTED";

  return (
    <div>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to timesheets
      </Link>

      <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Submitted timesheet</h2>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      ) : loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : timesheet ? (
        <TimesheetForm
          defaults={timesheet}
          readOnly
          isSaving={false}
          onSubmit={async () => {}}
          footerActions={
            canApprove ? (
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
      ) : null}

      {showReject ? (
        <TimesheetRejectDialog
          onCancel={() => setShowReject(false)}
          onConfirm={(reason) => void reject(reason)}
          saving={actionLoading}
        />
      ) : null}
    </div>
  );
}
