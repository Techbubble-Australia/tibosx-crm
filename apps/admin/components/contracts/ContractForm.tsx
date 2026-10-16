"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { SALES_CURRENCIES } from "@/lib/opportunity-status";
import {
  CONTRACT_STATUS_LABELS,
  type ContractStatus,
} from "@/lib/contract-status";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_UNITS,
  CONTRACT_UNIT_LABELS,
  type ContractType,
  type ContractUnit,
} from "@/lib/contract-types";
import {
  CONTRACT_INVOICE_STATUSES,
  CONTRACT_INVOICE_STATUS_COLORS,
  CONTRACT_INVOICE_STATUS_LABELS,
  type ContractInvoiceStatus,
} from "@/lib/contract-invoice-status";
import {
  formatMonthLabel,
  generateWorkUnitMonths,
  roundWorkUnits,
  sumWorkUnits,
  type WorkUnitMonthInput,
} from "@/lib/contract-work-units";
import { validateContractDates, validateVariationDates } from "@/lib/contract-date-rules";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const readOnlyClass = "bg-gray-50 dark:bg-gray-900 cursor-not-allowed";

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export type ContractWorkUnitMonth = WorkUnitMonthInput;

export type ContractAssignedProfile = {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  category: string;
  technology: string;
  available: boolean;
};

export type ContractVariation = {
  id: string;
  variationDate: string;
  variationEndDate?: string | null;
  comments: string;
  qty?: number | null;
  unit: string | null;
  rate: number | null;
  variationValue: number;
  workUnitMonths?: ContractWorkUnitMonth[];
};

export type ContractMilestone = {
  id: string;
  description: string;
  milestoneDate: string;
  amount: number;
};

export type ContractInvoice = {
  id: string;
  invoiceNumber: string;
  reference: string;
  issueDate: string;
  dueDate: string;
  status: ContractInvoiceStatus;
  currency: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  fileUrl: string | null;
};

export type ContractFormValues = {
  id?: string;
  contractNumber?: string;
  title: string;
  clientId: string;
  type: ContractType;
  status: ContractStatus;
  ownerId?: string | null;
  ownerName?: string;
  startDate: string;
  endDate: string;
  unit: ContractUnit | "";
  numberOfUnits?: number | null;
  workUnitMonths?: ContractWorkUnitMonth[];
  currency: string;
  rate: number;
  contractValue: number;
  totalVariation: number;
  consumed: number;
  remaining: number;
  comments: string;
  fileUrls: string[];
  variations: ContractVariation[];
  profiles?: ContractAssignedProfile[];
  milestones?: ContractMilestone[];
  invoices?: ContractInvoice[];
  linkedProjects?: Array<{
    id: string;
    projectNumber: string;
    contractVariationId: string | null;
  }>;
  careerApplication?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    status: string;
    jobTitle?: string | null;
  } | null;
};

type UserOption = { id: string; name: string | null; email: string; active: boolean };

type Props = {
  defaults?: Partial<ContractFormValues>;
  defaultOwnerId?: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.getUTCFullYear() < 1971) return "";
  return date.toISOString().slice(0, 10);
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDueDateInput() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function fieldClass(editable: boolean) {
  return `${inputClass} ${editable ? "" : readOnlyClass}`;
}

