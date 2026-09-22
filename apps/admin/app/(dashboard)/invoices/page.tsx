"use client";

import { Suspense } from "react";
import InvoicesPageInner from "./InvoicesPageInner";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      }
    >
      <InvoicesPageInner />
    </Suspense>
  );
}
