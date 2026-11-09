"use client";
import { appAlert } from "@/lib/app-alert";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm } from "@/components/timesheets/TimesheetForm";
import { messageFromApiError } from "@/lib/api-error";
import { isMonthKey } from "@/lib/timesheet-month";

function NewTimesheetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateTimesheets, loading: sessionLoading } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const queryProjectId = searchParams.get("projectId")?.trim() || undefined;
  const queryMonth = searchParams.get("month")?.trim() || undefined;
  const queryMemberUserId = searchParams.get("memberUserId")?.trim() || undefined;
  const ready = Boolean(queryProjectId && isMonthKey(queryMonth));

  useEffect(() => {
    if (!sessionLoading && !canCreateTimesheets) {
      router.replace("/timesheets");
    }
  }, [sessionLoading, canCreateTimesheets, router]);

  /** Without a project and month, open the member's next open month (or its existing draft). */
  useEffect(() => {
    if (ready || sessionLoading || !canCreateTimesheets) return;
    let cancelled = false;
    setResolveError("");
    const query = queryProjectId ? `?projectId=${encodeURIComponent(queryProjectId)}` : "";
    void adminFetch(`/api/admin/timesheets/entry-point${query}`)
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setResolveError(messageFromApiError(data, "Could not open a timesheet"));
          return;
        }
        const row = data.data as { projectId: string; month: string; existingTimesheetId?: string | null };
        router.replace(
          row.existingTimesheetId
            ? `/timesheets/${row.existingTimesheetId}`
            : `/timesheets/new?projectId=${encodeURIComponent(row.projectId)}&month=${row.month}`,
        );
      })
      .catch(() => {
        if (!cancelled) setResolveError("Could not open a timesheet");
      });
    return () => {
      cancelled = true;
    };
  }, [ready, queryProjectId, sessionLoading, canCreateTimesheets, router]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/admin/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        const existingId = (data as { data?: { id?: string } }).data?.id;
        if (existingId) {
          router.push(`/timesheets/${existingId}`);
          return;
        }
        appAlert(messageFromApiError(data, "A timesheet already exists for this month."));
        return;
      }
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to create timesheet"));
      const created = data.data as { id: string };
      router.push(`/timesheets/${created.id}`);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to create timesheet");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProjectManagementGuard>
      <div>
        <Link
          href="/timesheets"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to timesheets
        </Link>
        {resolveError ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{resolveError}</p>
        ) : sessionLoading || !canCreateTimesheets || !ready ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <TimesheetForm
            key={`${queryProjectId}-${queryMonth}`}
            title="New timesheet"
            defaults={{ projectId: queryProjectId, memberUserId: queryMemberUserId, status: "DRAFT", fileUrls: [], startDate: "", endDate: "" }}
            monthKey={queryMonth!}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            canStartTimesheetForEmptyMonth
          />
        )}
      </div>
    </ProjectManagementGuard>
  );
}

export default function NewTimesheetPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-400">Loading…</p>}>
      <NewTimesheetPageInner />
    </Suspense>
  );
}
