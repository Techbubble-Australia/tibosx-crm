"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProfileForm, type ProfileFormValues } from "@/components/profiles/ProfileForm";

export default function NewProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(payload: ProfileFormValues) {
    setIsLoading(true);
    try {
      const res = await adminFetch("/api/admin/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed to create profile");
      }
      router.push("/database/profiles");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/database/profiles" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New profile</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a candidate to the talent database.</p>
        </div>
      </div>
      <ProfileForm
        mode="create"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        cancelHref="/database/profiles"
        submitLabel="Create profile"
      />
    </div>
  );
}
