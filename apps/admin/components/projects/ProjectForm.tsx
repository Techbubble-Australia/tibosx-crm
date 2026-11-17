"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AddProjectMemberModal } from "@/components/projects/AddProjectMemberModal";
import { ProjectTicketsSection } from "@/components/projects/ProjectTicketsSection";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { SALES_CURRENCIES } from "@/lib/opportunity-status";
import {
  PROJECT_COST_TYPES,
  PROJECT_COST_TYPE_LABELS,
  PROJECT_KINDS,
  PROJECT_KIND_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  formatProjectMonth,
  type ProjectCostType,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/project-types";
import { ProjectActivityLogSection } from "@/components/projects/ProjectActivityLogSection";
import {
  ProjectCustomerSupportSettings,
  type ClientAccessMode,
  type SupportClientContactRow,
} from "@/components/projects/ProjectCustomerSupportSettings";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { getEffectiveRoles } from "@/lib/admin-roles";
import { CurrencyInput, formatAmount } from "@/components/ui/CurrencyInput";

/** "AUD 12,500.00 · INR 220,000.00" — rows can use different currencies, so totals are per currency. */
function formatTotalsByCurrency(rows: Array<{ currency: string; amount: number }>): string {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const amount = Number(row.amount) || 0;
    if (!amount) continue;
    totals.set(row.currency || "AUD", (totals.get(row.currency || "AUD") ?? 0) + amount);
  }
  if (!totals.size) return "—";
  return [...totals].map(([currency, amount]) => `${currency} ${formatAmount(amount)}`).join(" · ");
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

const compactInputClass =
  "rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 read-only:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

export type ProjectEstimateRow = {
  id?: string;
  year: number;
  month: number;
  qty: number;
  currency: string;
  estimatedCost: number;
  costType: ProjectCostType;
};

export type ProjectActualRow = {
  id?: string;
  year: number;
  month: number;
  qty: number;
  currency: string;
  actualCost: number;
  costType: ProjectCostType;
  source?: "manual" | "timesheet";
};

export const MEMBER_RATE_FREQUENCIES = ["HOURLY", "DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"] as const;
export type MemberRateFrequency = (typeof MEMBER_RATE_FREQUENCIES)[number];

const MEMBER_RATE_FREQUENCY_LABELS: Record<MemberRateFrequency, string> = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  MONTHLY: "Monthly",
};

export type ProjectMemberRow = {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasCredentials: boolean;
  adminUserId?: string | null;
  adminUserEmail: string | null;
  rateCurrency?: string;
  rate?: number | null;
  rateFrequency?: MemberRateFrequency;
};

export type ProjectFormValues = {
  id?: string;
  projectNumber?: string;
  title: string;
  description: string;
  clientId: string;
  kind?: ProjectKind;
  status: ProjectStatus;
  projectManagerId: string;
  timesheetApproverUserId?: string;
  contractId: string | null;
  contractNumber?: string | null;
  contractVariationId?: string | null;
  budget?: number | null;
  budgetCurrency?: string | null;
  startDate: string;
  endDate: string;
  fileUrls: string[];
  estimates: ProjectEstimateRow[];
  actuals: ProjectActualRow[];
  members: ProjectMemberRow[];
  activityLogs?: Array<{
    id: string;
    action: string;
    fieldName: string | null;
    oldValue: string | null;
    newValue: string | null;
    reason: string | null;
    performedByName: string;
    createdAt: string;
  }>;
  supportOrganizationId?: string | null;
  supportOrganizationName?: string | null;
  supportOrganizationSlug?: string | null;
  clientContacts?: Array<{
    id: string;
    contactId: string;
    name: string;
    email: string;
    portalAccess: boolean;
    canApproveTimesheets: boolean;
    portalProvisioned: boolean;
  }>;
  supportGroupMembers?: Array<{
    id: string;
    projectMemberId: string | null;
    name: string;
    email: string;
    credentialsReady: boolean;
  }>;
  ticketPrefix?: string;
  ticketNumberDigits?: number;
  ticketSettingsLocked?: boolean;
  clientAccessMode?: ClientAccessMode;
};

