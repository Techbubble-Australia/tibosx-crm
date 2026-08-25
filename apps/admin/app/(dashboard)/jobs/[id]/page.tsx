"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm, type JobFormDefaults } from "@/components/jobs/JobForm";
import { JobApplicationsPanel } from "@/components/jobs/JobApplicationsPanel";
import { adminFetch } from "@/lib/admin-api";
import { jobListHref, jobListingsTabFromPath } from "@/lib/job-routes";

function EditJobPageInner() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [job, setJob] = useState<JobFormDefaults | null>(null);

  const listHref = useMemo(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "active" || tabParam === "inactive") {
      return jobListHref(tabParam);
    }
    if (job?.published === false) {
      return jobListHref("inactive");
    }
    return jobListHref(jobListingsTabFromPath(pathname, tabParam));
  }, [job?.published, pathname, searchParams]);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await adminFetch("/api/admin/jobs/admin/all");
        const data = await res.json();
        const found = (data.data || []).find((j: { id: string }) => j.id === id);
        setJob(found || null);
      } catch (error) {
        console.error("Error loading job:", error);
      } finally {
        setIsFetching(false);
      }
    }
    void loadJob();
  }, [id]);

  async function onSubmit(payload: Record<string, unknown>) {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update job");
      const updated = await res.json();
      setJob(updated.data ?? job);
    } catch (error) {
      console.error(error);
      alert("Failed to update job listing");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!job) return <div className="text-gray-500">Job listing not found.</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href={listHref} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Edit Job Listing</h2>
          <p className="text-sm text-gray-500">{job.title}</p>
        </div>
      </div>

      <JobForm
        key={`${id}-${job.updatedAt ?? ""}-${job.level ?? ""}`}
        mode="edit"
        defaults={job}
        onSubmit={onSubmit}
        isLoading={isLoading}
        cancelHref={listHref}
        submitLabel="Save Changes"
      />

      <div className="mt-8">
        <JobApplicationsPanel jobId={id} />
      </div>
    </div>
  );
}

export default function EditJobPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <EditJobPageInner />
    </Suspense>
  );
}
