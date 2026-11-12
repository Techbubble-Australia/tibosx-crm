"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";

type Overview = {
  client: { id: string; name: string };
  clients: Array<{ id: string; name: string }>;
  today: string;
  financialYearStart: string;
  currency: string;
  kpis: {
    projectsInProgress: number;
    projectsEnded: number;
    timesheetsAwaiting: { count: number; hours: number };
    awaitingPayment: { amount: number; count: number };
    overdue: { amount: number; count: number };
    dueThisMonth: { amount: number; count: number };
    paidThisYear: { amount: number; invoiced: number };
  };
  chart: Array<{ month: string; paid: number; awaiting: number; draft: number }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    reference: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    amount: number;
    balance: number;
    status: string;
    overdue: boolean;
  }>;
  projects: Array<{
    id: string;
    projectNumber: string;
    title: string;
    members: string[];
    startDate: string;
    endDate: string;
    progress: number;
    remainingDays: number | null;
    state: "IN_PROGRESS" | "ON_HOLD" | "ENDED";
  }>;
  timesheets: Array<{
    id: string;
    month: string;
    projectNumber: string;
    projectTitle: string;
    member: string;
    hours: number;
    status: string;
  }>;
  documents: Array<{ name: string; url: string; invoiceNumber: string }>;
};

function money(amount: number, currency: string, compact = false) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact && amount >= 1000 ? 1 : 2,
    notation: compact && amount >= 1000 ? "compact" : "standard",
  }).format(amount);
}

