"use client";

import { useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

type Props = {
  projectId: string;
  supportOrganizationId: string | null | undefined;
  supportOrganizationName: string | null | undefined;
  supportOrganizationSlug: string | null | undefined;
  onEnabled: () => void;
};

export function ProjectSupportPortalCard({
  projectId,
  supportOrganizationId,
  supportOrganizationName,
  supportOrganizationSlug,
  onEnabled,
}: Props) {
  const [enabling, setEnabling] = useState(false);

  async function enableSupportPortal() {
    setEnabling(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${projectId}/support-organization`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to enable support portal");
      }
      onEnabled();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to enable support portal");
    } finally {
      setEnabling(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support portal</h3>
      <p className="mt-1 text-sm text-gray-500">
        Link this delivery project to a support organization so clients and consultants can open tickets in TBOS workspace.
      </p>
      {supportOrganizationId ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {supportOrganizationName ?? "Linked project"}
          </span>
          {supportOrganizationSlug ? (
            <span className="font-mono text-xs text-gray-400">{supportOrganizationSlug}</span>
          ) : null}
          <span className="text-gray-500">Linked in Workspace → Support projects</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void enableSupportPortal()}
          disabled={enabling}
          className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {enabling ? "Enabling…" : "Enable support portal"}
        </button>
      )}
    </section>
  );
}
