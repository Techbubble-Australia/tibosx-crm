"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JobForm, type JobFormDefaults } from "@/components/jobs/JobForm";
import { adminFetch } from "@/lib/admin-api";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [job, setJob] = useState<JobFormDefaults | null>(null);

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
      router.push("/jobs");
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
        <Link href="/jobs" className="rounded p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Edit Job Listing</h2>
          <p className="text-sm text-gray-500">{job.title}</p>
        </div>
      </div>

      <JobForm
        key={id}
        mode="edit"
        defaults={job}
        onSubmit={onSubmit}
        isLoading={isLoading}
        cancelHref="/jobs"
        submitLabel="Save Changes"
      />
    </div>
  );
}
