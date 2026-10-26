"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/jobs/JobForm";
import { adminFetch } from "@/lib/admin-api";

function NewJobPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const defaults = useMemo(
    () => ({
      clientId: searchParams.get("clientId")?.trim() || undefined,
      opportunityId: searchParams.get("opportunityId")?.trim() || undefined,
    }),
    [searchParams],
  );

  const cancelHref = defaults.opportunityId
    ? `/opportunities/${defaults.opportunityId}`
    : "/jobs/active";

  async function onSubmit(payload: Record<string, unknown>) {
    setIsLoading(true);
    try {
      const res = await adminFetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message =
          typeof (err as { error?: string }).error === "string"
            ? (err as { error: string }).error
            : "Failed to create job listing";
        throw new Error(message);
      }
      const created = await res.json();
      if (defaults.opportunityId && created?.data?.id) {
        router.push(`/jobs/${created.data.id}`);
        return;
      }
      const published = Boolean(created?.data?.published ?? payload.published ?? true);
      router.push(published ? "/jobs/active" : "/jobs/inactive");
    } catch (error) {
      console.error(error);
      appAlert(error instanceof Error ? error.message : "Failed to create job listing");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href={cancelHref} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">New Job Listing</h2>
          <p className="text-sm text-gray-500">
            {defaults.opportunityId
              ? "Create a job listing linked to this opportunity"
              : "Add an open position to the careers page"}
          </p>
        </div>
      </div>

      <JobForm
        mode="create"
        defaults={defaults}
        onSubmit={onSubmit}
        isLoading={isLoading}
        cancelHref={cancelHref}
        submitLabel="Create Job Listing"
      />
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <NewJobPageInner />
    </Suspense>
  );
}
