"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
import { CredentialTemplateForm, type CredentialTemplateValues } from "@/components/templates/CredentialTemplateForm";

export default function NewCredentialTemplatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(payload: CredentialTemplateValues) {
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/admin/credential-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create template");
      router.push("/settings/templates");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to create template");
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
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">New template</h2>
        <CredentialTemplateForm
          defaults={{ name: "", html: "", variables: [] }}
          onSubmit={handleSubmit}
          isSaving={isSaving}
        />
      </div>
    </AdminOnlyGuard>
  );
}
