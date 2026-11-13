"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProjectsTable, Section, type Overview } from "@/components/client-workspace/shared";

/** Every project the client is linked to (Access or timesheet approver), from Project Management → Projects. */
export default function ClientProjectsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminFetch("/api/admin/client-workspace?view=projects")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to load projects");
        setData((body as { data: Overview }).data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
        <p className="mt-1 text-sm text-gray-500">{data.client.name}</p>
      </div>
      <Section title="Projects" subtitle="Your TechBubble engagements, with how far through each one is today">
        <ProjectsTable projects={data.projects} />
      </Section>
    </div>
  );
}
