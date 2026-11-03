"use client";
import { appAlert } from "@/lib/app-alert";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { messageFromApiError } from "@/lib/api-error";
import { UserPhotoField } from "@/components/users/UserPhotoField";
import { AdminResetMfaSection } from "@/components/users/AdminResetMfaSection";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800";

type CustomerDetail = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
  passwordNeedsReset: boolean;
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
  const [inviteLoading, setInviteLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [passwordNeedsReset, setPasswordNeedsReset] = useState(false);

  useEffect(() => {
    void adminFetch(`/api/admin/customer-users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const row = data.data as CustomerDetail;
        setDetail(row);
        setPhotoUrl(row.profilePhotoUrl);
        setPasswordNeedsReset(row.passwordNeedsReset);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSaving(true);
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
          passwordNeedsReset,
          password: String(formData.get("password") ?? "").trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save"));
      const saved = data.data as CustomerDetail;
      setDetail(saved);
      setPasswordNeedsReset(saved.passwordNeedsReset);
      const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]');
      if (passwordInput) passwordInput.value = "";
      appAlert("Customer user saved. Password updates apply to TBOS sign-in for this email.");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save");
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
          <label className="mb-1 block text-sm font-medium">Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" required defaultValue={detail.email} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input name="name" defaultValue={detail.name ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone <span className="text-red-500">*</span></label>
            <input name="phone" required defaultValue={detail.phone ?? ""} className={inputClass} />
          </div>
        </div>
        <AdminResetMfaSection
          resetUrl={`/api/admin/customer-users/${id}/reset-mfa`}
          mfaEnabled={detail.mfaEnabled}
          mfaEnrolledAt={detail.mfaEnrolledAt}
          onReset={(next) =>
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    mfaEnabled: next.mfaEnabled,
                    mfaEnrolledAt: next.mfaEnrolledAt,
                  }
                : prev,
            )
          }
        />
        <div>
          <label className="mb-1 block text-sm font-medium">New password</label>
          <input name="password" type="password" minLength={8} className={inputClass} placeholder="Leave blank to keep current" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input name="active" type="checkbox" defaultChecked={detail.active} className="h-4 w-4 rounded" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="passwordNeedsReset"
            type="checkbox"
            checked={passwordNeedsReset}
            onChange={(e) => setPasswordNeedsReset(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Password needs reset (user must change password on next login)
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={inviteLoading || !detail.active}
            onClick={() => {
              void (async () => {
                setInviteLoading(true);
                try {
                  const res = await adminFetch(`/api/admin/customer-users/${id}/invite`, { method: "POST" });
                  const data = (await res.json().catch(() => ({}))) as {
                    error?: string;
                    message?: string;
                    temporaryPassword?: string;
                  };
                  if (!res.ok) {
                    if (data.temporaryPassword) {
                      appAlert(
                        `${messageFromApiError(data, "Failed to send invite")}\n\n` +
                          "Their previous password was already replaced. Share this temporary password:\n\n" +
                          data.temporaryPassword,
                      );
                      return;
                    }
                    throw new Error(messageFromApiError(data, "Failed to send invite"));
                  }
                  appAlert(
                    (data.message || "Invite email sent with a new temporary password.") +
                      "\n\nAny earlier password no longer works.",
                  );
                } catch (error) {
                  appAlert(error instanceof Error ? error.message : "Failed to send invite");
                } finally {
                  setInviteLoading(false);
                }
              })();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600"
          >
            {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Invite user
          </button>
        </div>
      </form>
    </div>
  );
}