function WorkUnitMonthsEditor({
  rows,
  editable,
  onChange,
}: {
  rows: WorkUnitMonthInput[];
  editable: boolean;
  onChange: (rows: WorkUnitMonthInput[]) => void;
}) {
  if (!rows.length) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Set start and end dates to generate monthly work units.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900/60">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Month</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Work units</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row) => (
            <tr key={`${row.year}-${row.month}`}>
              <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                {formatMonthLabel(row.year, row.month)}
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={roundWorkUnits(row.workUnits)}
                  readOnly={!editable}
                  onChange={(e) => {
                    const workUnits = roundWorkUnits(Number.parseFloat(e.target.value));
                    if (!Number.isFinite(workUnits) || workUnits <= 0) return;
                    onChange(
                      rows.map((item) =>
                        item.year === row.year && item.month === row.month
                          ? { ...item, workUnits }
                          : item,
                      ),
                    );
                  }}
                  className={fieldClass(editable)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContractForm({ defaults = {}, defaultOwnerId, onSubmit, isSaving }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [title, setTitle] = useState(defaults.title ?? "");
  const [clientId, setClientId] = useState(defaults.clientId ?? "");
  const [type, setType] = useState<ContractType>((defaults.type as ContractType) ?? "FIXED_PRICE");
  const [status] = useState<ContractStatus>((defaults.status as ContractStatus) ?? "DRAFT");
  const [ownerId, setOwnerId] = useState(defaults.ownerId ?? defaultOwnerId ?? "");
  const [startDate, setStartDate] = useState(toDateInput(defaults.startDate));
  const [endDate, setEndDate] = useState(toDateInput(defaults.endDate));
  const [unit, setUnit] = useState<ContractUnit | "">((defaults.unit as ContractUnit) ?? "");
  const [numberOfUnits, setNumberOfUnits] = useState(
    defaults.numberOfUnits != null ? String(defaults.numberOfUnits) : "",
  );
  const [workUnitMonths, setWorkUnitMonths] = useState<WorkUnitMonthInput[]>(
    defaults.workUnitMonths ?? [],
  );
  const [variationWorkUnitMonths, setVariationWorkUnitMonths] = useState<WorkUnitMonthInput[]>([]);
  const datesUnitRef = useRef({ startDate, endDate, unit });
  const [currency, setCurrency] = useState(defaults.currency ?? "AUD");
  const [rate, setRate] = useState(defaults.rate != null ? String(defaults.rate) : "");
  const [contractValue, setContractValue] = useState(
    defaults.contractValue != null ? String(defaults.contractValue) : "",
  );
  const [consumed, setConsumed] = useState(String(defaults.consumed ?? "0"));
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [variations, setVariations] = useState<ContractVariation[]>(defaults.variations ?? []);
  const [creatingProjectFor, setCreatingProjectFor] = useState<string | null>(null);
  const linkedProjects = defaults.linkedProjects ?? [];
  const baseProject = linkedProjects.find((row) => !row.contractVariationId);
  const [profiles, setProfiles] = useState<ContractAssignedProfile[]>(defaults.profiles ?? []);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [profileOptions, setProfileOptions] = useState<ContractAssignedProfile[]>([]);
  const [loadingProfileOptions, setLoadingProfileOptions] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<ContractMilestone[]>(defaults.milestones ?? []);
  const [invoices, setInvoices] = useState<ContractInvoice[]>(defaults.invoices ?? []);
  const [uploading, setUploading] = useState(false);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [variationDate, setVariationDate] = useState("");
  const [variationEndDate, setVariationEndDate] = useState("");
  const [variationComments, setVariationComments] = useState("");
  const [variationValue, setVariationValue] = useState("");
  const [variationQty, setVariationQty] = useState("");
  const [variationRate, setVariationRate] = useState("");
  const variationDatesRef = useRef({ variationDate: "", variationEndDate: "" });
  const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
  const [addingVariation, setAddingVariation] = useState(false);
  const [deletingVariationId, setDeletingVariationId] = useState<string | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceReference, setInvoiceReference] = useState("");
  const [invoiceIssueDate, setInvoiceIssueDate] = useState(todayDateInput());
  const [invoiceDueDate, setInvoiceDueDate] = useState(defaultDueDateInput());
  const [invoiceStatus, setInvoiceStatus] = useState<ContractInvoiceStatus>("DRAFT");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] = useState(defaults.currency ?? "AUD");
  const [invoiceQty, setInvoiceQty] = useState("");
  const [invoiceRate, setInvoiceRate] = useState("");
  const [invoiceTaxRate, setInvoiceTaxRate] = useState("10");
  const [invoiceFileUrl, setInvoiceFileUrl] = useState("");
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [savingFiles, setSavingFiles] = useState(false);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [savingEndDate, setSavingEndDate] = useState(false);

  const isEditable = status === "DRAFT";
  const canEditEndDate = status === "DRAFT" || status === "ACTIVE";
  const canEditFiles = status !== "CANCELED";
  const showRate = type !== "FIXED_PRICE";
  const rateRequired = type === "T_AND_M";
  const showNumberOfUnits = type === "T_AND_M";
  const contractValueReadOnly = type === "T_AND_M" || !isEditable;
  const contractValueRequired = type === "FIXED_PRICE";
  const numberOfUnitsReadOnly = true;
  const canManageProfiles = Boolean(defaults.id) && isEditable;
  const canAddVariations = Boolean(defaults.id) && status === "ACTIVE";
  const canAddMilestones = Boolean(defaults.id) && status === "ACTIVE" && type !== "T_AND_M";
  const canAddInvoices = Boolean(defaults.id) && (status === "ACTIVE" || status === "EXPIRED");
  const showMilestones = type !== "T_AND_M";

  const invoicePreviewAmount = useMemo(() => {
    const qty = Number.parseFloat(invoiceQty) || 0;
    const rate = Number.parseFloat(invoiceRate) || 0;
    return Math.round(qty * rate * 100) / 100;
  }, [invoiceQty, invoiceRate]);

  const invoicePreviewTaxAmount = useMemo(() => {
    const taxRate = Number.parseFloat(invoiceTaxRate) || 0;
    return invoicePreviewAmount * (taxRate / 100);
  }, [invoicePreviewAmount, invoiceTaxRate]);

  const invoicePreviewTotal = invoicePreviewAmount + invoicePreviewTaxAmount;
  const invoiceFieldsEditable = !editingInvoiceId || invoiceStatus === "DRAFT";

  const variationQtyTotal = useMemo(() => {
    if (type !== "T_AND_M") return Number.parseFloat(variationQty) || 0;
    if (variationWorkUnitMonths.length) return sumWorkUnits(variationWorkUnitMonths);
    return Number.parseFloat(variationQty) || 0;
  }, [type, variationQty, variationWorkUnitMonths]);

  const variationPreviewValue = useMemo(() => {
    if (type !== "T_AND_M") return Number.parseFloat(variationValue) || 0;
    const rateVal = Number.parseFloat(variationRate) || 0;
    return variationQtyTotal * rateVal;
  }, [type, variationValue, variationQtyTotal, variationRate]);

  const totalVariation = useMemo(
    () => variations.reduce((sum, row) => sum + row.variationValue, 0),
    [variations],
  );
  const remaining = useMemo(() => {
    const value = Number.parseFloat(contractValue) || 0;
    const used = Number.parseFloat(consumed) || 0;
    return value + totalVariation - used;
  }, [contractValue, consumed, totalVariation]);

  const ownerDisplayName =
    defaults.ownerName ||
    users.find((user) => user.id === ownerId)?.name ||
    users.find((user) => user.id === ownerId)?.email ||
    "";

  useEffect(() => {
    void adminFetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data ?? []) as Array<{ id: string; name: string; status: string }>;
        setClients(list.filter((c) => c.status === "ACTIVE" || c.status === "PROSPECT" || c.id === defaults.clientId));
      })
      .catch(console.error);
  }, [defaults.clientId]);

  useEffect(() => {
    void adminFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data ?? []) as UserOption[];
        setUsers(list.filter((user) => user.active || user.id === defaults.ownerId || user.id === defaultOwnerId));
      })
      .catch(console.error);
  }, [defaults.ownerId, defaultOwnerId]);

  useEffect(() => {
    const prev = datesUnitRef.current;
    const changed =
      prev.startDate !== startDate || prev.endDate !== endDate || prev.unit !== unit;
    datesUnitRef.current = { startDate, endDate, unit };

    if (type !== "T_AND_M" || !isEditable) return;
    if (!startDate || !endDate || !unit) {
      if (changed) setWorkUnitMonths([]);
      return;
    }
    if (changed || !workUnitMonths.length) {
      setWorkUnitMonths(
        generateWorkUnitMonths(startDate, endDate, unit).map((row) => ({
          year: row.year,
          month: row.month,
          workUnits: row.workUnits,
        })),
      );
    }
  }, [type, startDate, endDate, unit, isEditable, workUnitMonths.length]);

  useEffect(() => {
    const prev = variationDatesRef.current;
    const changed =
      prev.variationDate !== variationDate || prev.variationEndDate !== variationEndDate;
    variationDatesRef.current = { variationDate, variationEndDate };

    if (type !== "T_AND_M" || !showVariationForm) return;
    if (!variationDate || !variationEndDate || !unit) {
      if (changed) setVariationWorkUnitMonths([]);
      return;
    }
    if (changed || !variationWorkUnitMonths.length) {
      setVariationWorkUnitMonths(
        generateWorkUnitMonths(variationDate, variationEndDate, unit).map((row) => ({
          year: row.year,
          month: row.month,
          workUnits: row.workUnits,
        })),
      );
    }
  }, [
    type,
    unit,
    variationDate,
    variationEndDate,
    showVariationForm,
    variationWorkUnitMonths.length,
  ]);

  useEffect(() => {
    if (type === "T_AND_M") {
      const units = workUnitMonths.length ? sumWorkUnits(workUnitMonths) : Number.parseFloat(numberOfUnits) || 0;
      setNumberOfUnits(String(units));
      const rateValue = Number.parseFloat(rate) || 0;
      setContractValue(String(units * rateValue));
    }
  }, [type, workUnitMonths, rate]);

  useEffect(() => {
    if (!showProfilePicker || !defaults.id) return;
    setLoadingProfileOptions(true);
    const params = new URLSearchParams({ contractId: defaults.id });
    if (profileSearch.trim()) params.set("search", profileSearch.trim());
    void adminFetch(`/api/admin/contracts/profile-options?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProfileOptions(
          (data.data ?? []).map((row: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            category: string;
            technology: string;
            available: boolean;
          }) => ({
            id: "",
            profileId: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone ?? "",
            category: row.category,
            technology: row.technology,
            available: row.available,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoadingProfileOptions(false));
  }, [showProfilePicker, profileSearch, defaults.id]);

  async function addProfile(profileId: string) {
    if (!defaults.id || !canManageProfiles) return;
    setAddingProfile(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to add profile");
      const saved = data.data as ContractAssignedProfile;
      setProfiles((prev) => [...prev, saved]);
      setShowProfilePicker(false);
      setProfileSearch("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add profile");
    } finally {
      setAddingProfile(false);
    }
  }

  async function deleteProfile(contractProfileId: string) {
    if (!defaults.id || !canManageProfiles) return;
    if (!window.confirm("Remove this profile from the contract?")) return;
    setDeletingProfileId(contractProfileId);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/profiles/${contractProfileId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to remove profile");
      setProfiles((prev) => prev.filter((row) => row.id !== contractProfileId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove profile");
    } finally {
      setDeletingProfileId(null);
    }
  }

  async function persistFileUrls(nextUrls: string[]) {
    if (!defaults.id || isEditable) {
      setFileUrls(nextUrls);
      return;
    }
    setSavingFiles(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrls: nextUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save files");
      setFileUrls((data.data as { fileUrls?: string[] }).fileUrls ?? nextUrls);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save files");
    } finally {
      setSavingFiles(false);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !canEditFiles) return;
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
      await persistFileUrls(nextUrls);
    } catch (error) {
      console.error(error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function removeFile(index: number) {
    const nextUrls = fileUrls.filter((_, i) => i !== index);
    await persistFileUrls(nextUrls);
  }

  function resetMilestoneForm() {
    setShowMilestoneForm(false);
    setEditingMilestoneId(null);
    setMilestoneDescription("");
    setMilestoneDate("");
    setMilestoneAmount("");
  }

  function startEditMilestone(milestone: ContractMilestone) {
    setEditingMilestoneId(milestone.id);
    setMilestoneDescription(milestone.description);
    setMilestoneDate(toDateInput(milestone.milestoneDate));
    setMilestoneAmount(String(milestone.amount));
    setShowMilestoneForm(true);
  }

  async function saveMilestone() {
    if (!defaults.id || !canAddMilestones) return;
    if (!milestoneDescription.trim()) {
      alert("Description is required.");
      return;
    }
    if (!milestoneDate) {
      alert("Milestone date is required.");
      return;
    }
    const amount = Number.parseFloat(milestoneAmount);
    if (Number.isNaN(amount)) {
      alert("Amount is required.");
      return;
    }
    setAddingMilestone(true);
    try {
      const isEdit = Boolean(editingMilestoneId);
      const res = await adminFetch(
        isEdit
          ? `/api/admin/contracts/${defaults.id}/milestones/${editingMilestoneId}`
          : `/api/admin/contracts/${defaults.id}/milestones`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: milestoneDescription.trim(),
            milestoneDate,
            amount,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save milestone");
      const saved = data.data as ContractMilestone;
      setMilestones((prev) => {
        const next = isEdit
          ? prev.map((row) => (row.id === saved.id ? saved : row))
          : [...prev, saved];
        return next.sort(
          (a, b) => new Date(a.milestoneDate).getTime() - new Date(b.milestoneDate).getTime(),
        );
      });
      resetMilestoneForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save milestone");
    } finally {
      setAddingMilestone(false);
    }
  }

  async function deleteMilestone(milestoneId: string) {
    if (!defaults.id || !canAddMilestones) return;
    if (!window.confirm("Delete this milestone?")) return;
    setDeletingMilestoneId(milestoneId);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/milestones/${milestoneId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete milestone");
      setMilestones((prev) => prev.filter((row) => row.id !== milestoneId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete milestone");
    } finally {
      setDeletingMilestoneId(null);
    }
  }

  async function uploadInvoiceFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setInvoiceUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
      const data = await res.json();
      const url = readUploadImageUrlFromJson(data);
      if (url) setInvoiceFileUrl(url);
    } catch (error) {
      console.error(error);
      alert("Failed to upload invoice file");
    } finally {
      setInvoiceUploading(false);
    }
  }

  async function saveActiveEndDate(nextEndDate: string) {
    if (!defaults.id || status !== "ACTIVE") return;
    const dateError = validateContractDates(startDate, nextEndDate || null);
    if (dateError) {
      setEndDateError(dateError);
      return;
    }
    setEndDateError(null);
    setSavingEndDate(true);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/end-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: nextEndDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update end date");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update end date");
    } finally {
      setSavingEndDate(false);
    }
  }

  async function createProject(variationId?: string) {
    if (!defaults.id) return;
    setCreatingProjectFor(variationId ?? "base");
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/create-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create project");
      router.push(`/projects/${(data.data as { id: string }).id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreatingProjectFor(null);
    }
  }

  function resetVariationForm() {
    setShowVariationForm(false);
    setEditingVariationId(null);
    setVariationDate("");
    setVariationEndDate("");
    setVariationComments("");
    setVariationValue("");
    setVariationQty("");
    setVariationRate("");
    setVariationWorkUnitMonths([]);
    variationDatesRef.current = { variationDate: "", variationEndDate: "" };
  }

  function startEditVariation(variation: ContractVariation) {
    const start = toDateInput(variation.variationDate);
    const end = toDateInput(variation.variationEndDate);
    setEditingVariationId(variation.id);
    setVariationDate(start);
    setVariationEndDate(end);
    setVariationComments(variation.comments);
    setVariationValue(String(variation.variationValue));
    setVariationQty(variation.qty != null ? String(variation.qty) : "");
    setVariationRate(variation.rate != null ? String(variation.rate) : "");
    setVariationWorkUnitMonths(variation.workUnitMonths ?? []);
    variationDatesRef.current = { variationDate: start, variationEndDate: end };
    setShowVariationForm(true);
  }

  async function saveVariation() {
    if (!defaults.id || !canAddVariations) return;
    if (!variationDate) {
      alert("Variation start date is required.");
      return;
    }
    if (type === "T_AND_M" && !variationEndDate) {
      alert("Variation end date is required for T&M contracts.");
      return;
    }
    const variationDateError = validateVariationDates(
      {
        id: editingVariationId ?? undefined,
        variationDate,
        variationEndDate: variationEndDate || null,
      },
      startDate || null,
      variations.map((row) => ({
        id: row.id,
        variationDate: row.variationDate,
        variationEndDate: row.variationEndDate ?? null,
      })),
    );
    if (variationDateError) {
      alert(variationDateError);
      return;
    }

    let body: Record<string, unknown>;
    if (type === "T_AND_M") {
      const qty = variationQtyTotal;
      const rateVal = Number.parseFloat(variationRate);
      if (!variationWorkUnitMonths.length) {
        alert("Work units are required for T&M variations.");
        return;
      }
      if (!qty || qty <= 0) {
        alert("Qty is required for T&M variations.");
        return;
      }
      if (Number.isNaN(rateVal) || rateVal < 0) {
        alert("Rate is required for T&M variations.");
        return;
      }
      body = {
        variationDate,
        variationEndDate,
        qty: roundMoney(qty),
        rate: roundMoney(rateVal),
        workUnitMonths: variationWorkUnitMonths,
        comments: variationComments.trim(),
      };
    } else {
      const value = Number.parseFloat(variationValue);
      if (Number.isNaN(value)) {
        alert("Variation value is required.");
        return;
      }
      body = {
        variationDate,
        variationEndDate: variationEndDate || null,
        variationValue: roundMoney(value),
        comments: variationComments.trim(),
      };
    }

    setAddingVariation(true);
    try {
      const isEdit = Boolean(editingVariationId);
      const res = await adminFetch(
        isEdit
          ? `/api/admin/contracts/${defaults.id}/variations/${editingVariationId}`
          : `/api/admin/contracts/${defaults.id}/variations`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save variation");
      const saved = data.data as ContractVariation;
      setVariations((prev) =>
        isEdit
          ? prev.map((row) => (row.id === saved.id ? saved : row))
          : [saved, ...prev],
      );
      resetVariationForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save variation");
    } finally {
      setAddingVariation(false);
    }
  }

  async function deleteVariation(variationId: string) {
    if (!defaults.id || !canAddVariations) return;
    if (!window.confirm("Delete this variation?")) return;
    setDeletingVariationId(variationId);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/variations/${variationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete variation");
      setVariations((prev) => prev.filter((row) => row.id !== variationId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete variation");
    } finally {
      setDeletingVariationId(null);
    }
  }

  function syncConsumedFromInvoices(nextInvoices: ContractInvoice[]) {
    setConsumed(String(nextInvoices.reduce((sum, row) => sum + row.amount, 0)));
  }

  function resetInvoiceForm() {
    setShowInvoiceForm(false);
    setEditingInvoiceId(null);
    setInvoiceReference("");
    setInvoiceIssueDate(todayDateInput());
    setInvoiceDueDate(defaultDueDateInput());
    setInvoiceStatus("DRAFT");
    setInvoiceDescription("");
    setInvoiceCurrency(currency);
    setInvoiceQty("");
    setInvoiceRate("");
    setInvoiceTaxRate("10");
    setInvoiceFileUrl("");
  }

  function startEditInvoice(invoice: ContractInvoice) {
    setEditingInvoiceId(invoice.id);
    setInvoiceReference(invoice.reference);
    setInvoiceIssueDate(toDateInput(invoice.issueDate));
    setInvoiceDueDate(toDateInput(invoice.dueDate));
    setInvoiceStatus(invoice.status);
    setInvoiceDescription(invoice.description);
    setInvoiceCurrency(invoice.currency || currency);
    setInvoiceQty(String(invoice.qty));
    setInvoiceRate(String(invoice.rate));
    setInvoiceTaxRate(String(invoice.taxRate));
    setInvoiceFileUrl(invoice.fileUrl ?? "");
    setShowInvoiceForm(true);
  }

  async function saveInvoice() {
    if (!defaults.id || !canAddInvoices) return;
    const qty = Number.parseFloat(invoiceQty);
    const rateVal = Number.parseFloat(invoiceRate);
    const taxRate = Number.parseFloat(invoiceTaxRate);
    if (!invoiceIssueDate || !invoiceDueDate) {
      alert("Issue date and due date are required.");
      return;
    }
    if (!invoiceDescription.trim()) {
      alert("Description is required.");
      return;
    }
    if (!qty || qty <= 0) {
      alert("Qty is required.");
      return;
    }
    if (Number.isNaN(rateVal) || rateVal < 0) {
      alert("Rate is required.");
      return;
    }
    if (Number.isNaN(taxRate) || taxRate < 0) {
      alert("Tax rate is required.");
      return;
    }
    setAddingInvoice(true);
    try {
      const isEdit = Boolean(editingInvoiceId);
      const editingInvoice = isEdit ? invoices.find((row) => row.id === editingInvoiceId) : null;
      const payload = {
        reference: invoiceReference.trim(),
        issueDate: invoiceIssueDate,
        dueDate: invoiceDueDate,
        status: invoiceStatus,
        currency: invoiceCurrency,
        description: invoiceDescription.trim(),
        qty: roundMoney(qty),
        rate: roundMoney(rateVal),
        taxRate: roundMoney(taxRate),
        fileUrl: invoiceFileUrl || null,
      };
      const res = await adminFetch(
        isEdit
          ? `/api/admin/contracts/${defaults.id}/invoices/${editingInvoiceId}`
          : `/api/admin/contracts/${defaults.id}/invoices`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editingInvoice && editingInvoice.status !== "DRAFT" && invoiceStatus !== "DRAFT"
              ? { status: invoiceStatus }
              : payload,
          ),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save invoice");
      const saved = data.data as ContractInvoice;
      setInvoices((prev) => {
        const next = isEdit
          ? prev.map((row) => (row.id === saved.id ? saved : row))
          : [saved, ...prev];
        syncConsumedFromInvoices(next);
        return next;
      });
      resetInvoiceForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setAddingInvoice(false);
    }
  }

  async function deleteInvoice(invoiceId: string) {
    if (!defaults.id || !canAddInvoices) return;
    if (!window.confirm("Delete this invoice?")) return;
    setDeletingInvoiceId(invoiceId);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to delete invoice");
      setInvoices((prev) => {
        const next = prev.filter((row) => row.id !== invoiceId);
        syncConsumedFromInvoices(next);
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete invoice");
    } finally {
      setDeletingInvoiceId(null);
    }
  }

  async function updateInvoiceStatus(invoiceId: string, nextStatus: ContractInvoiceStatus) {
    if (!defaults.id) return;
    setUpdatingInvoiceId(invoiceId);
    try {
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update invoice");
      const updated = data.data as ContractInvoice;
      setInvoices((prev) => {
        const next = prev.map((row) => (row.id === invoiceId ? updated : row));
        syncConsumedFromInvoices(next);
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update invoice status");
    } finally {
      setUpdatingInvoiceId(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEditable) return;

    if (type === "T_AND_M") {
      if (!unit) {
        alert("Unit is required for T&M contracts.");
        return;
      }
      if (!endDate) {
        alert("End date is required for T&M contracts.");
        return;
      }
      if (!workUnitMonths.length) {
        alert("Work units are required for T&M contracts.");
        return;
      }
      const units = sumWorkUnits(workUnitMonths);
      if (!units || units <= 0) {
        alert("No. of units is required for T&M contracts.");
        return;
      }
      const rateValue = Number.parseFloat(rate);
      if (Number.isNaN(rateValue) || rateValue < 0) {
        alert("Rate is required for T&M contracts.");
        return;
      }
    }

    if (type === "FIXED_PRICE") {
      const value = Number.parseFloat(contractValue);
      if (Number.isNaN(value) || value < 0) {
        alert("Contract value is required for fixed price contracts.");
        return;
      }
    }

    const contractDateError = validateContractDates(startDate, endDate || null);
    if (contractDateError) {
      setEndDateError(contractDateError);
      alert(contractDateError);
      return;
    }
    setEndDateError(null);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      clientId,
      type,
      startDate,
      endDate: endDate || null,
      unit: type === "T_AND_M" ? unit : null,
      numberOfUnits: type === "T_AND_M" ? sumWorkUnits(workUnitMonths) : null,
      workUnitMonths: type === "T_AND_M" ? workUnitMonths : undefined,
      currency,
      rate: roundMoney(type === "FIXED_PRICE" ? 0 : rate ? Number.parseFloat(rate) : 0),
      contractValue: roundMoney(
        type === "T_AND_M"
          ? sumWorkUnits(workUnitMonths) * (Number.parseFloat(rate) || 0)
          : contractValue
            ? Number.parseFloat(contractValue)
            : 0,
      ),
      comments: comments.trim(),
      fileUrls,
    };
    if (ownerId) {
      payload.ownerId = ownerId;
    }
    await onSubmit(payload);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {defaults.contractNumber ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contract number</label>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{defaults.contractNumber}</p>
          </div>
          {status === "ACTIVE" && !baseProject ? (
            <button
              type="button"
              onClick={() => void createProject()}
              disabled={creatingProjectFor === "base"}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {creatingProjectFor === "base" ? "Creating…" : "Create Project"}
            </button>
          ) : null}
        </div>
      ) : null}

      {defaults.careerApplication ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800">
          <span className="font-medium text-gray-700 dark:text-gray-300">Linked career application: </span>
          <span className="text-gray-900 dark:text-gray-100">
            {defaults.careerApplication.firstName} {defaults.careerApplication.lastName}
            {" · "}
            {defaults.careerApplication.jobTitle ?? defaults.careerApplication.position}
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({defaults.careerApplication.status.replace(/_/g, " ")})
          </span>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          readOnly={!isEditable}
          className={fieldClass(isEditable)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            disabled={!isEditable}
            className={fieldClass(isEditable)}
          >
            <option value="">Select client…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ContractType)}
            required
            disabled={!isEditable}
            className={fieldClass(isEditable)}
          >
            {CONTRACT_TYPES.map((value) => (
              <option key={value} value={value}>{CONTRACT_TYPE_LABELS[value]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Status</label>
          <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
            {CONTRACT_STATUS_LABELS[status]}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contract owner</label>
          {!isEditable ? (
            <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
              {ownerDisplayName || "—"}
            </p>
          ) : (
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
              <option value="">Select owner…</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Start date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            readOnly={!isEditable}
            className={fieldClass(isEditable)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              const next = e.target.value;
              setEndDate(next);
              if (isEditable) {
                setEndDateError(validateContractDates(startDate, next || null));
              }
            }}
            onBlur={() => {
              if (status === "ACTIVE") void saveActiveEndDate(endDate);
            }}
            readOnly={!canEditEndDate}
            className={fieldClass(canEditEndDate)}
          />
          {endDateError ? <p className="mt-1 text-xs text-red-600">{endDateError}</p> : null}
          {savingEndDate ? <p className="mt-1 text-xs text-gray-500">Saving end date…</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {type === "T_AND_M" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ContractUnit)}
              required
              disabled={!isEditable}
              className={fieldClass(isEditable)}
            >
              <option value="">Select unit…</option>
              {CONTRACT_UNITS.map((value) => (
                <option key={value} value={value}>{CONTRACT_UNIT_LABELS[value]}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Currency *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            disabled={!isEditable}
            className={fieldClass(isEditable)}
          >
            {SALES_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        {showNumberOfUnits ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">No. of units *</label>
            <input
              type="number"
              min="0.0001"
              step="0.01"
              value={numberOfUnits}
              required
              readOnly={numberOfUnitsReadOnly}
              className={fieldClass(false)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total of all work units (read-only)</p>
          </div>
        ) : null}
        {showRate ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Rate{rateRequired ? " *" : ""}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required={rateRequired}
              readOnly={!isEditable}
              className={fieldClass(isEditable)}
            />
          </div>
        ) : null}
      </div>

      {type === "T_AND_M" && (isEditable || workUnitMonths.length > 0) ? (
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Monthly work units *</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Weekdays only (Mon–Fri), excluding public holidays. Hour unit = weekdays × 8.
            </p>
          </div>
          <WorkUnitMonthsEditor
            rows={workUnitMonths}
            editable={isEditable}
            onChange={setWorkUnitMonths}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
            Contract value{contractValueRequired ? " *" : ""}
          </label>
          {contractValueReadOnly ? (
            <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
              {formatMoney(currency, Number.parseFloat(contractValue) || 0)}
            </p>
          ) : (
            <input
              type="number"
              min="0"
              step="0.01"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              required={contractValueRequired}
              className={inputClass}
            />
          )}
          {type === "T_AND_M" ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Calculated as No. of units × Rate</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Total variation</label>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
            {formatMoney(currency, totalVariation)}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Consumed</label>
          <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
            {formatMoney(currency, Number.parseFloat(consumed) || 0)}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Remaining</label>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
            {formatMoney(currency, remaining)}
          </p>
        </div>
      </div>

      {defaults.id ? (
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Assigned profiles</h3>
            {canManageProfiles ? (
              <button
                type="button"
                onClick={() => setShowProfilePicker((open) => !open)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add profile
              </button>
            ) : null}
          </div>
          {!canManageProfiles && status !== "DRAFT" ? (
            <p className="text-sm text-gray-400">Profiles can only be added while the contract is in Draft.</p>
          ) : null}
          {showProfilePicker && canManageProfiles ? (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <input
                type="search"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="Search profiles by name or email…"
                className={inputClass}
              />
              {loadingProfileOptions ? (
                <p className="text-sm text-gray-500">Loading profiles…</p>
              ) : profileOptions.length ? (
                <ul className="max-h-56 space-y-2 overflow-y-auto">
                  {profileOptions.map((option) => (
                    <li
                      key={option.profileId}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.firstName} {option.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{option.email}</p>
                        <p className="text-xs text-gray-500">
                          {option.category} · {option.technology} · Available: {option.available ? "Yes" : "No"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={addingProfile}
                        onClick={() => void addProfile(option.profileId)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No matching profiles found.</p>
              )}
            </div>
          ) : null}
          {!profiles.length ? (
            <p className="text-sm text-gray-400">No profiles assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {profiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    {profile.phone ? <p className="text-xs text-gray-500">{profile.phone}</p> : null}
                    <p className="text-xs text-gray-500">
                      {profile.category} · {profile.technology} · Available: {profile.available ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/database/profiles/${profile.profileId}`}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    {canManageProfiles ? (
                      <button
                        type="button"
                        onClick={() => void deleteProfile(profile.id)}
                        disabled={deletingProfileId === profile.id}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {defaults.id ? (
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Variations</h3>
            <div className="flex items-center gap-2">
            {canAddVariations ? (
              <button
                type="button"
                onClick={() => {
                  if (showVariationForm && !editingVariationId) {
                    resetVariationForm();
                  } else {
                    resetVariationForm();
                    setShowVariationForm(true);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add variation
              </button>
            ) : null}
            </div>
          </div>
          {!canAddVariations && status !== "ACTIVE" ? (
            <p className="text-sm text-gray-400">Variations can be added when the contract is active.</p>
          ) : null}
          {showVariationForm ? (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Start date *</label>
                  <input
                    type="date"
                    value={variationDate}
                    onChange={(e) => setVariationDate(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    End date{type === "T_AND_M" ? " *" : ""}
                  </label>
                  <input
                    type="date"
                    value={variationEndDate}
                    onChange={(e) => setVariationEndDate(e.target.value)}
                    required={type === "T_AND_M"}
                    className={inputClass}
                  />
                  {type === "T_AND_M" ? (
                    <p className="mt-1 text-xs text-gray-500">Set start and end dates to generate monthly work units.</p>
                  ) : null}
                </div>
              </div>
              {type === "T_AND_M" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Qty *</label>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.01"
                        value={variationQtyTotal}
                        readOnly
                        className={fieldClass(false)}
                      />
                      <p className="mt-1 text-xs text-gray-500">Total of all work units</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Rate *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variationRate}
                        onChange={(e) => setVariationRate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Variation value</label>
                      <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
                        {formatMoney(currency, variationPreviewValue)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Monthly work units *</p>
                    <WorkUnitMonthsEditor
                      rows={variationWorkUnitMonths}
                      editable
                      onChange={setVariationWorkUnitMonths}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Variation value *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variationValue}
                    onChange={(e) => setVariationValue(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
              <textarea
                value={variationComments}
                onChange={(e) => setVariationComments(e.target.value)}
                rows={3}
                placeholder="Comments (optional)"
                className={inputClass}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveVariation()} disabled={addingVariation} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
                  {addingVariation ? "Saving…" : editingVariationId ? "Update variation" : "Save variation"}
                </button>
                <button type="button" onClick={resetVariationForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {variations.length === 0 ? (
            <p className="text-sm text-gray-400">No variations yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {variations.map((variation) => {
                const variationProject = linkedProjects.find((row) => row.contractVariationId === variation.id);
                return (
                <li key={variation.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatMoney(currency, variation.variationValue)} · {formatDate(variation.variationDate)}
                      {variation.variationEndDate ? ` – ${formatDate(variation.variationEndDate)}` : ""}
                    </p>
                    {type === "T_AND_M" && variation.qty != null ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        Qty: {variation.qty} × {formatMoney(currency, variation.rate ?? 0)}
                      </p>
                    ) : null}
                    {variation.comments ? (
                      <p className="text-gray-500 dark:text-gray-400">{variation.comments}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {status === "ACTIVE" && !variationProject ? (
                      <button
                        type="button"
                        onClick={() => void createProject(variation.id)}
                        disabled={creatingProjectFor === variation.id}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      >
                        {creatingProjectFor === variation.id ? "Creating…" : "Create project"}
                      </button>
                    ) : variationProject ? (
                      <Link
                        href={`/projects/${variationProject.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {variationProject.projectNumber}
                      </Link>
                    ) : null}
                    <div className="flex gap-1">
                  {canAddVariations ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditVariation(variation)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                        aria-label="Edit variation"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteVariation(variation.id)}
                        disabled={deletingVariationId === variation.id}
                        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                        aria-label="Delete variation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}
                    </div>
                  </div>
                </li>
              );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {defaults.id && showMilestones ? (
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Milestones</h3>
            {canAddMilestones ? (
              <button
                type="button"
                onClick={() => {
                  if (showMilestoneForm && !editingMilestoneId) {
                    resetMilestoneForm();
                  } else {
                    resetMilestoneForm();
                    setShowMilestoneForm(true);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add milestone
              </button>
            ) : null}
          </div>
          {!canAddMilestones && status !== "ACTIVE" ? (
            <p className="text-sm text-gray-400">Milestones can be added when the contract is active.</p>
          ) : null}
          {showMilestoneForm ? (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <input
                value={milestoneDescription}
                onChange={(e) => setMilestoneDescription(e.target.value)}
                placeholder="Description *"
                className={inputClass}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className={inputClass}
                  aria-label="Milestone date"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={milestoneAmount}
                  onChange={(e) => setMilestoneAmount(e.target.value)}
                  placeholder={`Amount (${currency}) *`}
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveMilestone()} disabled={addingMilestone} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
                  {addingMilestone ? "Saving…" : editingMilestoneId ? "Update milestone" : "Save milestone"}
                </button>
                <button type="button" onClick={resetMilestoneForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {milestones.length === 0 ? (
            <p className="text-sm text-gray-400">No milestones yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatMoney(currency, milestone.amount)} · {formatDate(milestone.milestoneDate)}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">{milestone.description}</p>
                  </div>
                  {canAddMilestones ? (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEditMilestone(milestone)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                        aria-label="Edit milestone"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMilestone(milestone.id)}
                        disabled={deletingMilestoneId === milestone.id}
                        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                        aria-label="Delete milestone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {defaults.id ? (
        <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Invoices</h3>
            {canAddInvoices ? (
              <button
                type="button"
                onClick={() => {
                  if (showInvoiceForm && !editingInvoiceId) {
                    resetInvoiceForm();
                  } else {
                    resetInvoiceForm();
                    setShowInvoiceForm(true);
                  }
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add invoice
              </button>
            ) : null}
          </div>
          {!canAddInvoices ? (
            <p className="text-sm text-gray-400">Invoices can be added when the contract is active or expired.</p>
          ) : null}
          {showInvoiceForm ? (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              {editingInvoiceId && !invoiceFieldsEditable ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Set status to <strong>Draft</strong> to edit all invoice fields, then save.
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Reference</label>
                  <input
                    value={invoiceReference}
                    onChange={(e) => setInvoiceReference(e.target.value)}
                    placeholder="Reference"
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as ContractInvoiceStatus)}
                    className={inputClass}
                  >
                    {CONTRACT_INVOICE_STATUSES.map((value) => (
                      <option key={value} value={value}>{CONTRACT_INVOICE_STATUS_LABELS[value]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Issue date *</label>
                  <input
                    type="date"
                    value={invoiceIssueDate}
                    onChange={(e) => setInvoiceIssueDate(e.target.value)}
                    required
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Due date *</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                    required
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Description *</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  rows={3}
                  placeholder="Description"
                  readOnly={!invoiceFieldsEditable}
                  className={fieldClass(invoiceFieldsEditable)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Currency</label>
                  <select
                    value={invoiceCurrency}
                    onChange={(e) => setInvoiceCurrency(e.target.value)}
                    disabled={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  >
                    {SALES_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Qty *</label>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.01"
                    value={invoiceQty}
                    onChange={(e) => setInvoiceQty(e.target.value)}
                    placeholder="Qty"
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Rate *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceRate}
                    onChange={(e) => setInvoiceRate(e.target.value)}
                    placeholder="Rate"
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tax rate % *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceTaxRate}
                    onChange={(e) => setInvoiceTaxRate(e.target.value)}
                    placeholder="Tax rate"
                    readOnly={!invoiceFieldsEditable}
                    className={fieldClass(invoiceFieldsEditable)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Amount</label>
                  <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
                    {formatMoney(invoiceCurrency, invoicePreviewAmount)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tax amount</label>
                  <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
                    {formatMoney(invoiceCurrency, invoicePreviewTaxAmount)}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Total amount</label>
                  <p className={`rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-600 dark:text-gray-100 ${readOnlyClass}`}>
                    {formatMoney(invoiceCurrency, invoicePreviewTotal)}
                  </p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Invoice file</label>
                {invoiceFieldsEditable ? (
                  <input type="file" onChange={(e) => void uploadInvoiceFile(e.target.files)} className="block w-full text-sm" />
                ) : null}
                {invoiceUploading ? <p className="mt-1 text-xs text-gray-500">Uploading…</p> : null}
                {invoiceFileUrl ? (
                  <a href={invoiceFileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
                    View uploaded file
                  </a>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void saveInvoice()} disabled={addingInvoice} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
                  {addingInvoice ? "Saving…" : editingInvoiceId ? "Update invoice" : "Save invoice"}
                </button>
                <button type="button" onClick={resetInvoiceForm} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices.map((invoice) => {
                const invoiceCurrencyLabel = invoice.currency || currency;
                const colors = CONTRACT_INVOICE_STATUS_COLORS[invoice.status] ?? CONTRACT_INVOICE_STATUS_COLORS.DRAFT;
                const readOnly = invoice.status !== "DRAFT";
                return (
                  <li key={invoice.id} id={`contract-invoice-${invoice.id}`} className="scroll-mt-24 space-y-2 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={invoice.status}
                          disabled={updatingInvoiceId === invoice.id}
                          onChange={(e) => void updateInvoiceStatus(invoice.id, e.target.value as ContractInvoiceStatus)}
                          className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}
                        >
                          {CONTRACT_INVOICE_STATUSES.map((value) => (
                            <option key={value} value={value}>{CONTRACT_INVOICE_STATUS_LABELS[value]}</option>
                          ))}
                        </select>
                        {canAddInvoices ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditInvoice(invoice)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                              aria-label="Edit invoice"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteInvoice(invoice.id)}
                              disabled={deletingInvoiceId === invoice.id}
                              className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                              aria-label="Delete invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${readOnly ? "text-gray-500" : ""}`}>
                      <p>Reference: {invoice.reference || "—"}</p>
                      <p>Issue: {formatDate(invoice.issueDate)} · Due: {formatDate(invoice.dueDate)}</p>
                      <p className="sm:col-span-2">{invoice.description}</p>
                      <p>Qty: {invoice.qty} × {formatMoney(invoiceCurrencyLabel, invoice.rate)}</p>
                      <p>Amount: {formatMoney(invoiceCurrencyLabel, invoice.amount)}</p>
                      <p>Tax ({invoice.taxRate}%): {formatMoney(invoiceCurrencyLabel, invoice.taxAmount)}</p>
                      <p className="font-medium">Total: {formatMoney(invoiceCurrencyLabel, invoice.totalAmount)}</p>
                    </div>
                    {invoice.fileUrl ? (
                      <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                        View invoice file
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          readOnly={!isEditable}
          className={fieldClass(isEditable)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Files</label>
        {canEditFiles ? (
          <input type="file" multiple onChange={(e) => void uploadFiles(e.target.files)} className="block w-full text-sm" />
        ) : null}
        {uploading || savingFiles ? (
          <p className="mt-1 text-xs text-gray-500">{uploading ? "Uploading…" : "Saving files…"}</p>
        ) : null}
        {fileUrls.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {fileUrls.map((url, index) => (
              <li key={`${url}-${index}`} className="flex items-center justify-between gap-2 text-sm">
                <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
                  {url.split("/").pop()}
                </a>
                {canEditFiles ? (
                  <button type="button" onClick={() => void removeFile(index)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {isEditable ? (
        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Contract
        </button>
      ) : null}
    </form>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
