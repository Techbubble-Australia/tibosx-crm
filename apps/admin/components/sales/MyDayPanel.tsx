"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type DueItem = {
  id: string;
  name: string;
  nextStep: string | null;
  nextStepDue: string | null;
  kind: "Call" | "Task";
  overdue?: boolean;
  client: { id: string; name: string } | null;
  stage: string | null;
};

type MyDayData = {
  dateLabel?: string;
  dueToday: DueItem[];
  overdueNextSteps: DueItem[];
  dueSoon: DueItem[];
  newLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    email: string;
    source?: string;
    sourceLabel?: string;
    createdAt: string;
  }>;
  closingThisMonth: Array<{
    id: string;
    name: string;
    amount: number;
    currency: string;
    client: { id: string; name: string } | null;
    stage: string | null;
    probability: number | null;
  }>;
  contractBurn: Array<{
    id: string;
    title: string;
    contractNumber: string;
    client: { id: string; name: string } | null;
    burnPct: number;
    consumed: number;
    contractValue: number;
  }>;
  moduleAlerts?: {
    missingTimesheets: number;
    contractsExpiring: number;
    contractsExpiringList?: Array<{
      id: string;
      contractNumber: string;
      title: string;
      client: { id: string; name: string } | null;
      expiryDate: string;
    }>;
  };
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function timeOfDay(iso: string) {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function dueLabel(item: DueItem) {
  const step = item.nextStep?.trim();
  const client = item.client?.name;
  if (step && client) {
    if (step.toLowerCase().includes(client.toLowerCase())) return step;
    return `${client}: ${step}`;
  }
  if (step) return step;
  if (client) return `${client}: set next step`;
  return item.name;
}

type MyDayPanelProps = {
  /** compact = home widget; full = Sales → Dashboard (My day) */
  variant?: "compact" | "full";
};

export function MyDayPanel({ variant = "compact" }: MyDayPanelProps) {
  const full = variant === "full";
  const { canAccessSales, sessionLoaded } = useAdminSession();
  const [data, setData] = useState<MyDayData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoaded || !canAccessSales) return;
    setLoading(true);
    void adminFetch("/api/admin/crm/my-day")
      .then((res) => res.json())
      .then((body) => setData((body.data ?? null) as MyDayData | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionLoaded, canAccessSales]);

  if (!sessionLoaded || !canAccessSales) return null;

  if (loading && !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-gray-400">Unable to load my-day.</p>;
  }

  const dueItems =
    data.dueToday?.length > 0
      ? data.dueToday
      : [...(data.overdueNextSteps ?? []), ...(data.dueSoon ?? [])];
  const missingTs = data.moduleAlerts?.missingTimesheets ?? 0;
  const expiring = data.moduleAlerts?.contractsExpiring ?? 0;

  if (full) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Due today */}
        <section className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Due today</h2>
          {!dueItems.length ? (
            <p className="mt-4 text-sm text-gray-400">Nothing due today.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dueItems.slice(0, 12).map((item) => (
                <li key={`${item.overdue ? "o" : "d"}-${item.id}`} className="flex items-start gap-3 text-sm">
                  {item.overdue ? (
                    <span className="mt-0.5 shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Overdue
                    </span>
                  ) : (
                    <span className="mt-0.5 w-12 shrink-0 text-xs font-medium text-gray-500">{item.kind}</span>
                  )}
                  <Link
                    href={`/opportunities/${item.id}`}
                    className="text-gray-900 hover:underline dark:text-gray-100"
                  >
                    {dueLabel(item)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* New leads */}
        <section className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">New leads</h2>
          {!data.newLeads.length ? (
            <p className="mt-4 text-sm text-gray-400">No new leads.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.newLeads.slice(0, 8).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {lead.company || lead.name}
                      {lead.company && lead.name !== lead.company ? (
                        <span className="font-normal text-gray-500"> · {lead.name}</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-500">
                      from {lead.sourceLabel ?? lead.source ?? "manual"}, {timeOfDay(lead.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/leads?highlight=${encodeURIComponent(lead.id)}`}
                    className="shrink-0 rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Closing this month */}
        <section className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Closing this month</h2>
          {!data.closingThisMonth.length ? (
            <p className="mt-4 text-sm text-gray-400">No closings this month.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500">
                    <th className="pb-2 font-medium">Opportunity</th>
                    <th className="pb-2 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.closingThisMonth.slice(0, 10).map((opp) => (
                    <tr key={opp.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/opportunities/${opp.id}`}
                          className="font-medium text-gray-900 hover:underline dark:text-gray-100"
                        >
                          {opp.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {money(opp.amount, opp.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Timesheets and contracts */}
        <section className="border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Timesheets and contracts</h2>
          <p className="mt-1 text-xs text-gray-500">Pulled from existing TIBOSX modules.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/timesheets"
              className={`inline-flex items-center rounded px-2.5 py-1.5 text-xs font-semibold ${
                missingTs > 0
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {missingTs} missing timesheet{missingTs === 1 ? "" : "s"}
            </Link>
            <Link
              href="/contracts/active?expiring=30"
              className={`inline-flex items-center rounded px-2.5 py-1.5 text-xs font-semibold ${
                expiring > 0
                  ? "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {expiring} contract{expiring === 1 ? "" : "s"} expiring
            </Link>
          </div>
          {data.contractBurn.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
              {data.contractBurn.slice(0, 4).map((c) => (
                <li key={c.id} className="text-xs text-gray-600 dark:text-gray-400">
                  <Link href={`/contracts/${c.id}`} className="font-medium text-amber-800 hover:underline dark:text-amber-300">
                    {c.contractNumber}
                  </Link>
                  {" · "}
                  {Math.round(c.burnPct * 100)}% burned
                  {c.client?.name ? ` · ${c.client.name}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    );
  }

  // Compact home widget
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sales · My day</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Due today, new leads, closings, and module alerts.
          </p>
        </div>
        <Link
          href="/sales/my-day"
          className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Open My day
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Due today</p>
          {!dueItems.length ? (
            <p className="text-xs text-gray-400">None</p>
          ) : (
            <ul className="space-y-1.5">
              {dueItems.slice(0, 4).map((item) => (
                <li key={`c-${item.id}`} className="text-xs">
                  <Link
                    href={`/opportunities/${item.id}`}
                    className={
                      item.overdue
                        ? "font-medium text-red-700 hover:underline dark:text-red-400"
                        : "font-medium text-gray-800 hover:underline dark:text-gray-200"
                    }
                  >
                    {dueLabel(item)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">New leads</p>
          {!data.newLeads.length ? (
            <p className="text-xs text-gray-400">None</p>
          ) : (
            <ul className="space-y-1.5">
              {data.newLeads.slice(0, 4).map((l) => (
                <li key={l.id} className="text-xs">
                  <Link href="/leads" className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                    {l.company || l.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Closing</p>
          {!data.closingThisMonth.length ? (
            <p className="text-xs text-gray-400">None</p>
          ) : (
            <ul className="space-y-1.5">
              {data.closingThisMonth.slice(0, 4).map((o) => (
                <li key={o.id} className="text-xs">
                  <Link
                    href={`/opportunities/${o.id}`}
                    className="font-medium text-gray-800 hover:underline dark:text-gray-200"
                  >
                    {o.name}
                  </Link>
                  <span className="text-gray-500"> · {money(o.amount, o.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Modules</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {missingTs} missing timesheets · {expiring} contracts expiring
          </p>
        </div>
      </div>
    </section>
  );
}
