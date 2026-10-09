"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectManagementGuard } from "@/components/ProjectManagementGuard";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/ProjectForm";
import { ProjectSupportPortalCard } from "@/components/projects/ProjectSupportPortalCard";
import { ProjectSupportSetup } from "@/components/projects/ProjectSupportSetup";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isProjectMember, loading: sessionLoading } = useAdminSession();
  const [project, setProject] = useState<ProjectFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = useCallback(async () => {
    const res = await adminFetch(`/api/admin/projects/${id}`);
    const data = await res.json();
    if (res.ok) setProject(data.data as ProjectFormValues);
  }, [id]);

  useEffect(() => {
    if (sessionLoading) return;
    if (isProjectMember) {
      router.replace("/projects");
      return;
    }
    void loadProject().finally(() => setIsLoading(false));
  }, [loadProject, isProjectMember, router, sessionLoading]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save project");
      router.push("/projects");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save project");
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
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {project?.projectNumber ? `${project.projectNumber} — ${project.title}` : "Project"}
        </h2>
        {isLoading || !project ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
          {project.kind === "SUPPORT" ? (
            <ProjectSupportPortalCard
              projectId={id}
              supportOrganizationId={project.supportOrganizationId}
              supportOrganizationName={project.supportOrganizationName}
              supportOrganizationSlug={project.supportOrganizationSlug}
              onEnabled={() => void loadProject()}
            />
          ) : null}
          <ProjectSupportSetup projectId={id} project={project} onUpdated={() => void loadProject()} />
          <ProjectForm
            defaults={project}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            onMembersRefresh={() => void loadProject()}
          />
          </>
        )}
      </div>
    </ProjectManagementGuard>
  );
}
