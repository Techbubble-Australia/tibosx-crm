"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";
import {
  Card,
  Pill,
  ProjectsTable,
  Section,
  day,
  money,
  monthLabel,
  plural,
  type Overview,
} from "@/components/client-workspace/shared";

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
  const full = data.scope === "full";
  const awaitingTimesheets = data.timesheets.filter((t) => t.status === "SUBMITTED");
  const approvedHours = data.timesheets.filter((t) => t.status === "APPROVED").reduce((h, t) => h + t.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">TechBubble · Client workspace</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{data.client.name}</h1>
          {full ? (
            <>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                You have {plural(kpis.projectsInProgress, "project")} in progress and{" "}
                <strong>{money(kpis.awaitingPayment.amount, currency)}</strong> awaiting payment, with{" "}
                {plural(kpis.overdue.count, "invoice")} overdue.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Snapshot as of {day(data.today)}. Invoices shown are those issued since {day(data.financialYearStart)};
                amounts are in {currency} and include GST.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                You have {plural(kpis.projectsInProgress, "project")} in progress and{" "}
                {plural(kpis.timesheetsAwaiting.count, "timesheet")} awaiting your approval.
              </p>
              <p className="mt-1 text-xs text-gray-500">Snapshot as of {day(data.today)}. Showing the projects you&apos;re assigned to.</p>
            </>
          )}
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
        {full ? (
          <>
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
          </>
        ) : null}
      </div>

      {full ? (
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
                  <th className="py-2 pr-3">Contract</th>
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Issued</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3 text-right">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2"><span className="sr-only">Invoice copy</span></th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="whitespace-nowrap py-2 pr-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.contractTitle}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.reference || "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.issueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.dueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{money(inv.amount, inv.currency)}</td>
                    <td className="py-2 pr-3"><Pill status={inv.overdue ? "OVERDUE" : inv.status} /></td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        {inv.files.map((file, i) => (
                          <a
                            key={`${file.url}-${i}`}
                            href={resolveDocumentHref(file.url)}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open ${file.name}`}
                            aria-label={`Open ${file.name} for ${inv.invoiceNumber}`}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
                          >
                            <Paperclip className="h-4 w-4" />
                          </a>
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No invoices issued yet this financial year.</p>
        )}
      </Section>
      ) : null}

      <Section title="Projects" subtitle="Your TechBubble engagements, with how far through each one is today">
        <ProjectsTable projects={data.projects} />
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

    </div>
  );
}
