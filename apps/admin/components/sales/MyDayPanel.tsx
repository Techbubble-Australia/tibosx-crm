"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type MyDayData = {
  overdueNextSteps: Array<{
    id: string;
    name: string;
    nextStep: string | null;
    nextStepDue: string | null;
    client: { id: string; name: string } | null;
    stage: string | null;
  }>;
  dueSoon: Array<{
    id: string;
    name: string;
    nextStep: string | null;
    nextStepDue: string | null;
    client: { id: string; name: string } | null;
  }>;
  newLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    email: string;
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
};

function formatDay(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function Section({
  title,
  empty,
  children,
  full,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900" : "min-w-0"}>
      <h4
        className={
          full
            ? "mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100"
            : "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
        }
      >
        {title}
      </h4>
      {empty ? (
        <p className="text-xs text-gray-400">None</p>
      ) : (
        <ul className={full ? "space-y-2" : "space-y-1.5"}>{children}</ul>
      )}
    </div>
  );
}

type MyDayPanelProps = {
  /** compact = home widget; full = dedicated My day page */
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

  const limit = full ? 50 : 5;

  const body =
    loading && !data ? (
      <div className="flex h-24 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    ) : !data ? (
      <p className="text-sm text-gray-400">Unable to load my-day.</p>
    ) : (
      <div className={full ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5"}>
        <Section title="Due today / Overdue next steps" empty={!data.overdueNextSteps.length && !data.dueSoon.length} full={full}>
          {data.overdueNextSteps.slice(0, limit).map((o) => (
            <li key={`overdue-${o.id}`} className={full ? "text-sm" : "text-xs"}>
              <Link href={`/opportunities/${o.id}`} className="font-medium text-red-700 hover:underline dark:text-red-400">
                {o.name}
              </Link>
              <span className="text-gray-500">
                {" "}
                · {formatDay(o.nextStepDue)}
                {o.nextStep ? ` · ${o.nextStep}` : ""}
                {o.client?.name ? ` · ${o.client.name}` : ""}
              </span>
            </li>
          ))}
          {data.dueSoon.slice(0, limit).map((o) => (
            <li key={`soon-${o.id}`} className={full ? "text-sm" : "text-xs"}>
              <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                {o.name}
              </Link>
              <span className="text-gray-500">
                {" "}
                · due {formatDay(o.nextStepDue)}
                {o.nextStep ? ` · ${o.nextStep}` : ""}
              </span>
            </li>
          ))}
        </Section>
        <Section title="New leads" empty={!data.newLeads.length} full={full}>
          {data.newLeads.slice(0, limit).map((l) => (
            <li key={l.id} className={full ? "text-sm" : "text-xs"}>
              <Link href="/leads" className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                {l.name}
              </Link>
              <span className="text-gray-500"> · {l.company || l.email}</span>
            </li>
          ))}
        </Section>
        <Section title="Closing this month" empty={!data.closingThisMonth.length} full={full}>
          {data.closingThisMonth.slice(0, limit).map((o) => (
            <li key={o.id} className={full ? "text-sm" : "text-xs"}>
              <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                {o.name}
              </Link>
              <span className="text-gray-500">
                {" "}
                · {o.currency} {Math.round(o.amount).toLocaleString()}
                {o.probability != null ? ` · ${o.probability}%` : ""}
                {o.client?.name ? ` · ${o.client.name}` : ""}
              </span>
            </li>
          ))}
        </Section>
        <Section title="Timesheets and contracts attention" empty={!data.contractBurn.length} full={full}>
          {data.contractBurn.slice(0, limit).map((c) => (
            <li key={c.id} className={full ? "text-sm" : "text-xs"}>
              <Link href={`/contracts/${c.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-400">
                {c.contractNumber}
              </Link>
              <span className="text-gray-500">
                {" "}
                · {pct(c.burnPct)} burned
                {c.client?.name ? ` · ${c.client.name}` : ""}
                {c.title ? ` · ${c.title}` : ""}
              </span>
            </li>
          ))}
        </Section>
      </div>
    );

  if (full) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sales · My day</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overdue steps, new leads, closings, and contract burn.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/sales/my-day"
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Open My day
          </Link>
          <Link href="/leads" className="text-xs font-medium text-gray-500 hover:underline dark:text-gray-400">
            Open leads
          </Link>
        </div>
      </div>
      {body}
    </section>
  );
}