function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function monthLabel(key: string, short = false) {
  return new Date(`${key}-01T00:00:00.000Z`).toLocaleDateString("en-AU", {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  AWAITING_PAYMENT: { label: "Awaiting payment", className: "bg-amber-100 text-amber-900" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
  SUBMITTED: { label: "Submitted – awaiting approval", className: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  IN_PROGRESS: { label: "In progress", className: "bg-sky-100 text-sky-800" },
  ON_HOLD: { label: "On hold", className: "bg-gray-100 text-gray-700" },
  ENDED: { label: "Ended", className: "bg-gray-100 text-gray-600" },
};

function Pill({ status }: { status: string }) {
  const pill = STATUS_PILL[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>{pill.label}</span>;
}

function Card({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "warn" | "alert" }) {
  const valueClass = tone === "alert" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-gray-900 dark:text-gray-100";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {subtitle ? <p className="mb-4 mt-0.5 text-sm text-gray-500">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export default function ClientWorkspacePage() {
  const [clientId, setClientId] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
    void adminFetch(`/api/admin/client-workspace${qs}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to load the client workspace");
        setData((body as { data: Overview }).data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load the client workspace"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const chartMax = useMemo(
    () => Math.max(1, ...(data?.chart ?? []).map((m) => m.paid + m.awaiting + m.draft)),
    [data],
  );

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error && !data) {
    return <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>;
  }
  if (!data) return null;

  const { kpis, currency } = data;
  const awaitingTimesheets = data.timesheets.filter((t) => t.status === "SUBMITTED");
  const approvedHours = data.timesheets.filter((t) => t.status === "APPROVED").reduce((h, t) => h + t.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">TechBubble · Client workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.client.name}</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            You have {plural(kpis.projectsInProgress, "project")} in progress and{" "}
            <strong>{money(kpis.awaitingPayment.amount, currency)}</strong> awaiting payment, with{" "}
            {plural(kpis.overdue.count, "invoice")} overdue.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Snapshot as of {day(data.today)}. Invoices shown are those issued since {day(data.financialYearStart)}; amounts
            are in {currency} and include GST.
          </p>
        </div>
        {data.clients.length > 1 ? (
          <select
            value={data.client.id}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
            aria-label="Choose client"
          >
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Projects in progress" value={String(kpis.projectsInProgress)} hint={`${kpis.projectsEnded} ended`} />
        <Card
          label="Timesheets awaiting approval"
          value={String(kpis.timesheetsAwaiting.count)}
          hint={`${kpis.timesheetsAwaiting.hours} h to approve`}
          tone={kpis.timesheetsAwaiting.count ? "warn" : "default"}
        />
        <Card
          label="Awaiting payment"
          value={money(kpis.awaitingPayment.amount, currency)}
          hint={plural(kpis.awaitingPayment.count, "invoice")}
        />
        <Card
          label="Overdue"
          value={money(kpis.overdue.amount, currency)}
          hint={`${plural(kpis.overdue.count, "invoice")} past due date`}
          tone={kpis.overdue.count ? "alert" : "default"}
        />
        <Card
          label="Payment due this month"
          value={money(kpis.dueThisMonth.amount, currency)}
          hint={plural(kpis.dueThisMonth.count, "invoice")}
        />
        <Card
          label="Paid this year"
          value={money(kpis.paidThisYear.amount, currency)}
          hint={`of ${money(kpis.paidThisYear.invoiced, currency)} invoiced`}
        />
      </div>

      <Section title="Invoices" subtitle="Invoice status for the last 6 months">
        <div className="flex h-44 items-end gap-3 border-b border-gray-100 pb-1 dark:border-gray-800">
          {data.chart.map((m) => {
            const total = m.paid + m.awaiting + m.draft;
            return (
              <div
                key={m.month}
                className="flex min-w-[3rem] flex-1 flex-col items-center justify-end gap-1"
                title={`${monthLabel(m.month)} · Paid ${money(m.paid, currency)} · Awaiting ${money(m.awaiting, currency)} · Draft ${money(m.draft, currency)}`}
              >
                <span className="text-[11px] tabular-nums text-gray-600">{total ? money(total, currency, true) : ""}</span>
                <div className="flex h-32 w-full max-w-10 flex-col-reverse overflow-hidden rounded-t">
                  <div className="bg-green-600" style={{ height: `${(m.paid / chartMax) * 100}%` }} />
                  <div className="bg-amber-400" style={{ height: `${(m.awaiting / chartMax) * 100}%` }} />
                  <div className="bg-gray-300" style={{ height: `${(m.draft / chartMax) * 100}%` }} />
                </div>
                <span className="text-[11px] text-gray-500">{monthLabel(m.month, true)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Paid</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Awaiting payment</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-300" /> Draft (being prepared)</span>
        </div>
        {data.invoices.length ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="py-2 pr-3">Invoice</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Issued</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3 text-right">Balance</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="whitespace-nowrap py-2 pr-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.reference || "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.issueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.dueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{money(inv.amount, inv.currency)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">
                      {inv.balance ? money(inv.balance, inv.currency) : "—"}
                    </td>
                    <td className="py-2"><Pill status={inv.overdue ? "OVERDUE" : inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No invoices issued yet this financial year.</p>
        )}
      </Section>

      <Section title="Projects" subtitle="Your TechBubble engagements, with how far through each one is today">
        {data.projects.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Progress</th>
                  <th className="py-2 pr-3">Remaining</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-medium">{p.projectNumber} · {p.title}</td>
                    <td className="py-2 pr-3">{p.members.join(", ") || "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(p.startDate)} – {day(p.endDate)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className={`h-full rounded-full ${p.state === "ENDED" ? "bg-gray-400" : "bg-black dark:bg-white"}`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-gray-600">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 tabular-nums">
                      {p.remainingDays == null ? "—" : plural(p.remainingDays, "day")}
                    </td>
                    <td className="py-2"><Pill status={p.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No projects yet.</p>
        )}
      </Section>

      <Section
        title="Timesheets"
        subtitle={`Monthly timesheets for your engagements: awaiting your approval, plus approved ones for this month and last month. Approved ${approvedHours} h · Awaiting approval ${kpis.timesheetsAwaiting.hours} h.`}
      >
        {data.timesheets.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Project</th>
                  <th className="py-2 pr-3">Member</th>
                  <th className="py-2 pr-3 text-right">Hours</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.timesheets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="whitespace-nowrap py-2 pr-3">{monthLabel(t.month)}</td>
                    <td className="py-2 pr-3">{t.projectNumber} · {t.projectTitle}</td>
                    <td className="py-2 pr-3">{t.member}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{t.hours}</td>
                    <td className="py-2"><Pill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No timesheets to show yet.</p>
        )}
        {awaitingTimesheets.length ? (
          <p className="mt-3 text-xs text-gray-500">Timesheets waiting for you can be approved under Approve/Reject Timesheets.</p>
        ) : null}
      </Section>

      <Section title="Documents" subtitle="Invoice copies and other files shared with you">
        {data.documents.length ? (
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {data.documents.map((doc, i) => (
              <li key={`${doc.url}-${i}`} className="flex items-center gap-2 py-2">
                <FileText className="h-4 w-4 text-gray-400" aria-hidden />
                <a href={resolveDocumentHref(doc.url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                  {doc.name}
                </a>
                <span className="text-xs text-gray-500">· {doc.invoiceNumber}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No documents have been shared yet.</p>
        )}
      </Section>
    </div>
  );
}
