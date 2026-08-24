"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProfileForm, type ProfileFormValues } from "@/components/profiles/ProfileForm";

export default function EditProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<Partial<ProfileFormValues> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/profiles/${id}`);
        const data = await res.json();
        setDefaults(data.data);
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
      setDefaults(data.data);
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
      <div className="mb-6 flex items-center gap-3">
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
      <ProfileForm
        key={`${id}-${defaults.updatedAt ?? ""}`}
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
