"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";

type Row = { id: string; title: string; detail: string; href: string };

type HomeData = {
  dateLabel?: string;
  kpis: {
    openPipeline: { amount: number; deals: number };
    wonThisMonth: { amount: number; deals: number };
    overdueInvoices: { amount: number; count: number };
    renewals60: { count: number; amount: number };
  };
  followUps: Row[];
  dealsAttention: Row[];
  waitingApproval: Row[];
  invoicesChase: Row[];
  newLeads: Row[];
  supportRequests: Row[];
};

function money(amount: number) {
  return `$${Math.round(amount || 0).toLocaleString("en-AU")}`;
}

function todayLongLabel() {
  return new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function firstNameFrom(name: string | null | undefined, email: string) {
  const n = name?.trim();
  if (n) return n.split(/\s+/)[0] ?? n;
  return email.split("@")[0] || "there";
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-[180px] flex-1 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-gray-900">
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
    </div>
  );
}

function WidgetCard({
  title,
  count,
  href,
  rows,
}: {
  title: string;
  count: number;
  href: string;
  rows: Row[];
}) {
  return (
    <section className="min-w-[280px] flex-1 rounded-2xl border border-zinc-200 bg-white p-[18px] dark:border-zinc-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-zinc-900">
            {count}
          </span>
        </div>
        <Link
          href={href}
          className="rounded-full border border-zinc-200 px-3 py-1 text-[13px] text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Open
        </Link>
      </div>
      {!rows.length ? (
        <p className="py-4 text-sm text-zinc-400">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 3).map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 text-sm">
              <Link href={row.href} className="min-w-0 font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                {row.title}
              </Link>
              <span className="shrink-0 text-[13px] text-zinc-500 dark:text-zinc-400">{row.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Home widgets screen from TIBOSX CRM Screens – 1 Home (widgets).html */
export function HomeWidgets() {
  const { userName, email, sessionLoaded, canAccessSales } = useAdminSession();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = useMemo(() => firstNameFrom(userName, email || ""), [userName, email]);
  const dateLabel = useMemo(() => todayLongLabel(), []);

  useEffect(() => {
    if (!sessionLoaded || !canAccessSales) return;
    setLoading(true);
    void adminFetch("/api/admin/crm/home-widgets")
      .then((res) => res.json())
      .then((body) => setData((body.data ?? null) as HomeData | null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionLoaded, canAccessSales]);

  if (!sessionLoaded) return null;

  if (!canAccessSales) {
    return (
      <p className="text-sm text-zinc-500">
        Home widgets are available for Sales workspaces.{" "}
        <Link href="/my-workspace" className="underline">
          Open personal home
        </Link>
      </p>
    );
  }

  const kpis = data?.kpis ?? {
    openPipeline: { amount: 0, deals: 0 },
    wonThisMonth: { amount: 0, deals: 0 },
    overdueInvoices: { amount: 0, count: 0 },
    renewals60: { count: 0, amount: 0 },
  };

  return (
    <div className="relative space-y-5 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
            Hi {firstName}, everything waiting on you today
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{data?.dateLabel || dateLabel}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-gray-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Customise widgets
        </button>
      </div>

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-white" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3.5">
            <KpiCard
              label="Open pipeline"
              value={money(kpis.openPipeline.amount)}
              sub={`${kpis.openPipeline.deals} deal${kpis.openPipeline.deals === 1 ? "" : "s"}`}
            />
            <KpiCard
              label="Won this month"
              value={money(kpis.wonThisMonth.amount)}
              sub={`${kpis.wonThisMonth.deals} deal${kpis.wonThisMonth.deals === 1 ? "" : "s"}`}
            />
            <KpiCard
              label="Overdue invoices"
              value={money(kpis.overdueInvoices.amount)}
              sub={`${kpis.overdueInvoices.count} invoice${kpis.overdueInvoices.count === 1 ? "" : "s"}`}
            />
            <KpiCard
              label="Renewals in 60 days"
              value={String(kpis.renewals60.count)}
              sub={money(kpis.renewals60.amount)}
            />
          </div>

          <div className="flex flex-wrap gap-3.5">
            <WidgetCard
              title="Follow-ups due"
              count={data?.followUps.length ?? 0}
              href="/opportunities"
              rows={data?.followUps ?? []}
            />
            <WidgetCard
              title="Deals needing attention"
              count={data?.dealsAttention.length ?? 0}
              href="/opportunities"
              rows={data?.dealsAttention ?? []}
            />
            <WidgetCard
              title="Waiting on approval"
              count={data?.waitingApproval.length ?? 0}
              href="/quotes"
              rows={data?.waitingApproval ?? []}
            />
          </div>

          <div className="flex flex-wrap gap-3.5">
            <WidgetCard
              title="Invoices to chase"
              count={data?.invoicesChase.length ?? 0}
              href="/invoices?due=overdue"
              rows={data?.invoicesChase ?? []}
            />
            <WidgetCard
              title="New leads"
              count={data?.newLeads.length ?? 0}
              href="/leads"
              rows={data?.newLeads ?? []}
            />
            <WidgetCard
              title="Support and requests"
              count={data?.supportRequests.length ?? 0}
              href="/support-tickets"
              rows={data?.supportRequests ?? []}
            />
          </div>
        </>
      )}

      <Link
        href="/home"
        aria-label="Ask AI"
        className="fixed bottom-7 right-7 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
      >
        <Sparkles className="h-6 w-6" />
      </Link>
    </div>
  );
}
