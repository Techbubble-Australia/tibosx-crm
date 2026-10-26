"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";
import { messageFromApiError } from "@/lib/api-error";
import { sundayOfWeek } from "@/lib/timesheet-week";

export default function NewTimesheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateTimesheets, loading: sessionLoading } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);

  const queryProjectId = searchParams.get("projectId")?.trim() || "";
  const queryWeekStart = searchParams.get("weekStart")?.trim() || "";

  const initialDefaults = useMemo((): Partial<TimesheetFormValues> => {
    if (!queryWeekStart) {
      return queryProjectId ? { projectId: queryProjectId } : {};
    }
    const mon = new Date(`${queryWeekStart}T00:00:00.000Z`);
    return {
      ...(queryProjectId ? { projectId: queryProjectId } : {}),
      startDate: mon.toISOString(),
      endDate: sundayOfWeek(mon).toISOString(),
    };
  }, [queryProjectId, queryWeekStart]);

  useEffect(() => {
    if (!sessionLoading && !canCreateTimesheets) {
      router.replace("/timesheets");
    }
  }, [sessionLoading, canCreateTimesheets, router]);

  useEffect(() => {
    if (sessionLoading || !canCreateTimesheets || queryProjectId || queryWeekStart) return;
    void adminFetch("/api/admin/timesheets/create-entry")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) return;
        const row = data.data as {
          projectId?: string;
          weekStart?: string;
          existingTimesheetId?: string | null;
        };
        if (row.existingTimesheetId) {
          router.replace(`/timesheets/${row.existingTimesheetId}`);
          return;
        }
        if (!row.projectId || !row.weekStart) return;
        const params = new URLSearchParams({
          projectId: row.projectId,
          weekStart: row.weekStart,
        });
        router.replace(`/timesheets/new?${params}`);
      })
      .catch(() => undefined);
  }, [sessionLoading, canCreateTimesheets, queryProjectId, queryWeekStart, router]);

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
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      </div>
    </ProjectManagementGuard>
  );
}
