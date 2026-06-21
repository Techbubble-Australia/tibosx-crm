"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm } from "@/components/jobs/JobForm";
import { adminFetch } from "@/lib/admin-api";

export default function NewJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(payload: Record<string, unknown>) {
    setIsLoading(true);
    try {
      const res = await adminFetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create job");
      router.push("/jobs");
    } catch (error) {
      console.error(error);
      alert("Failed to create job listing");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/jobs" className="rounded p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">New Job Listing</h2>
          <p className="text-sm text-gray-500">Add an open position to the careers page</p>
        </div>
      </div>

      <JobForm
        mode="create"
        onSubmit={onSubmit}
        isLoading={isLoading}
        cancelHref="/jobs"
        submitLabel="Create Job Listing"
      />
    </div>
  );
}
