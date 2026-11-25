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
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h4>
      {empty ? <p className="text-xs text-gray-400">None</p> : <ul className="space-y-1.5">{children}</ul>}
    </div>
  );
}

export function MyDayPanel() {
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

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sales · My day</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overdue steps, new leads, closings, and contract burn.
          </p>
        </div>
        <Link href="/leads" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
          Open leads
        </Link>
      </div>

      {loading && !data ? (
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
        </div>
      ) : !data ? (
        <p className="text-sm text-gray-400">Unable to load my-day.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
          <Section title="Overdue next steps" empty={!data.overdueNextSteps.length}>
            {data.overdueNextSteps.slice(0, 5).map((o) => (
              <li key={o.id} className="text-xs">
                <Link href={`/opportunities/${o.id}`} className="font-medium text-red-700 hover:underline dark:text-red-400">
                  {o.name}
                </Link>
                <span className="text-gray-500"> · {formatDay(o.nextStepDue)}</span>
              </li>
            ))}
          </Section>
          <Section title="Due soon" empty={!data.dueSoon.length}>
            {data.dueSoon.slice(0, 5).map((o) => (
              <li key={o.id} className="text-xs">
                <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                  {o.name}
                </Link>
                <span className="text-gray-500"> · {formatDay(o.nextStepDue)}</span>
              </li>
            ))}
          </Section>
          <Section title="New leads" empty={!data.newLeads.length}>
            {data.newLeads.slice(0, 5).map((l) => (
              <li key={l.id} className="text-xs">
                <Link href="/leads" className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                  {l.name}
                </Link>
                <span className="text-gray-500"> · {l.company || l.email}</span>
              </li>
            ))}
          </Section>
          <Section title="Closing this month" empty={!data.closingThisMonth.length}>
            {data.closingThisMonth.slice(0, 5).map((o) => (
              <li key={o.id} className="text-xs">
                <Link href={`/opportunities/${o.id}`} className="font-medium text-gray-800 hover:underline dark:text-gray-200">
                  {o.name}
                </Link>
                <span className="text-gray-500">
                  {" "}
                  · {o.currency} {Math.round(o.amount).toLocaleString()}
                </span>
              </li>
            ))}
          </Section>
          <Section title="Contract burn ≥80%" empty={!data.contractBurn.length}>
            {data.contractBurn.slice(0, 5).map((c) => (
              <li key={c.id} className="text-xs">
                <Link href={`/contracts/${c.id}`} className="font-medium text-amber-700 hover:underline dark:text-amber-400">
                  {c.contractNumber}
                </Link>
                <span className="text-gray-500"> · {pct(c.burnPct)}</span>
              </li>
            ))}
          </Section>
        </div>
      )}
    </section>
  );
}
