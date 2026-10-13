"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { TimesheetForm } from "@/components/timesheets/TimesheetForm";
import { messageFromApiError } from "@/lib/api-error";

export default function NewTimesheetPage() {
  const router = useRouter();
  const { isEffectiveProjectMember, loading: sessionLoading } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !isEffectiveProjectMember) {
      router.replace("/timesheets");
    }
  }, [sessionLoading, isEffectiveProjectMember, router]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/admin/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to create timesheet"));
      const created = data.data as { id: string };
      router.push(`/timesheets/${created.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create timesheet");
    } finally {
      setIsSaving(false);
    }
  }

  if (sessionLoading || !isEffectiveProjectMember) {
    return (
      <ProjectManagementGuard>
        <p className="text-sm text-gray-400">Loading…</p>
      </ProjectManagementGuard>
    );
  }

  return (
    <ProjectManagementGuard>
      <div>
        <Link href="/timesheets" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to timesheets
        </Link>
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">New timesheet</h2>
        <TimesheetForm defaults={{}} onSubmit={handleSubmit} isSaving={isSaving} />
      </div>
    </ProjectManagementGuard>
  );
}
