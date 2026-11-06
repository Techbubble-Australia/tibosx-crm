"use client";

import { History } from "lucide-react";
import { TICKET_STATUS_LABELS, formatEnvironment, formatTicketType, type TicketStatus } from "@/lib/tickets";

export type TicketLogEntry = {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  actorUserId: string | null;
  actorEmail: string;
  createdAt: string;
};

const FIELD_LABELS: Record<string, string> = {
  type: "Type",
  reportedEnvironment: "Environment",
  userDescription: "Description",
  currentUrl: "Related URL",
};

function formatValue(field: string | null, value: string | null): string {
  if (!value) return "—";
  if (field === "status") return TICKET_STATUS_LABELS[value as TicketStatus] ?? value;
  if (field === "type") return formatTicketType(value);
  if (field === "reportedEnvironment") return formatEnvironment(value);
  return value;
}

function describe(entry: TicketLogEntry): { title: string; detail?: string } {
  switch (entry.action) {
    case "CREATED":
      return { title: "Created the ticket" };
    case "STATUS_CHANGED":
      return {
        title: "Changed status",
        detail: `${formatValue("status", entry.oldValue)} → ${formatValue("status", entry.newValue)}`,
      };
    case "SCREENSHOTS_ADDED": {
      const added = Number(entry.newValue ?? 0) - Number(entry.oldValue ?? 0);
      return { title: `Added ${added > 0 ? added : ""} screenshot${added === 1 ? "" : "s"}`.replace("  ", " ") };
    }
    case "SCREENSHOT_REMOVED":
      return { title: "Removed a screenshot" };
    case "UPDATED": {
      const label = FIELD_LABELS[entry.field ?? ""] ?? entry.field ?? "Field";
      if (entry.field === "userDescription") return { title: `Edited ${label.toLowerCase()}` };
      return {
        title: `Changed ${label.toLowerCase()}`,
        detail: `${formatValue(entry.field, entry.oldValue)} → ${formatValue(entry.field, entry.newValue)}`,
      };
    }
    default:
      return { title: entry.action.replaceAll("_", " ").toLowerCase() };
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TicketActivityLog({ logs }: { logs: TicketLogEntry[] }) {
  return (
    <section className="dp-card p-3" aria-label="Activity log">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <History className="h-4 w-4 text-slate-500" aria-hidden />
        Activity
      </h2>
      {logs.length === 0 ? (
        <p className="text-xs text-slate-500">No activity yet.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-slate-200 pl-3">
          {logs.map((entry) => {
            const { title, detail } = describe(entry);
            return (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" aria-hidden />
                <p className="text-xs font-medium text-slate-800">{title}</p>
                {detail ? <p className="break-words text-[11px] text-slate-600">{detail}</p> : null}
                <p className="break-all text-[11px] text-slate-500">{entry.actorEmail}</p>
                <p className="text-[11px] text-slate-400">{formatWhen(entry.createdAt)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
