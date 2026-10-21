"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { workspaceFetch } from "@/lib/workspace-fetch";
import { messageFromApiError } from "@/lib/api-error";
import { TimesheetForm, type TimesheetFormValues } from "@/components/timesheets/TimesheetForm";

export default function WorkspaceTimesheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [timesheet, setTimesheet] = useState<TimesheetFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLoadError(null);
    setIsLoading(true);
    void workspaceFetch(`/timesheets/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(messageFromApiError(data, r.status === 403 ? "You cannot view this timesheet" : "Timesheet not found"));
        }
        setTimesheet(data.data as TimesheetFormValues);
      })
      .catch((error) => {
        setTimesheet(null);
        setLoadError(error instanceof Error ? error.message : "Failed to load timesheet");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const backHref =
    timesheet?.status === "APPROVED" ? "/workspace/timesheets/approved" : "/workspace/timesheets/submitted";

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
        <TimesheetForm defaults={timesheet} readOnly isSaving={false} onSubmit={async () => {}} />
      ) : null}
    </div>
  );
}
