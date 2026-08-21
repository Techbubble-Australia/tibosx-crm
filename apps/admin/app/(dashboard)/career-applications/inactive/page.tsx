"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CareerApplicationsList } from "@/components/jobs/CareerApplicationsList";

function InactiveCareerApplicationsInner() {
  const searchParams = useSearchParams();
  const jobListingId = searchParams.get("jobListingId")?.trim() || undefined;
  return <CareerApplicationsList jobPublished={false} jobListingId={jobListingId} />;
}

export default function InactiveCareerApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <InactiveCareerApplicationsInner />
    </Suspense>
  );
}
