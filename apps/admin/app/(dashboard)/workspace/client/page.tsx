"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SortableTh, toggleSortKey, type SortDir } from "@/components/ui/SortableTh";
import { Loader2, Paperclip } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";
import { anyEffectiveRole } from "@/lib/admin-roles";
import { useAdminSession } from "@/contexts/AdminSessionContext";
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

type InvoiceSortKey = "invoiceNumber" | "clientName" | "contractTitle" | "reference" | "issueDate" | "dueDate" | "amount" | "status";
type InvoiceStatusFilter = "" | "DRAFT" | "AWAITING_PAYMENT" | "PAID" | "OVERDUE";

const invoiceStatusLabel = (inv: Overview["invoices"][number]) => (inv.overdue ? "OVERDUE" : inv.status);

export default function ClientWorkspacePage() {
  const router = useRouter();
  const {
    role,
    additionalRoles,
    sessionLoaded,
    canAccessClientWorkspace,
    canAccessClientProjects,
  } = useAdminSession();
  const [clientId, setClientId] = useState("");
  const [currencyChoice, setCurrencyChoice] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceStatusFilter>("");
  const [invoiceSort, setInvoiceSort] = useState<{ key: InvoiceSortKey; dir: SortDir }>({ key: "issueDate", dir: "desc" });
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isClientUser =
    anyEffectiveRole(role, additionalRoles, ["client"]) &&
    !anyEffectiveRole(role, additionalRoles, ["admin"]);

  useEffect(() => {
    if (!sessionLoaded || !isClientUser) return;
    if (canAccessClientWorkspace) return;
    router.replace(canAccessClientProjects ? "/workspace/projects" : "/workspace/timesheets/submitted");
  }, [
    sessionLoaded,
    isClientUser,
    canAccessClientWorkspace,
    canAccessClientProjects,
    router,
  ]);

  useEffect(() => {
    if (isClientUser && sessionLoaded && !canAccessClientWorkspace) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (currencyChoice) params.set("currency", currencyChoice);
    const qs = params.toString();
    void adminFetch(`/api/admin/client-workspace${qs ? `?${qs}` : ""}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error || "Failed to load the client workspace");
        setData((body as { data: Overview }).data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load the client workspace"))
      .finally(() => setLoading(false));
  }, [clientId, currencyChoice, isClientUser, sessionLoaded, canAccessClientWorkspace]);

  const sortedInvoices = useMemo(() => {
    const rows = (data?.invoices ?? []).filter((inv) => {
      if (!invoiceStatusFilter) return true;
      const status = invoiceStatusLabel(inv);
      // Overdue invoices are still awaiting payment.
      if (invoiceStatusFilter === "AWAITING_PAYMENT") {
        return status === "AWAITING_PAYMENT" || status === "OVERDUE";
      }
      return status === invoiceStatusFilter;
    });
    const { key, dir } = invoiceSort;
    rows.sort((a, b) => {
      let cmp: number;
      if (key === "amount") cmp = a.amount - b.amount;
      else if (key === "status") cmp = invoiceStatusLabel(a).localeCompare(invoiceStatusLabel(b));
      else cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, { numeric: true, sensitivity: "base" });
      if (cmp === 0) cmp = a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true });
      return dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [data, invoiceSort, invoiceStatusFilter]);

  const sortInvoices = (key: InvoiceSortKey) => setInvoiceSort((s) => toggleSortKey(key, s.key, s.dir));

  const chartMax = useMemo(
    () => Math.max(1, ...(data?.chart ?? []).map((m) => m.paid + m.awaiting + m.draft)),
    [data],
  );

  if (isClientUser && sessionLoaded && !canAccessClientWorkspace) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
  const allClients = data.client.id === "all";
  const currencies = data.currencies ?? [];
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
            Snapshot as of {day(data.today)}. Invoices shown are those issued since {day(data.financialYearStart)};
            amounts are in {currency} and include GST.
            {currencies.length > 1 ? ` Totals only count ${currency} invoices; switch currency to see the others.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.clients.length > 1 ? (
            <select
              value={data.client.id}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              aria-label="Choose client"
            >
              {data.allClientsOption ? <option value="all">All</option> : null}
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : null}
          {currencies.length > 1 ? (
            <select
              value={currency}
              onChange={(e) => setCurrencyChoice(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
              aria-label="Choose currency"
              title="Totals and the chart are shown in one currency at a time"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : null}
        </div>
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
          <div className="mt-6">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                Status
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value as InvoiceStatusFilter)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
                  aria-label="Filter invoices by status"
                >
                  <option value="">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="AWAITING_PAYMENT">Awaiting payment</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PAID">Paid</option>
                </select>
              </label>
              {invoiceStatusFilter ? (
                <span className="text-xs text-gray-500">
                  Showing {sortedInvoices.length} of {data.invoices.length}
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                  <SortableTh label="Invoice" sortKey="invoiceNumber" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  {allClients ? (
                    <SortableTh label="Client" sortKey="clientName" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  ) : null}
                  <SortableTh label="Contract" sortKey="contractTitle" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  <SortableTh label="Reference" sortKey="reference" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  <SortableTh label="Issued" sortKey="issueDate" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  <SortableTh label="Due" sortKey="dueDate" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  <SortableTh label="Amount" sortKey="amount" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3 text-right" />
                  <SortableTh label="Status" sortKey="status" activeKey={invoiceSort.key} dir={invoiceSort.dir} onSort={sortInvoices} className="py-2 pr-3" />
                  <th className="py-2"><span className="sr-only">Invoice copy</span></th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={allClients ? 9 : 8} className="py-4 text-sm text-gray-400">
                      No invoices match this status.
                    </td>
                  </tr>
                ) : null}
                {sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="whitespace-nowrap py-2 pr-3 font-medium">{inv.invoiceNumber}</td>
                    {allClients ? <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.clientName}</td> : null}
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.contractTitle}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{inv.reference || "—"}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.issueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3">{day(inv.dueDate)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{money(inv.amount, inv.currency)}</td>
                    <td className="py-2 pr-3"><Pill status={invoiceStatusLabel(inv)} /></td>
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
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No invoices issued yet this financial year.</p>
        )}
      </Section>

      <Section title="Projects" subtitle="Your TechBubble engagements, with how far through each one is today">
        <ProjectsTable projects={data.projects} />
      </Section>

      <Section
        title="Timesheets"
        subtitle={
          <>
            Monthly timesheets for your engagements: awaiting your approval, plus approved ones for this month and last month.
            <span className="mt-1 block">
              Approved {approvedHours} h · Awaiting approval {kpis.timesheetsAwaiting.hours} h
            </span>
          </>
        }
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
