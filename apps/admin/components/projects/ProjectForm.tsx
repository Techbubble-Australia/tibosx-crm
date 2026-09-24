"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";
import { SALES_CURRENCIES } from "@/lib/opportunity-status";
import {
  PROJECT_COST_TYPES,
  PROJECT_COST_TYPE_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  formatProjectMonth,
  type ProjectCostType,
  type ProjectStatus,
} from "@/lib/project-types";
import { GenerateCredentialsModal } from "@/components/projects/GenerateCredentialsModal";
import { ProjectActivityLogSection } from "@/components/projects/ProjectActivityLogSection";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

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
};

export type ProjectMemberRow = {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hasCredentials: boolean;
  adminUserEmail: string | null;
};

export type ProjectFormValues = {
  id?: string;
  projectNumber?: string;
  title: string;
  description: string;
  clientId: string;
  status: ProjectStatus;
  projectManagerId: string;
  contractId: string | null;
  contractNumber?: string | null;
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
};

type ClientOption = { id: string; name: string };
type ContractOption = { id: string; contractNumber: string; title: string; clientId: string };
type UserOption = { id: string; name: string | null; email: string };

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
  const [title, setTitle] = useState(defaults.title ?? "");
  const [description, setDescription] = useState(defaults.description ?? "");
  const [clientId, setClientId] = useState(defaults.clientId ?? "");
  const [status, setStatus] = useState<ProjectStatus>(defaults.status ?? "DRAFT");
  const [projectManagerId, setProjectManagerId] = useState(
    defaults.projectManagerId ?? defaultProjectManagerId ?? "",
  );
  const [contractId, setContractId] = useState(defaults.contractId ?? "");
  const [startDate, setStartDate] = useState(toDateInput(defaults.startDate) || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(toDateInput(defaults.endDate) || new Date().toISOString().slice(0, 10));
  const [estimates, setEstimates] = useState<ProjectEstimateRow[]>(defaults.estimates ?? []);
  const [actuals, setActuals] = useState<ProjectActualRow[]>(defaults.actuals ?? []);
  const [members, setMembers] = useState<ProjectMemberRow[]>(defaults.members ?? []);
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [credentialMember, setCredentialMember] = useState<ProjectMemberRow | null>(null);

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

  const pmOptions = useMemo(
    () => users.filter((row) => row.id),
    [users],
  );

  function updateEstimate(index: number, patch: Partial<ProjectEstimateRow>) {
    setEstimates((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateActual(index: number, patch: Partial<ProjectActualRow>) {
    setActuals((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
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
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      clientId,
      status,
      projectManagerId,
      contractId: contractId || null,
      startDate,
      endDate,
      fileUrls,
      estimates,
      actuals,
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
              <textarea className={`${inputClass} min-h-[100px]`} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client *</label>
              <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                <option value="">Select client…</option>
                {clients.map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status *</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((value) => (
                  <option key={value} value={value}>{PROJECT_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Project manager *</label>
              <select className={inputClass} value={projectManagerId} onChange={(e) => setProjectManagerId(e.target.value)} required>
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start date *</label>
              <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End date *</label>
              <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Financials</h3>
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estimates</h4>
          {estimates.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">Save the project to generate monthly estimate rows.</p>
          ) : (
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2 pr-3">Month</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Currency</th>
                    <th className="py-2 pr-3">Estimated cost</th>
                    <th className="py-2">Cost type</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((row, index) => (
                    <tr key={`${row.year}-${row.month}`} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-2 pr-3">{formatProjectMonth(row.year, row.month)}</td>
                      <td className="py-2 pr-3">{row.qty}</td>
                      <td className="py-2 pr-3">
                        <select className={inputClass} value={row.currency} onChange={(e) => updateEstimate(index, { currency: e.target.value })}>
                          {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" min={0} step="0.01" className={inputClass} value={row.estimatedCost} onChange={(e) => updateEstimate(index, { estimatedCost: Number(e.target.value) })} />
                      </td>
                      <td className="py-2">
                        <select className={inputClass} value={row.costType} onChange={(e) => updateEstimate(index, { costType: e.target.value as ProjectCostType })}>
                          {PROJECT_COST_TYPES.map((t) => <option key={t} value={t}>{PROJECT_COST_TYPE_LABELS[t]}</option>)}
                        </select>
                      </td>
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
                  {actuals.map((row, index) => (
                    <tr key={`${row.year}-${row.month}`} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-2 pr-3">{formatProjectMonth(row.year, row.month)}</td>
                      <td className="py-2 pr-3">
                        <input type="number" min={0} className={inputClass} value={row.qty} onChange={(e) => updateActual(index, { qty: Number(e.target.value) })} />
                      </td>
                      <td className="py-2 pr-3">
                        <select className={inputClass} value={row.currency} onChange={(e) => updateActual(index, { currency: e.target.value })}>
                          {SALES_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" min={0} step="0.01" className={inputClass} value={row.actualCost} onChange={(e) => updateActual(index, { actualCost: Number(e.target.value) })} />
                      </td>
                      <td className="py-2">
                        <select className={inputClass} value={row.costType} onChange={(e) => updateActual(index, { costType: e.target.value as ProjectCostType })}>
                          {PROJECT_COST_TYPES.map((t) => <option key={t} value={t}>{PROJECT_COST_TYPE_LABELS[t]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {defaults.id ? (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Members</h3>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400">No members yet. Assign profiles on the linked contract.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Credentials</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-2">{member.firstName} {member.lastName}</td>
                      <td className="py-2">{member.email}</td>
                      <td className="py-2">{member.hasCredentials ? member.adminUserEmail ?? "Yes" : "—"}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setCredentialMember(member)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600"
                        >
                          Generate credentials
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {credentialMember && defaults.id ? (
        <GenerateCredentialsModal
          projectId={defaults.id}
          member={credentialMember}
          onClose={() => setCredentialMember(null)}
          onSuccess={() => {
            onMembersRefresh?.();
            void adminFetch(`/api/admin/projects/${defaults.id}`)
              .then((r) => r.json())
              .then((data) => {
                const project = data.data as ProjectFormValues;
                setMembers(project.members ?? []);
              });
          }}
        />
      ) : null}
    </>
  );
}
