"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ContractForm, type ContractFormValues } from "@/components/contracts/ContractForm";

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [defaults, setDefaults] = useState<ContractFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    void adminFetch(`/api/admin/contracts/${id}`)
      .then((res) => res.json())
      .then((data) => setDefaults(data.data as ContractFormValues))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [id]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update contract");
      setDefaults(data.data as ContractFormValues);
      router.push("/contracts");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update contract");
    } finally {
      setIsSaving(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">Contract not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contracts" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Contract</h2>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ContractForm key={defaults.id} defaults={defaults} onSubmit={handleSubmit} isSaving={isSaving} />
      </div>
    </div>
  );
}
