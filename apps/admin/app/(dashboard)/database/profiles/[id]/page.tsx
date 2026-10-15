"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProfileForm, type ProfileFormValues } from "@/components/profiles/ProfileForm";
import { useAdminSession } from "@/contexts/AdminSessionContext";

export default function EditProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<Partial<ProfileFormValues> | null>(null);
  const [mappedUserId, setMappedUserId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const { canManageUsers } = useAdminSession();

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/profiles/${id}`);
        const data = await res.json();
        const row = data.data as ProfileFormValues & {
          mappedUserId?: string | null;
        };
        setDefaults(row);
        setMappedUserId(row.mappedUserId ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [id]);

  async function handleSubmit(payload: ProfileFormValues) {
    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to update profile");
      }
      const data = await res.json();
      const row = data.data as ProfileFormValues & { mappedUserId?: string | null };
      setDefaults(row);
      setMappedUserId(row.mappedUserId ?? null);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 4000);
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

  if (!defaults) {
    return <p className="text-gray-500">Profile not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/database/profiles" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {defaults.firstName} {defaults.lastName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageUsers ? (
            mappedUserId ? (
              <Link
                href={`/users/${mappedUserId}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                View user record
              </Link>
            ) : (
              <Link
                href={`/users/new?${new URLSearchParams({
                  mappedProfileId: id,
                  email: defaults.email ?? "",
                  name: `${defaults.firstName ?? ""} ${defaults.lastName ?? ""}`.trim(),
                  phone: defaults.phone ?? "",
                }).toString()}`}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
              >
                <UserPlus className="h-4 w-4" />
                Create user
              </Link>
            )
          ) : null}
          {savedNotice ? (
            <p
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
              role="status"
            >
              Data saved
            </p>
          ) : null}
        </div>
      </div>
      <ProfileForm
        key={`${id}-${defaults.updatedAt ?? ""}-${defaults.careerApplications?.length ?? 0}`}
        mode="edit"
        defaults={defaults}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        cancelHref="/database/profiles"
        submitLabel="Save changes"
      />
    </div>
  );
}
