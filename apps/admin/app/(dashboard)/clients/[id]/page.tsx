"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { CountryFlagPicker } from "@/components/CountryFlagPicker";
import { ClientContactsField, type ClientContactInput } from "@/components/clients/ClientContactsField";
import type { ClientStatus } from "@/lib/client-status";
import {
  ClientStatusFields,
  clientListPathForStatus,
  readClientStatusFromForm,
} from "@/components/clients/ClientStatusFields";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientDefaults = {
  name: string;
  website: string;
  country: string;
  order: number;
  status: ClientStatus;
  contacts: ClientContactInput[];
};

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<ClientDefaults | null>(null);
  const [contacts, setContacts] = useState<ClientContactInput[]>([]);
  const [creatingUserIndex, setCreatingUserIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/clients/${id}`);
        const data = await res.json();
        const row = data.data as ClientDefaults & { contacts?: ClientContactInput[] };
        setDefaults({
          name: row.name,
          website: row.website ?? "",
          country: row.country,
          order: row.order,
          status: row.status,
          contacts: row.contacts ?? [],
        });
        setContacts(
          (row.contacts ?? []).map((contact) => ({
            id: (contact as ClientContactInput).id,
            name: contact.name,
            email: contact.email,
            position: contact.position ?? "",
            phoneCountryCode: contact.phoneCountryCode,
            phoneNumber: contact.phoneNumber,
            adminUserId: (contact as ClientContactInput).adminUserId ?? null,
          })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [id]);

  async function createUserForContact(contact: ClientContactInput, index: number) {
    if (!contact.id) {
      alert("Save the client before creating a user for this contact.");
      return;
    }
    setCreatingUserIndex(index);
    try {
      const res = await adminFetch(`/api/admin/clients/contacts/${contact.id}/create-user`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create user");
      const adminUserId = (data.data as { adminUserId?: string }).adminUserId;
      if (adminUserId) {
        setContacts((prev) =>
          prev.map((row, i) => (i === index ? { ...row, adminUserId } : row)),
        );
        router.push(`/users/${adminUserId}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUserIndex(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const status = readClientStatusFromForm(formData);
    try {
      const res = await adminFetch(`/api/admin/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          website: formData.get("website") ?? "",
          country: formData.get("country"),
          order: parseInt(formData.get("order") as string, 10) || 0,
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
      alert(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setIsLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">Client not found.</p>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clients/active" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Client</h2>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name *</label>
          <input name="name" required defaultValue={defaults.name} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Website</label>
          <input name="website" type="url" defaultValue={defaults.website} className={inputClass} placeholder="https://example.com" />
        </div>
        <CountryFlagPicker
          defaultCountry={defaults.country}
          selectClassName={inputClass}
          labelClassName="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Order</label>
          <input name="order" type="number" defaultValue={defaults.order} className={inputClass} />
        </div>
        <ClientContactsField
          contacts={contacts}
          onChange={setContacts}
          inputClassName={inputClass}
          creatingUserIndex={creatingUserIndex}
          onCreateUser={(contact, index) => void createUserForContact(contact, index)}
        />
        <ClientStatusFields
          defaultProspect={defaults.status === "PROSPECT"}
          defaultActive={defaults.status !== "INACTIVE"}
          inputClass={inputClass}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </button>
      </form>
    </div>
  );
}
