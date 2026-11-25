"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { formatCrmMoney } from "@/lib/crm-format";
import { invoicePeriod, invoiceStatusChip } from "@/lib/invoice-display";
import { CONTRACT_INVOICE_STATUS_LABELS } from "@/lib/contract-invoice-status";
import { CONTRACT_TYPE_LABELS } from "@/lib/contract-types";
import { adminFetch } from "@/lib/admin-api";
import { ContractForm, type ContractFormValues } from "@/components/contracts/ContractForm";
import { ContractActivityLogSection } from "@/components/contracts/ContractActivityLogSection";
import { contractsListPathForStatus } from "@/lib/contract-redirect";
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/contract-status";
import type { ContractActivityLogEntry } from "@/lib/contract-activity";
import {
  CONTRACT_MOVE_TO_DRAFT_REASONS,
  CONTRACT_MOVE_TO_DRAFT_REASON_LABELS,
  type ContractMoveToDraftReason,
} from "@/lib/contract-groups";

type ContractDetail = ContractFormValues & {
  status: ContractStatus;
  activityLogs?: ContractActivityLogEntry[];
  clientName?: string;
  poNumber?: string | null;
  opportunityId?: string | null;
  opportunity?: { id: string; name?: string | null } | null;
  quoteId?: string | null;
  quote?: { id: string; quoteNumber?: string | null; title?: string | null } | null;
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function MoveToDraftDialog({
  contractId,
  onCancel,
  onMoved,
}: {
  contractId: string;
  onCancel: () => void;
  onMoved: (updated: ContractDetail) => void;
}) {
  const [reason, setReason] = useState<ContractMoveToDraftReason | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      appAlert("Please select a reason.");
      return;
    }
    if (reason === "OTHER" && !otherReason.trim()) {
      appAlert("Please enter the other reason.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${contractId}/move-to-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          otherReason: reason === "OTHER" ? otherReason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to move contract to draft");
      }
      onMoved(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to move contract to draft");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Move to Draft</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This contract will be moved back to Draft status. Please provide a reason.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ContractMoveToDraftReason)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Select reason…</option>
              {CONTRACT_MOVE_TO_DRAFT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {CONTRACT_MOVE_TO_DRAFT_REASON_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          {reason === "OTHER" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Other reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                required
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Moving…" : "Move to Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditContractPage() {
  const params = useParams();
  const id = params.id as string;
  const [defaults, setDefaults] = useState<ContractDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showMoveToDraft, setShowMoveToDraft] = useState(false);

  useEffect(() => {
    void refreshContract();
  }, [id]);

  async function refreshContract() {
    setFetching(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`);
      const data = await res.json();
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(payload: Record<string, unknown>) {
    setIsSaving(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to update contract");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivate() {
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}/activate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to activate contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to activate contract");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTerminate() {
    if (!(await appConfirm("Terminate this contract?"))) return;
    setActionLoading(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${id}/terminate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to terminate contract");
      setDefaults(data.data as ContractDetail);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to terminate contract");
    } finally {
      setActionLoading(false);
    }
  }

  function handleMovedToDraft(updated: ContractDetail) {
    setDefaults(updated);
    setShowMoveToDraft(false);
  }

  const kpis = useMemo(() => {
    if (!defaults) return null;
    const value = (defaults.contractValue ?? 0) + (defaults.totalVariation ?? 0);
    const consumed = defaults.consumed ?? 0;
    const remaining =
      typeof defaults.remaining === "number" ? defaults.remaining : value - consumed;
    const consumedPct = value > 0 ? Math.round((consumed / value) * 100) : 0;
    const start = defaults.startDate ? new Date(defaults.startDate) : null;
    const elapsedDays = start ? Math.max(1, Math.round((Date.now() - start.getTime()) / 86_400_000)) : 0;
    const dailyBurn = elapsedDays > 0 && consumed > 0 ? consumed / elapsedDays : 0;
    const runwayDays = dailyBurn > 0 && remaining > 0 ? Math.round(remaining / dailyBurn) : null;
    const end = defaults.endDate ? new Date(defaults.endDate) : null;
    const daysLeft =
      end && !Number.isNaN(end.getTime()) ? Math.ceil((end.getTime() - Date.now()) / 86_400_000) : null;
    return { value, consumed, remaining, consumedPct, runwayDays, daysLeft };
  }, [defaults]);

  const burn = useMemo(() => {
    if (!defaults) return [];
    const now = new Date();
    const nowKey = now.getFullYear() * 12 + now.getMonth();
    const buckets = new Map<number, { year: number; month: number; billed: number; planned: number }>();
    const bucket = (year: number, month: number) => {
      const key = year * 12 + month;
      const existing = buckets.get(key) ?? { year, month, billed: 0, planned: 0 };
      buckets.set(key, existing);
      return existing;
    };
    for (const inv of defaults.invoices ?? []) {
      if (inv.status === "CANCELED") continue;
      const d = new Date(inv.issueDate);
      if (Number.isNaN(d.getTime())) continue;
      bucket(d.getUTCFullYear(), d.getUTCMonth()).billed += inv.amount;
    }
    for (const w of defaults.workUnitMonths ?? []) {
      const planned = (w.workUnits ?? 0) * (defaults.rate ?? 0);
      if (planned > 0) bucket(w.year, w.month).planned += planned;
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([key, b]) => {
        const future = key > nowKey;
        const current = key === nowKey;
        const amount = b.billed > 0 && !future ? b.billed : b.planned || b.billed;
        const label = `${MONTH_SHORT[b.month]}${current ? " (to date)" : future ? " (planned)" : ""}`;
        return { key, label, amount, planned: future || (b.billed === 0 && b.planned > 0), current };
      });
  }, [defaults]);

  const linkedOpportunity =
    defaults?.opportunity ??
    (defaults?.opportunityId ? { id: defaults.opportunityId, name: null } : null);
  const linkedQuote =
    defaults?.quote ?? (defaults?.quoteId ? { id: defaults.quoteId, quoteNumber: null, title: null } : null);

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults || !kpis) return <p className="text-gray-500">Contract not found.</p>;

  const listPath = contractsListPathForStatus(defaults.status);
  const activityLogs = defaults.activityLogs ?? [];
  const currency = defaults.currency || "AUD";
  const invoices = defaults.invoices ?? [];
  const burnMax = Math.max(1, ...burn.map((b) => b.amount));
  const statusColors = CONTRACT_STATUS_COLORS[defaults.status] ?? CONTRACT_STATUS_COLORS.DRAFT;
  const rateLabel =
    defaults.rate > 0
      ? `${formatCrmMoney(defaults.rate, currency)}${
          defaults.type === "T_AND_M" && defaults.unit ? ` per ${defaults.unit.toLowerCase()}` : ""
        }`
      : "—";
  const documents = (defaults.fileUrls ?? []).map((url) => ({
    url,
    name: decodeURIComponent(url.split("?")[0]?.split("/").pop() || url),
  }));
  const secondaryButton =
    "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";
  const kpiCard = "rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900";
  const kpiLabel = "text-[11px] font-medium uppercase tracking-wide text-gray-500";
  const kpiValue = "mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100";
  const kpiSub = "mt-0.5 text-xs text-gray-500 dark:text-gray-400";

  return (
    <div className="max-w-6xl space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href={listPath}
              className="mt-0.5 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Back to contracts"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {defaults.contractNumber ? `${defaults.contractNumber} · ` : ""}
                {defaults.title || "Edit Contract"}
              </h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{defaults.clientName || "—"}</span>
                {defaults.poNumber ? (
                  <>
                    <span>·</span>
                    <span>PO {defaults.poNumber}</span>
                  </>
                ) : null}
                <span>·</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {CONTRACT_TYPE_LABELS[defaults.type] ?? defaults.type}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}
                >
                  {CONTRACT_STATUS_LABELS[defaults.status]}
                </span>
                <span>·</span>
                <span>Owner {defaults.ownerName || "unassigned"}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="#contract-variations" className={secondaryButton}>
              Add variation
            </a>
            <button
              type="button"
              onClick={() => appAlert("Contract renewal workflow is coming soon.")}
              className={secondaryButton}
            >
              Renew
            </button>
            <Link
              href={`/invoices/new?contractId=${encodeURIComponent(id)}`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Create invoice
            </Link>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          {defaults.status === "DRAFT" ? (
            <button
              type="button"
              onClick={() => void handleActivate()}
              disabled={actionLoading}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
          ) : null}
          {defaults.status === "ACTIVE" ? (
            <button
              type="button"
              onClick={() => void handleTerminate()}
              disabled={actionLoading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Terminate
            </button>
          ) : null}
          {defaults.status !== "DRAFT" ? (
            <button
              type="button"
              onClick={() => setShowMoveToDraft(true)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Move to Draft
            </button>
          ) : null}
          <a href="#contract-edit" className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            Edit contract details ↓
          </a>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={kpiCard}>
          <p className={kpiLabel}>Value</p>
          <p className={kpiValue}>{formatCrmMoney(kpis.value, currency)}</p>
          <p className={kpiSub}>
            {defaults.totalVariation > 0
              ? `incl. ${formatCrmMoney(defaults.totalVariation, currency)} variations`
              : "original, no variations"}
          </p>
        </div>
        <div className={kpiCard}>
          <p className={kpiLabel}>Consumed</p>
          <p className={kpiValue}>{formatCrmMoney(kpis.consumed, currency)}</p>
          <p className={kpiSub}>{kpis.consumedPct}%</p>
        </div>
        <div className={kpiCard}>
          <p className={kpiLabel}>Remaining</p>
          <p className={`${kpiValue} ${kpis.remaining < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {kpis.remaining < 0 ? "-" : ""}
            {formatCrmMoney(Math.abs(kpis.remaining), currency)}
          </p>
          <p className={kpiSub}>
            {kpis.remaining < 0
              ? "over budget"
              : kpis.runwayDays != null
                ? `approx. ${kpis.runwayDays} days at current rate`
                : "no burn recorded yet"}
          </p>
        </div>
        <div className={kpiCard}>
          <p className={kpiLabel}>End date</p>
          <p className={kpiValue}>{formatDate(defaults.endDate)}</p>
          <p className={kpiSub}>
            {kpis.daysLeft == null
              ? "open ended"
              : kpis.daysLeft >= 0
                ? `${kpis.daysLeft} days left`
                : `ended ${Math.abs(kpis.daysLeft)} days ago`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {burn.length > 0 ? (
            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Billing and burn</h3>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Invoiced amounts by month{defaults.rate > 0 ? `, planned months at ${rateLabel}` : ""}
              </p>
              <ul className="space-y-1.5">
                {burn.map((b) => (
                  <li key={b.key} className="grid grid-cols-[7.5rem_1fr_6rem] items-center gap-3 text-xs">
                    <span className="text-gray-700 dark:text-gray-300">{b.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <span
                        className={`block h-full rounded-full ${
                          b.planned ? "bg-gray-300 dark:bg-gray-600" : "bg-gray-900 dark:bg-gray-100"
                        }`}
                        style={{ width: `${Math.max(2, Math.round((b.amount / burnMax) * 100))}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {formatCrmMoney(b.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">Invoice</th>
                      <th className="px-3 py-2 font-medium">Period</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{invoicePeriod(inv)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
                          {formatCrmMoney(inv.amount, inv.currency || currency)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusChip(inv.status)}`}
                          >
                            {CONTRACT_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Terms</h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Rate</dt>
                <dd className="text-gray-900 dark:text-gray-100">{rateLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Period</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {formatDate(defaults.startDate)} to {formatDate(defaults.endDate)}
                </dd>
              </div>
              {defaults.numberOfUnits ? (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Contracted units</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {defaults.numberOfUnits} {defaults.unit ? `${defaults.unit.toLowerCase()}s` : ""}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Owner</dt>
                <dd className="text-gray-900 dark:text-gray-100">{defaults.ownerName || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Currency</dt>
                <dd className="text-gray-900 dark:text-gray-100">{currency}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Linked</h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Opportunity</dt>
                <dd>
                  {linkedOpportunity ? (
                    <Link
                      href={`/opportunities/${linkedOpportunity.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {linkedOpportunity.name || linkedOpportunity.id}
                    </Link>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Quote</dt>
                <dd>
                  {linkedQuote ? (
                    <Link
                      href={`/quotes/${linkedQuote.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {linkedQuote.quoteNumber || linkedQuote.title || linkedQuote.id}
                    </Link>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Project</dt>
                <dd>
                  {(defaults.linkedProjects ?? []).length > 0 ? (
                    (defaults.linkedProjects ?? []).map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="mr-2 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {p.projectNumber}
                      </Link>
                    ))
                  ) : (
                    <span className="text-gray-400">None yet</span>
                  )}
                </dd>
              </div>
              {(defaults.profiles ?? []).length > 0 ? (
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Consultants</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {(defaults.profiles ?? []).map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {documents.length > 0 ? (
            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Documents</h3>
              <ul className="space-y-1.5 text-sm">
                {documents.map((doc) => (
                  <li key={doc.url} className="truncate">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <div id="contract-edit" className="scroll-mt-24 max-w-3xl space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Edit contract</h3>
          <ContractForm key={`${defaults.id}-${defaults.status}`} defaults={defaults} onSubmit={handleSubmit} isSaving={isSaving} />
        </div>
        <ContractActivityLogSection logs={activityLogs} />
      </div>
      {showMoveToDraft ? (
        <MoveToDraftDialog
          contractId={id}
          onCancel={() => setShowMoveToDraft(false)}
          onMoved={handleMovedToDraft}
        />
      ) : null}
    </div>
  );
}
