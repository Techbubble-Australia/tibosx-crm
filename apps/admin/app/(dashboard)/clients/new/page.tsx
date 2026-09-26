"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { CountryFlagPicker } from "@/components/CountryFlagPicker";
import { ClientContactsField, type ClientContactInput } from "@/components/clients/ClientContactsField";
import {
  ClientStatusFields,
  clientListPathForStatus,
  readClientStatusFromForm,
} from "@/components/clients/ClientStatusFields";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

export default function NewClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultProspect = searchParams.get("prospect") === "1";
  const backHref = defaultProspect ? "/clients/prospect" : "/clients/active";
  const [isLoading, setIsLoading] = useState(false);
  const [nextOrder, setNextOrder] = useState<number | null>(null);
  const [contacts, setContacts] = useState<ClientContactInput[]>([
    { name: "", email: "", phoneCountryCode: "+61", phoneNumber: "" },
  ]);

  useEffect(() => {
    async function loadNextOrder() {
      try {
        const res = await adminFetch("/api/admin/clients/next-order");
        const data = await res.json();
        setNextOrder(data.data?.order ?? 1);
      } catch {
        setNextOrder(1);
      }
    }
    void loadNextOrder();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const status = readClientStatusFromForm(formData);
    try {
      const res = await adminFetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          website: formData.get("website") ?? "",
          country: formData.get("country"),
          status,
          contacts,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      router.push(clientListPathForStatus(status));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={backHref} className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {defaultProspect ? "New Prospect" : "New Client"}
        </h2>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name *</label>
          <input name="name" required className={inputClass} placeholder="e.g. University of Sydney" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Website</label>
          <input name="website" type="url" className={inputClass} placeholder="https://example.com" />
        </div>
        <CountryFlagPicker
          selectClassName={inputClass}
          labelClassName="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Display order: {nextOrder ?? "…"} (assigned automatically)
        </p>
        <ClientContactsField contacts={contacts} onChange={setContacts} inputClassName={inputClass} />
        <ClientStatusFields defaultProspect={defaultProspect} defaultActive inputClass={inputClass} />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {defaultProspect ? "Create Prospect" : "Create Client"}
        </button>
      </form>
    </div>
  );
}
