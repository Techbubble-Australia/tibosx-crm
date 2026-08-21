"use client";

import { Suspense } from "react";
import { OpportunitiesListPage } from "@/components/opportunities/OpportunitiesListPage";

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <OpportunitiesListPage />
    </Suspense>
  );
}
