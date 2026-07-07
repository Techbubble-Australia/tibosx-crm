"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await adminFetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          order: parseInt(formData.get("order") as string, 10) || 0,
          active: formData.get("active") === "on",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/clients");
    } catch {
      alert("Failed to create client");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clients" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Client</h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name *</label>
          <input name="name" required className={inputClass} placeholder="e.g. University of Sydney" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Order</label>
          <input name="order" type="number" defaultValue={0} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
          <input name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          Active
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Client
        </button>
      </form>
    </div>
  );
}
