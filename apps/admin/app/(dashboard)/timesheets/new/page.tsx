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
import { messageFromApiError } from "@/lib/api-error";

function NewTimesheetPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateTimesheets, loading: sessionLoading } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);

  const queryProjectId = searchParams.get("projectId")?.trim() || undefined;
  const queryWeekStart = searchParams.get("weekStart")?.trim() || undefined;

  const initialDefaults = useMemo((): Partial<TimesheetFormValues> => {
    const next: Partial<TimesheetFormValues> = {};
    if (queryProjectId) next.projectId = queryProjectId;
    if (queryWeekStart) next.startDate = queryWeekStart;
    return next;
  }, [queryProjectId, queryWeekStart]);

  useEffect(() => {
    if (!sessionLoading && !canCreateTimesheets) {
      router.replace("/timesheets");
    }
  }, [sessionLoading, canCreateTimesheets, router]);

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
        appAlert("A timesheet already exists for this project and week.");
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

  if (sessionLoading || !canCreateTimesheets) {
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
        <TimesheetForm
          title="New Timesheet"
          defaults={initialDefaults}
          requireProjectFirst
          syncNewTimesheetQuery
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
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