type ClientOption = { id: string; name: string };
type ContractOption = { id: string; contractNumber: string; title: string; clientId: string };
type UserOption = { id: string; name: string | null; email: string; role: string; additionalRoles?: string[] };

type Props = {
  defaults: Partial<ProjectFormValues>;
  defaultProjectManagerId?: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
  onMembersRefresh?: () => void;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function ProjectForm({ defaults, defaultProjectManagerId, onSubmit, isSaving, onMembersRefresh }: Props) {
  const { role: sessionRole, userId: sessionUserId } = useAdminSession();
  const [title, setTitle] = useState(defaults.title ?? "");
  const [description, setDescription] = useState(defaults.description ?? "");
  const [clientId, setClientId] = useState(defaults.clientId ?? "");
  const [kind, setKind] = useState<ProjectKind>(defaults.kind ?? "DELIVERY");
  const [status, setStatus] = useState<ProjectStatus>(defaults.status ?? "DRAFT");
  const [projectManagerId, setProjectManagerId] = useState(
    defaults.projectManagerId ?? defaultProjectManagerId ?? "",
  );
  const [forCustomerSupport, setForCustomerSupport] = useState(defaults.kind === "SUPPORT");
  const [clientAccessMode, setClientAccessMode] = useState<ClientAccessMode>(
    defaults.clientAccessMode ?? "SUPPORT_AND_TIMESHEETS",
  );
  const timesheetsOnly = forCustomerSupport && clientAccessMode === "TIMESHEETS_ONLY";
  const [ticketPrefix, setTicketPrefix] = useState(defaults.ticketPrefix ?? "TKT");
  const [ticketNumberDigits, setTicketNumberDigits] = useState(defaults.ticketNumberDigits ?? 5);
  const [supportClientContacts, setSupportClientContacts] = useState<SupportClientContactRow[]>(
    ((defaults.clientContacts as Array<{
      contactId: string;
      portalAccess: boolean;
      canApproveTimesheets: boolean;
      clientWorkspaceAccess?: boolean;
    }>) ?? []).map((c) => ({
      contactId: c.contactId,
      // A listed contact is shown with Access ticked; older timesheet-only links stored it as false.
      portalAccess: true,
      canApproveTimesheets: c.canApproveTimesheets,
      clientWorkspaceAccess: c.clientWorkspaceAccess ?? true,
    })),
  );
  const [contractId, setContractId] = useState(defaults.contractId ?? "");
  const [startDate, setStartDate] = useState(toDateInput(defaults.startDate) || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(toDateInput(defaults.endDate) || new Date().toISOString().slice(0, 10));
  const [estimates, setEstimates] = useState<ProjectEstimateRow[]>(defaults.estimates ?? []);
  const [actuals, setActuals] = useState<ProjectActualRow[]>(defaults.actuals ?? []);
  const [members, setMembers] = useState<ProjectMemberRow[]>(defaults.members ?? []);
  const [budget, setBudget] = useState(defaults.budget != null ? String(defaults.budget) : "");
  const [budgetCurrency, setBudgetCurrency] = useState(defaults.budgetCurrency ?? "AUD");
  const [runningEstimates, setRunningEstimates] = useState(false);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  /** Keeps Qty editable as free text so clearing does not force a leading 0. */
  const [estimateQtyDrafts, setEstimateQtyDrafts] = useState<Record<number, string>>({});

  const savedRatesRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    setMembers(defaults.members ?? []);
    savedRatesRef.current = Object.fromEntries((defaults.members ?? []).map((m) => [m.id, m.rate ?? null]));
  }, [defaults.id, defaults.members]);
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  useEffect(() => {
    void Promise.all([
      adminFetch("/api/admin/clients?active=true").then((r) => r.json()),
      adminFetch("/api/admin/contracts?active=true").then((r) => r.json()),
      adminFetch("/api/admin/users").then((r) => r.json()),
    ]).then(([clientsData, contractsData, usersData]) => {
      setClients((clientsData.data as ClientOption[]) ?? []);
      setContracts((contractsData.data as ContractOption[]) ?? []);
      setUsers((usersData.data as UserOption[]) ?? []);
    });
  }, []);

  const filteredContracts = useMemo(
    () => contracts.filter((row) => !clientId || row.clientId === clientId),
    [contracts, clientId],
  );

  const pmOptions = useMemo(() => {
    const eligible = users.filter((row) => {
      const roles = getEffectiveRoles(row.role, row.additionalRoles ?? []);
      return roles.some((r) => r === "admin" || r === "project_manager");
    });
    if (defaults.projectManagerId && !eligible.some((row) => row.id === defaults.projectManagerId)) {
      const current = users.find((row) => row.id === defaults.projectManagerId);
      if (current) return [...eligible, current];
    }
    return eligible;
  }, [users, defaults.projectManagerId]);

  const canRemoveMembers =
    sessionRole === "admin" ||
    (sessionRole === "project_manager" && defaults.projectManagerId === sessionUserId);
  const canAddMembers = canRemoveMembers;

  const canEditEstimates = sessionRole === "admin" || sessionRole === "project_manager";
  const budgetLocked = Boolean(contractId);

  function updateEstimate(index: number, patch: Partial<ProjectEstimateRow>) {
    setEstimates((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  /** Prefer $/day from other personnel rows so foreign monthly rates are not treated as AUD. */
  function personnelUnitCost(excludeIndex: number, rows: ProjectEstimateRow[]): number | null {
    let totalQty = 0;
    let totalCost = 0;
    rows.forEach((row, i) => {
      if (i === excludeIndex || row.costType !== "personnel") return;
      if (row.qty <= 0 || row.estimatedCost <= 0) return;
      totalQty += row.qty;
      totalCost += row.estimatedCost;
    });
    return totalQty > 0 ? totalCost / totalQty : null;
  }

  function audDailyRateForMonth(year: number, month: number): number {
    const rated = members.filter(
      (member) => (member.rate ?? 0) > 0 && (member.rateCurrency || "AUD").toUpperCase() === "AUD",
    );
    if (!rated.length) return 0;
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    let weekdays = 0;
    for (let day = 1; day <= last; day += 1) {
      const dow = new Date(Date.UTC(year, month, day)).getUTCDay();
      if (dow !== 0 && dow !== 6) weekdays += 1;
    }
    const total = rated.reduce((sum, member) => {
      const rate = member.rate ?? 0;
      switch (member.rateFrequency ?? "DAILY") {
        case "HOURLY":
          return sum + rate * 8;
        case "WEEKLY":
          return sum + rate / 5;
        case "FORTNIGHTLY":
          return sum + rate / 10;
        case "MONTHLY":
          return sum + (weekdays > 0 ? rate / weekdays : 0);
        default:
          return sum + rate;
      }
    }, 0);
    return total / rated.length;
  }

  function updateEstimateQty(index: number, raw: string) {
    setEstimateQtyDrafts((prev) => ({ ...prev, [index]: raw }));
    if (raw.trim() === "") {
      setEstimates((prev) => prev.map((row, i) => (i === index ? { ...row, qty: 0, estimatedCost: 0 } : row)));
      return;
    }
    if (!/^\d*\.?\d*$/.test(raw)) return;
    const qty = Number(raw);
    if (!Number.isFinite(qty) || qty < 0) return;
    setEstimates((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        if (qty === 0) return { ...row, qty: 0, estimatedCost: 0 };

        const siblingUnit = personnelUnitCost(index, prev);
        const prevQty = row.qty;
        let unitCost: number | null = null;
        if (prevQty > 0 && row.estimatedCost > 0) {
          const currentUnit = row.estimatedCost / prevQty;
          // Drop a bad unit cost (e.g. raw foreign monthly rate) when other months look normal.
          if (
            siblingUnit != null &&
            siblingUnit > 0 &&
            (currentUnit / siblingUnit > 2.5 || siblingUnit / currentUnit > 2.5)
          ) {
            unitCost = siblingUnit;
          } else {
            unitCost = currentUnit;
          }
        } else {
          unitCost = siblingUnit ?? audDailyRateForMonth(row.year, row.month);
        }
        const estimatedCost = Math.round((unitCost || 0) * qty * 100) / 100;
        return { ...row, qty, estimatedCost };
      }),
    );
  }

  function commitEstimateQty(index: number) {
    setEstimateQtyDrafts((prev) => {
      if (prev[index] === undefined) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function estimateMonthInputValue(row: ProjectEstimateRow) {
    const m = String(row.month + 1).padStart(2, "0");
    return `${row.year}-${m}`;
  }

  function parseEstimateMonthInput(value: string): { year: number; month: number } | null {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { year, month };
  }

  function addEstimateRow() {
    const now = new Date();
    setEstimates((prev) => [
      ...prev,
      {
        year: now.getFullYear(),
        month: now.getMonth(),
        qty: 0,
        currency: prev[0]?.currency ?? "AUD",
        estimatedCost: 0,
        // Manual rows default to Other so Run Estimates does not wipe them.
        costType: "other",
      },
    ]);
  }

  function removeEstimateRow(index: number) {
    setEstimates((prev) => prev.filter((_, i) => i !== index));
    setEstimateQtyDrafts((prev) => {
      const next: Record<number, string> = {};
      for (const [key, value] of Object.entries(prev)) {
        const i = Number(key);
        if (i < index) next[i] = value;
        else if (i > index) next[i - 1] = value;
      }
      return next;
    });
  }

  function updateActual(index: number, patch: Partial<ProjectActualRow>) {
    setActuals((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function runEstimates(options?: { reset?: boolean }) {
    if (!defaults.id) return;
    const reset = options?.reset === true;
    const ok = await appConfirm(
      reset
        ? "Replace all personnel estimate rows with the calculated days from the project dates (or contract months) × member rates? Your Qty edits on personnel rows will be lost. Other and one-time rows are kept. Rates in other currencies are converted to AUD."
        : "Fill in any missing estimate months through the project end date from member rates. Months you already edited keep their Qty and estimated cost. Rates in other currencies are converted to AUD for new months.",
      {
        title: reset ? "Reset estimates" : "Run estimates",
        confirmLabel: reset ? "Reset estimates" : "Run estimates",
      },
    );
    if (!ok) return;
    setRunningEstimates(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${defaults.id}/run-estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reset
            ? { reset: true }
            : {
                estimates: estimates.map((row) => ({
                  year: row.year,
                  month: row.month,
                  qty: row.qty,
                  estimatedCost: row.estimatedCost,
                  costType: row.costType,
                })),
              },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || (reset ? "Failed to reset estimates" : "Failed to run estimates"));
      }
      const detail = data.data as ProjectFormValues | null;
      setEstimates(detail?.estimates ?? []);
      setEstimateQtyDrafts({});
    } catch (err) {
      appAlert(err instanceof Error ? err.message : reset ? "Failed to reset estimates" : "Failed to run estimates");
    } finally {
      setRunningEstimates(false);
    }
  }

  function updateMemberLocal(memberId: string, patch: Partial<ProjectMemberRow>) {
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
  }

  async function saveMemberRate(memberId: string, patch: Partial<ProjectMemberRow>) {
    if (!defaults.id) return;
    updateMemberLocal(memberId, patch);
    setSavingMemberId(memberId);
    try {
      const res = await adminFetch(`/api/admin/projects/${defaults.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(patch.rateCurrency !== undefined ? { rateCurrency: patch.rateCurrency } : {}),
          ...(patch.rate !== undefined ? { rate: patch.rate } : {}),
          ...(patch.rateFrequency !== undefined ? { rateFrequency: patch.rateFrequency } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update member rate");
      const saved = data.data as ProjectMemberRow;
      savedRatesRef.current[memberId] = saved.rate ?? null;
      const refreshed = await adminFetch(`/api/admin/projects/${defaults.id}`).then((r) => r.json());
      const detail = refreshed.data as ProjectFormValues | undefined;
      if (detail?.actuals) setActuals(detail.actuals);
      onMembersRefresh?.();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to update member rate");
    } finally {
      setSavingMemberId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!defaults.id) return;
    if (!(await appConfirm("Remove this member from the project?"))) return;
    try {
      const res = await adminFetch(`/api/admin/projects/${defaults.id}/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to remove member");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      onMembersRefresh?.();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const nextUrls = [...fileUrls];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("document", file);
        const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
        const data = await res.json();
        const url = readUploadImageUrlFromJson(data);
        if (url) nextUrls.push(url);
      }
      setFileUrls(nextUrls);
    } catch {
      appAlert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (forCustomerSupport && !supportClientContacts.some((c) => c.portalAccess)) {
      appAlert("Tick Access for at least one client contact.");
      return;
    }
    if (forCustomerSupport && !timesheetsOnly && !ticketPrefix.trim()) {
      appAlert("Ticket prefix is required for customer support projects.");
      return;
    }
    if (forCustomerSupport && !timesheetsOnly && (ticketNumberDigits < 1 || ticketNumberDigits > 10)) {
      appAlert("Number of ticket digits must be between 1 and 10.");
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      clientId,
      kind: forCustomerSupport ? "SUPPORT" : kind,
      status,
      projectManagerId,
      contractId: contractId || null,
      startDate,
      endDate,
      fileUrls,
      ...(budgetLocked
        ? {}
        : {
            budget: budget.trim() === "" ? null : Number(budget),
            budgetCurrency: budget.trim() === "" ? null : budgetCurrency,
          }),
      estimates,
      actuals,
      forCustomerSupport,
      clientAccessMode: forCustomerSupport ? clientAccessMode : undefined,
      supportClientContacts: forCustomerSupport ? supportClientContacts : [],
      ticketPrefix: forCustomerSupport && !timesheetsOnly ? ticketPrefix.trim().toUpperCase() : undefined,
      ticketNumberDigits: forCustomerSupport && !timesheetsOnly ? ticketNumberDigits : undefined,
    });
  }

  return (
    <>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Core</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {defaults.projectNumber ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project number</label>
                <input className={`${inputClass} bg-gray-50 dark:bg-gray-900`} value={defaults.projectNumber} readOnly />
              </div>
            ) : null}
            <div className={defaults.projectNumber ? "" : "sm:col-span-2"}>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
              <textarea className={`${inputClass} min-h-[100px]`} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client <span className="text-red-500">*</span></label>
              <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                <option value="">Select client…</option>
                {clients.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project type <span className="text-red-500">*</span></label>
              <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as ProjectKind)}>
                {PROJECT_KINDS.map((value) => (
                  <option key={value} value={value}>{PROJECT_KIND_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status <span className="text-red-500">*</span></label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>{PROJECT_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project manager <span className="text-red-500">*</span></label>
              <select
                className={inputClass}
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {pmOptions.map((row) => (
                  <option key={row.id} value={row.id}>{row.name || row.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contract</label>
              {defaults.id && defaults.contractId ? (
                <Link href={`/contracts/${defaults.contractId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  {defaults.contractNumber ?? "View contract"}
                </Link>
              ) : (
                <select className={inputClass} value={contractId} onChange={(e) => setContractId(e.target.value)}>
                  <option value="">None</option>
                  {filteredContracts.map((row) => (
                    <option key={row.id} value={row.id}>{row.contractNumber} — {row.title}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Scheduling</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start date <span className="text-red-500">*</span></label>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End date <span className="text-red-500">*</span></label>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Financials</h3>
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Budget</label>
              <div className="flex gap-2">
                <div className="w-28 shrink-0">
                  <select
                    className={`${inputClass} disabled:bg-gray-50 dark:disabled:bg-gray-900`}
                    value={budgetCurrency}
                    onChange={(e) => setBudgetCurrency(e.target.value)}
                    disabled={!canEditEstimates || budgetLocked}
                    aria-label="Budget currency"
                  >
                    {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div className="min-w-0 flex-1">
                  <CurrencyInput
                    className={`${inputClass} tabular-nums read-only:bg-gray-50 dark:read-only:bg-gray-900`}
                    value={budget}
                    onChange={(n) => setBudget(n === null ? "" : String(n))}
                    readOnly={!canEditEstimates || budgetLocked}
                    placeholder={budgetLocked && !defaults.id ? "Set from the contract value on save" : "0.00"}
                    aria-label="Budget amount"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {defaults.contractVariationId
                  ? "Set from the contract variation value and kept in sync with it."
                  : budgetLocked
                    ? "Set from the total contract value and kept in sync with it."
                    : "Optional. Enter a budget for projects without a contract."}
              </p>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Total estimated cost</span>
              <p className={`${inputClass} flex items-center bg-gray-50 tabular-nums dark:bg-gray-900`}>
                {formatTotalsByCurrency(estimates.map((row) => ({ currency: row.currency, amount: row.estimatedCost })))}
              </p>
              <p className="mt-1 text-xs text-gray-500">Sum of the estimate rows below.</p>
            </div>
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Total actual cost</span>
              <p className={`${inputClass} flex items-center bg-gray-50 tabular-nums dark:bg-gray-900`}>
                {formatTotalsByCurrency(actuals.map((row) => ({ currency: row.currency, amount: row.actualCost })))}
              </p>
              <p className="mt-1 text-xs text-gray-500">Sum of the actual rows below, including approved timesheets.</p>
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimates</h4>
            {canEditEstimates && defaults.id ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runEstimates()}
                  disabled={runningEstimates}
                  className="inline-flex items-center gap-1 rounded-lg bg-black px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {runningEstimates ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Run Estimates
                </button>
                <button
                  type="button"
                  onClick={() => void runEstimates({ reset: true })}
                  disabled={runningEstimates}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium disabled:opacity-50 dark:border-gray-600"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={addEstimateRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium dark:border-gray-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Add row
                </button>
              </div>
            ) : null}
          </div>
          {canEditEstimates ? (
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Edit Qty to recalculate estimated cost. Run Estimates keeps your edits and only adds missing months. Reset rebuilds personnel Qty from project dates and member rates. Add row creates an Other cost. Save the project to keep manual changes.
            </p>
          ) : null}
          {estimates.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">
              {defaults.id
                ? "No estimate rows yet. Set member rates and click Run Estimates, or add a row manually."
                : "Save the project, add member rates, then run estimates."}
            </p>
          ) : (
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2 pr-3">Month</th>
                    <th className="py-2 pr-3">Qty (days)</th>
                    <th className="py-2 pr-3">Currency</th>
                    <th className="py-2 pr-3">Estimated cost</th>
                    <th className="py-2 pr-3">Cost type</th>
                    {canEditEstimates ? <th className="py-2 w-10" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((row, index) => (
                    <tr key={`${row.year}-${row.month}-${index}`} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-2 pr-3">
                        {canEditEstimates ? (
                          <input
                            type="month"
                            className={inputClass}
                            value={estimateMonthInputValue(row)}
                            onChange={(e) => {
                              const parsed = parseEstimateMonthInput(e.target.value);
                              if (parsed) updateEstimate(index, parsed);
                            }}
                          />
                        ) : (
                          formatProjectMonth(row.year, row.month)
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {canEditEstimates ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputClass} w-28 tabular-nums`}
                            value={estimateQtyDrafts[index] ?? String(row.qty)}
                            onChange={(e) => updateEstimateQty(index, e.target.value)}
                            onBlur={() => commitEstimateQty(index)}
                            aria-label="Estimate quantity in days"
                          />
                        ) : (
                          row.qty
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <select className={inputClass} value={row.currency} onChange={(e) => updateEstimate(index, { currency: e.target.value })}>
                          {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <CurrencyInput
                          className={`${inputClass} tabular-nums`}
                          value={row.estimatedCost}
                          onChange={(n) => updateEstimate(index, { estimatedCost: n ?? 0 })}
                          aria-label="Estimated cost"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select className={inputClass} value={row.costType} onChange={(e) => updateEstimate(index, { costType: e.target.value as ProjectCostType })}>
                          {PROJECT_COST_TYPES.map((t) => <option key={t} value={t}>{PROJECT_COST_TYPE_LABELS[t]}</option>)}
                        </select>
                      </td>
                      {canEditEstimates ? (
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => removeEstimateRow(index)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            aria-label="Remove estimate row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actuals</h4>
          {actuals.length === 0 ? (
            <p className="text-sm text-gray-400">No actuals recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2 pr-3">Month</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Currency</th>
                    <th className="py-2 pr-3">Actual cost</th>
                    <th className="py-2">Cost type</th>
                  </tr>
                </thead>
                <tbody>
                  {actuals.map((row, index) => {
                    const fromTimesheets = row.source === "timesheet";
                    return (
                      <tr key={`${row.year}-${row.month}-${row.currency}-${row.source ?? "manual"}-${index}`} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2 pr-3">
                          {formatProjectMonth(row.year, row.month)}
                          {fromTimesheets ? (
                            <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              Approved timesheets
                            </span>
                          ) : null}
                        </td>
                        {fromTimesheets ? (
                          <>
                            <td className="py-2 pr-3">{row.qty} day{row.qty === 1 ? "" : "s"}</td>
                            <td className="py-2 pr-3">{row.currency}</td>
                            <td className="py-2 pr-3 tabular-nums">{formatAmount(row.actualCost)}</td>
                            <td className="py-2">{PROJECT_COST_TYPE_LABELS[row.costType] ?? row.costType}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 pr-3">
                              <input type="number" min={0} step="0.01" className={inputClass} value={row.qty} onChange={(e) => updateActual(index, { qty: Number(e.target.value) })} />
                            </td>
                            <td className="py-2 pr-3">
                              <select className={inputClass} value={row.currency} onChange={(e) => updateActual(index, { currency: e.target.value })}>
                                {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                              </select>
                            </td>
                            <td className="py-2 pr-3">
                              <CurrencyInput
                                className={`${inputClass} tabular-nums`}
                                value={row.actualCost}
                                onChange={(n) => updateActual(index, { actualCost: n ?? 0 })}
                                aria-label="Actual cost"
                              />
                            </td>
                            <td className="py-2">
                              <select className={inputClass} value={row.costType} onChange={(e) => updateActual(index, { costType: e.target.value as ProjectCostType })}>
                                {PROJECT_COST_TYPES.map((t) => <option key={t} value={t}>{PROJECT_COST_TYPE_LABELS[t]}</option>)}
                              </select>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {defaults.id ? (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Members</h3>
              {canAddMembers ? (
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" /> Add member
                </button>
              ) : null}
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">
                Members are added when a project is created from a contract, or when a user is mapped to a profile under
                Settings → Users.
              </p>
            ) : (
              <>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
                    {members.map((member) => {
                      const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "?";
                      return (
                      <li
                        key={member.id}
                        className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={member.email}>
                              {member.email}
                              {member.phone ? <span className="whitespace-nowrap"> · {member.phone}</span> : null}
                            </p>
                            <p className="truncate text-xs">
                              {member.hasCredentials && member.adminUserId ? (
                                <Link
                                  href={`/users/${member.adminUserId}`}
                                  className="text-blue-600 hover:underline dark:text-blue-400"
                                  title="Open user record"
                                >
                                  User record: {member.adminUserEmail ?? member.email}
                                </Link>
                              ) : (
                                <span className="text-gray-400">No login yet</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pl-12 lg:pl-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Rate</span>
                            <select
                              className={`${compactInputClass} w-20`}
                              value={member.rateCurrency ?? "AUD"}
                              disabled={!canEditEstimates || savingMemberId === member.id}
                              onChange={(e) => void saveMemberRate(member.id, { rateCurrency: e.target.value })}
                              aria-label="Rate currency"
                            >
                              {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            <CurrencyInput
                              className={`${compactInputClass} w-32 text-right tabular-nums`}
                              value={member.rate ?? null}
                              readOnly={!canEditEstimates}
                              aria-label="Rate"
                              onChange={(n) => updateMemberLocal(member.id, { rate: n })}
                              onCommit={(next) => {
                                if (canEditEstimates && next !== (savedRatesRef.current[member.id] ?? null)) {
                                  void saveMemberRate(member.id, { rate: next });
                                }
                              }}
                            />
                            <span className="text-gray-400">/</span>
                            <select
                              className={`${compactInputClass} w-32`}
                              value={member.rateFrequency ?? "DAILY"}
                              disabled={!canEditEstimates || savingMemberId === member.id}
                              aria-label="Rate frequency"
                              onChange={(e) =>
                                void saveMemberRate(member.id, { rateFrequency: e.target.value as MemberRateFrequency })
                              }
                            >
                              {MEMBER_RATE_FREQUENCIES.map((f) => (
                                <option key={f} value={f}>{MEMBER_RATE_FREQUENCY_LABELS[f]}</option>
                              ))}
                            </select>
                            <span className="flex w-4 justify-center">
                              {savingMemberId === member.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-label="Saving" />
                              ) : null}
                            </span>
                          </div>
                          {canRemoveMembers ? (
                            <button
                              type="button"
                              onClick={() => void removeMember(member.id)}
                              className="ml-auto rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 lg:ml-2 dark:border-red-900 dark:text-red-400"
                              aria-label="Remove member"
                              title="Remove member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </li>
                      );
                    })}
              </ul>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Rates are used by Run Estimates and to calculate actuals from approved timesheets. Changes save automatically.
              </p>
              </>
            )}
          </section>
        ) : null}

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Files</h3>
          <input type="file" multiple onChange={(e) => void uploadFiles(e.target.files)} disabled={uploading} />
          {uploading ? <p className="mt-2 text-xs text-gray-500">Uploading…</p> : null}
          {fileUrls.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {fileUrls.map((url, index) => (
                <li key={url} className="flex items-center justify-between gap-2 text-sm">
                  <a href={resolveDocumentHref(url)} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
                    {url.split("/").pop()}
                  </a>
                  <button type="button" onClick={() => setFileUrls((prev) => prev.filter((_, i) => i !== index))} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <ProjectCustomerSupportSettings
          projectId={defaults.id}
          clientId={clientId}
          enabled={forCustomerSupport}
          onEnabledChange={setForCustomerSupport}
          mode={clientAccessMode}
          onModeChange={setClientAccessMode}
          rows={supportClientContacts}
          onRowsChange={setSupportClientContacts}
          ticketPrefix={ticketPrefix}
          onTicketPrefixChange={setTicketPrefix}
          ticketNumberDigits={ticketNumberDigits}
          onTicketNumberDigitsChange={setTicketNumberDigits}
          ticketSettingsLocked={defaults.ticketSettingsLocked}
        />

        {defaults.id && (kind === "SUPPORT" || forCustomerSupport) && !timesheetsOnly ? (
          <ProjectTicketsSection projectId={defaults.id} />
        ) : null}

        {defaults.activityLogs ? <ProjectActivityLogSection logs={defaults.activityLogs} /> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save project
          </button>
        </div>
      </form>

      {addMemberOpen && defaults.id ? (
        <AddProjectMemberModal
          projectId={defaults.id}
          onClose={() => setAddMemberOpen(false)}
          onAdded={() => {
            onMembersRefresh?.();
            setAddMemberOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
