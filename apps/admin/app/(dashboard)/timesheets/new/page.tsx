"use client";
import { appAlert } from "@/lib/app-alert";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";
import { MonthlyTimesheetForm } from "@/components/timesheets/MonthlyTimesheetForm";
import { messageFromApiError } from "@/lib/api-error";
import { isMonthKey } from "@/lib/timesheet-month";

type MonthlyTarget = { status: "loading" } | { status: "weekly" } | { status: "monthly"; month: string };

function NewTimesheetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateTimesheets, loading: sessionLoading } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);

  const queryProjectId = searchParams.get("projectId")?.trim() || undefined;
  const queryWeekStart = searchParams.get("weekStart")?.trim() || undefined;
  const queryMonth = searchParams.get("month")?.trim() || undefined;
  const queryMemberUserId = searchParams.get("memberUserId")?.trim() || undefined;
  const [target, setTarget] = useState<MonthlyTarget>(queryProjectId ? { status: "loading" } : { status: "weekly" });

  const initialDefaults = useMemo((): Partial<TimesheetFormValues> => {
    const next: Partial<TimesheetFormValues> = {};
    if (queryProjectId) next.projectId = queryProjectId;
    if (queryWeekStart) next.startDate = queryWeekStart;
    if (queryMemberUserId) next.memberUserId = queryMemberUserId;
    return next;
  }, [queryProjectId, queryWeekStart, queryMemberUserId]);

  useEffect(() => {
    if (!sessionLoading && !canCreateTimesheets) {
      router.replace("/timesheets");
    }
  }, [sessionLoading, canCreateTimesheets, router]);

  /** Monthly projects use the month calendar; pick the requested month or the next open one. */
  useEffect(() => {
    if (!queryProjectId) {
      setTarget({ status: "weekly" });
      return;
    }
    let cancelled = false;
    // Keep the weekly form mounted while re-checking (it rewrites the URL as the member navigates).
    setTarget((prev) => (prev.status === "weekly" ? prev : { status: "loading" }));
    void (async () => {
      try {
        const meta = await adminFetch(
          `/api/admin/timesheets/target-meta?projectId=${encodeURIComponent(queryProjectId)}`,
        ).then((r) => r.json());
        if (cancelled) return;
        if (meta?.data?.timesheetPeriod !== "MONTHLY") {
          setTarget({ status: "weekly" });
          return;
        }
        if (isMonthKey(queryMonth)) {
          setTarget({ status: "monthly", month: queryMonth });
          return;
        }
        const entry = await adminFetch(
          `/api/admin/timesheets/entry-point?projectId=${encodeURIComponent(queryProjectId)}`,
        ).then((r) => r.json());
        if (cancelled) return;
        const row = entry?.data as { month?: string; existingTimesheetId?: string | null } | undefined;
        if (row?.existingTimesheetId) {
          router.replace(`/timesheets/${row.existingTimesheetId}`);
          return;
        }
        if (row?.month) {
          router.replace(`/timesheets/new?projectId=${encodeURIComponent(queryProjectId)}&month=${row.month}`);
          return;
        }
        setTarget({ status: "weekly" });
      } catch {
        if (!cancelled) setTarget({ status: "weekly" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryProjectId, queryMonth, router]);

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
        appAlert(messageFromApiError(data, "A timesheet already exists for this period."));
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

  if (sessionLoading || !canCreateTimesheets || target.status === "loading") {
    return (
      <ProjectManagementGuard>
        <p className="text-sm text-gray-400">Loading…</p>
      </ProjectManagementGuard>
    );
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
        {target.status === "monthly" ? (
          <MonthlyTimesheetForm
            key={`${queryProjectId}-${target.month}`}
            title="New monthly timesheet"
            defaults={{ projectId: queryProjectId, memberUserId: queryMemberUserId, status: "DRAFT", fileUrls: [], startDate: "", endDate: "" }}
            monthKey={target.month}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            canStartTimesheetForEmptyMonth
          />
        ) : (
          <TimesheetForm
            title="New Timesheet"
            defaults={initialDefaults}
            requireProjectFirst
            syncNewTimesheetQuery
            onSubmit={handleSubmit}
            isSaving={isSaving}
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
