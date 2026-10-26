"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { JobForm, type JobFormDefaults } from "@/components/jobs/JobForm";
import { JobApplicationsPanel } from "@/components/jobs/JobApplicationsPanel";
import { JobAiInsightsPanel } from "@/components/jobs/JobAiInsightsPanel";
import { JobMetaTagsSection } from "@/components/jobs/JobMetaTagsSection";
import { adminFetch } from "@/lib/admin-api";
import { jobListHref, jobListingsTabFromPath } from "@/lib/job-routes";

function EditJobPageInner() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [job, setJob] = useState<(JobFormDefaults & { opportunityId?: string | null; opportunityName?: string }) | null>(null);
  const [metaTags, setMetaTags] = useState<string[]>([]);

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
        if (found?.metaTags) setMetaTags(found.metaTags);
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
      router.push(listHref);
    } catch (error) {
      console.error(error);
      appAlert("Failed to update job listing");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyJob() {
    setIsCopying(true);
    try {
      const res = await adminFetch(`/api/admin/jobs/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to copy job");
      }
      const newId = data?.data?.id;
      if (typeof newId === "string") {
        router.push(`/jobs/${newId}`);
      } else {
        throw new Error("Copy succeeded but new job id was missing");
      }
    } catch (error) {
      console.error(error);
      appAlert(error instanceof Error ? error.message : "Failed to copy job listing");
    } finally {
      setIsCopying(false);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={listHref} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold">Edit Job Listing</h2>
            <p className="text-sm text-gray-500">{job.title}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void copyJob()}
          disabled={isCopying}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          Copy
        </button>
      </div>

      {job.opportunityId ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800">
          <span className="font-medium text-gray-700 dark:text-gray-300">Linked opportunity: </span>
          <Link
            href={`/opportunities/${job.opportunityId}`}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {job.opportunityName || "View opportunity"}
          </Link>
        </div>
      ) : null}

      <JobForm
        key={`${id}-${job.updatedAt ?? ""}-${job.level ?? ""}`}
        mode="edit"
        defaults={job}
        metaTags={metaTags}
        onMetaTagsChange={setMetaTags}
        hideMetaTags
        onSubmit={onSubmit}
        isLoading={isLoading}
        cancelHref={listHref}
        submitLabel="Save Changes"
      />

      <div className="mt-8 space-y-8">
        <JobMetaTagsSection metaTags={metaTags} onChange={setMetaTags} />
        <JobAiInsightsPanel jobId={id} metaTags={metaTags} />
        <JobApplicationsPanel jobId={id} jobTitle={job.title ?? ""} jobCountry={job.country ?? ""} />
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
