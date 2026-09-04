"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { OpportunityFields, readOpportunityFormData } from "@/components/opportunities/OpportunityFields";

export default function NewOpportunityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetClientId = searchParams.get("clientId")?.trim() ?? "";
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const payload = readOpportunityFormData(formData);
      const res = await adminFetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      router.push("/opportunities");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create opportunity");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/opportunities" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Opportunity</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <OpportunityFields presetClientId={presetClientId} />
        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Opportunity
        </button>
      </form>
    </div>
  );
}
