"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
import { CredentialTemplateForm, type CredentialTemplateValues } from "@/components/templates/CredentialTemplateForm";

export default function EditCredentialTemplatePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [defaults, setDefaults] = useState<CredentialTemplateValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void adminFetch(`/api/admin/credential-templates/${id}`)
      .then((r) => r.json())
      .then((data) => setDefaults(data.data as CredentialTemplateValues))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(payload: CredentialTemplateValues) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/credential-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save template");
      router.push("/settings/templates");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminOnlyGuard>
      <div>
        <Link href="/settings/templates" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </Link>
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Edit template</h2>
        {isLoading || !defaults ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <CredentialTemplateForm defaults={defaults} onSubmit={handleSubmit} isSaving={isSaving} />
        )}
      </div>
    </AdminOnlyGuard>
  );
}
