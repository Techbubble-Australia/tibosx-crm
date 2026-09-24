"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  const router = useRouter();
  const { userId } = useAdminSession();
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create project");
      const created = data.data as { id: string };
      router.push(`/projects/${created.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProjectManagementGuard requireManageProjects>
      <div>
        <Link href="/projects" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">New project</h2>
        <ProjectForm defaults={{}} defaultProjectManagerId={userId} onSubmit={handleSubmit} isSaving={isSaving} />
      </div>
    </ProjectManagementGuard>
  );
}
