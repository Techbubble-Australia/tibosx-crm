"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Building2, Home, Settings, Users } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type TenantMe = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  region?: string;
  isPlatformAdmin?: boolean;
};

type Props = {
  showPersonalHome?: boolean;
  personalHomeHref?: string;
  showClientHome?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "TB";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Wireframe header workspace chip:
 * [TB] TechBubble Workspace ⌄  — single line, pill border.
 */
export function TenantWorkspaceMenu({
  showPersonalHome,
  personalHomeHref = "/my-workspace",
  showClientHome,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tenant, setTenant] = useState<TenantMe | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void adminFetch("/api/admin/crm/tenants/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        const data = body?.data as TenantMe | undefined;
        if (data?.tenantName) setTenant(data);
        else setTenant({ tenantId: "", tenantSlug: "techbubble", tenantName: "TechBubble" });
      })
      .catch(() => {
        setTenant({ tenantId: "", tenantSlug: "techbubble", tenantName: "TechBubble" });
      });
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const name = tenant?.tenantName?.trim() || "TechBubble";
  const badge = initials(name);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${name} Workspace`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-gray-950 text-[10px] font-bold leading-none tracking-wide text-white dark:bg-white dark:text-gray-950">
          {badge}
        </span>
        <span className="hidden items-baseline gap-1.5 whitespace-nowrap sm:inline-flex">
          <span className="text-sm font-semibold text-gray-950 dark:text-gray-100">{name}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Workspace</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-1.5 w-60 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</p>
            {tenant?.tenantSlug ? (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{tenant.tenantSlug}</p>
            ) : null}
          </div>
          {showPersonalHome ? (
            <Link
              href={personalHomeHref}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              <Home className="h-4 w-4" />
              Personal home
            </Link>
          ) : null}
          {showClientHome ? (
            <Link
              href="/workspace/client"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              <Building2 className="h-4 w-4" />
              Client home
            </Link>
          ) : null}
          <Link
            href="/settings/crm/workspace"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Workspace settings
          </Link>
          {tenant?.isPlatformAdmin ? (
            <Link
              href="/settings/crm/tenants"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              <Users className="h-4 w-4" />
              Tenants console
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
