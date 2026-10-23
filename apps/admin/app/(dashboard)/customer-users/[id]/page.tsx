"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { messageFromApiError } from "@/lib/api-error";
import { UserPhotoField } from "@/components/users/UserPhotoField";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800";

type CustomerDetail = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
  profilePhotoUrl: string | null;
  mappedClientContact: {
    clientName: string;
    name: string;
    email: string;
  } | null;
};

export default function EditCustomerUserPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    void adminFetch(`/api/admin/customer-users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const row = data.data as CustomerDetail;
        setDetail(row);
        setPhotoUrl(row.profilePhotoUrl);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await adminFetch(`/api/admin/customer-users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name") || null,
          phone: String(formData.get("phone") ?? "").trim(),
          active: formData.get("active") === "on",
          profilePhotoUrl: photoUrl,
          password: String(formData.get("password") ?? "").trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save"));
      alert("Customer user saved.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!detail) return <p className="text-gray-500">Customer user not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customer-users/active" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold">Edit customer user</h2>
      </div>
      {detail.mappedClientContact ? (
        <p className="text-sm text-gray-500">
          Linked contact: {detail.mappedClientContact.name} · {detail.mappedClientContact.clientName}
        </p>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <UserPhotoField name={detail.name} email={detail.email} photoUrl={photoUrl} onChange={setPhotoUrl} />
        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input name="email" type="email" required defaultValue={detail.email} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input name="name" defaultValue={detail.name ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone *</label>
            <input name="phone" required defaultValue={detail.phone ?? ""} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input name="password" type="password" minLength={8} className={inputClass} placeholder="Leave blank to keep current" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="active" type="checkbox" defaultChecked={detail.active} className="h-4 w-4 rounded" />
          Active
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
