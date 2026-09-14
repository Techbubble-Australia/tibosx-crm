"use client";

import { Suspense } from "react";
import { JobsListPage } from "@/components/jobs/JobsListPage";

export default function InactiveJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <JobsListPage
        publishedFilter={false}
        heading="Inactive job listings"
        description="Unpublished roles moved here automatically when unpublished."
      />
    </Suspense>
  );
}
