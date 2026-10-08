"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";

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
        <textarea
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reject reason"
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
  const { isProjectMember, canManageProjects } = useAdminSession();
  const [timesheet, setTimesheet] = useState<TimesheetFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    void adminFetch(`/api/admin/timesheets/${id}`)
      .then((r) => r.json())
      .then((data) => setTimesheet(data.data as TimesheetFormValues))
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
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save timesheet");
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
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to submit");
      const detail = await adminFetch(`/api/admin/timesheets/${id}`).then((r) => r.json());
      setTimesheet(detail.data as TimesheetFormValues);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit");
    } finally {
      setActionLoading(false);
    }
  }

  async function approve() {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/timesheets/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to approve");
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
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to reject");
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
  const pmCanAct = canManageProjects && status === "SUBMITTED" && !awaitingClient;

  return (
    <ProjectManagementGuard>
      <div>
        <Link href="/timesheets" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to timesheets
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timesheet</h2>
          <div className="flex gap-2">
            {isProjectMember && status === "DRAFT" ? (
              <button
                type="button"
                onClick={() => void submitForApproval()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                <Send className="h-4 w-4" /> Submit for approval
              </button>
            ) : null}
            {pmCanAct ? (
              <>
                <button
                  type="button"
                  onClick={() => void approve()}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setShowReject(true)}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            ) : null}
          </div>
        </div>

        {awaitingClient ? (
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
            Waiting for client approval
            {timesheet.approverLabel ? ` (${timesheet.approverLabel})` : ""} in the{" "}
            <strong>client support portal</strong> (Timesheet approvals). PM approve/reject is disabled for this submission.
          </div>
        ) : null}

        {isLoading || !timesheet ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <TimesheetForm
            defaults={timesheet}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            readOnly={status !== "DRAFT"}
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
