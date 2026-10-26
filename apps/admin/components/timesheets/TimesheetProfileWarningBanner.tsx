"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export function TimesheetProfileWarningBanner() {
  const { memberOnboarding, isEffectiveProjectMember, canManageProjects, impersonation } =
    useAdminSession();

  const show =
    isEffectiveProjectMember &&
    !canManageProjects &&
    !impersonation &&
    Boolean(memberOnboarding?.profileOnboardingRequired);

  if (!show) return null;

  return (
    <div
      className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p>
        Your profile is not complete yet. You can still create and submit timesheets, but please{" "}
        <Link href="/settings/profile" className="font-medium text-amber-900 underline dark:text-amber-200">
          complete your profile
        </Link>{" "}
        when you can so payroll and compliance stay up to date.
      </p>
    </div>
  );
}
