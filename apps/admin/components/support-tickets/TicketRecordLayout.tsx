"use client";

import Link from "next/link";
import { FolderOpen, ExternalLink } from "lucide-react";
import { TicketStatusBadge } from "@/lib/ticket-status-styles";
import { formatTicketAuditLine, type TicketAuditRow } from "@/lib/ticket-audit-display";

export type TicketBreadcrumb = { label: string; href?: string };

type LayoutProps = {
  breadcrumbs: TicketBreadcrumb[];
  ticketNumber: string;
  subject: React.ReactNode;
  status: string;
  projectLabel?: string | null;
  projectHref?: string | null;
  headerActions?: React.ReactNode;
  attributesBar: React.ReactNode;
  description: React.ReactNode;
  conversation: React.ReactNode;
  attachments: React.ReactNode;
  resolution: React.ReactNode;
  createdBy?: { name: string; email?: string } | null;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: { name: string; email?: string } | null;
  auditLogs?: TicketAuditRow[];
};

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </section>
  );
}

export function TicketRecordLayout({
  breadcrumbs,
  ticketNumber,
  subject,
  status,
  projectLabel,
  projectHref,
  headerActions,
  attributesBar,
  description,
  conversation,
  attachments,
  resolution,
  createdBy,
  createdAt,
  updatedAt,
  updatedBy,
  auditLogs,
}: LayoutProps) {
  const projectDisplay = projectLabel?.trim() || null;

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {breadcrumbs.map((crumb, i) => (
          <span key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 ? <span className="text-gray-300 dark:text-gray-600">/</span> : null}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-sky-600 hover:underline dark:hover:text-sky-400">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {subject}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{ticketNumber}</span>
            <TicketStatusBadge status={status} />
          </div>
          {projectDisplay ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <span className="text-gray-500">Project:</span>
              {projectHref ? (
                <Link
                  href={projectHref}
                  className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
                >
                  {projectDisplay.includes(" — ") ? projectDisplay.split(" — ").pop() : projectDisplay}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : (
                <span className="font-medium text-gray-800 dark:text-gray-200">{projectDisplay}</span>
              )}
            </p>
          ) : null}
        </div>
        {headerActions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{headerActions}</div> : null}
      </div>

      <section className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-4">
        {attributesBar}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            {description}
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            {attachments}
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            {conversation}
          </section>
        </div>

        <div className="space-y-4">
          <SidebarCard title="Ticket details">
            <dl className="space-y-3 text-sm">
              <DetailRow label="Created" value={formatPersonWhen(createdBy?.name, createdAt)} />
              <DetailRow label="Updated" value={formatPersonWhen(updatedBy?.name, updatedAt)} />
            </dl>
          </SidebarCard>
          <SidebarCard title="Resolution">{resolution}</SidebarCard>
          {auditLogs && auditLogs.length > 0 ? (
            <SidebarCard title="Activity">
              <ul className="relative space-y-0 border-l-2 border-sky-200 pl-3 dark:border-sky-800">
                {auditLogs.slice(0, 12).map((log) => (
                  <li key={log.id} className="relative pb-3 last:pb-0">
                    <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-sky-500" />
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{formatTicketAuditLine(log)}</p>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatWhen(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function formatPersonWhen(name?: string | null, at?: string) {
  const who = name?.trim() || "—";
  const when = formatWhen(at);
  if (who === "—" && when === "—") return "—";
  if (when === "—") return who;
  if (who === "—") return when;
  return `${who} · ${when}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

export function TicketAttributeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
