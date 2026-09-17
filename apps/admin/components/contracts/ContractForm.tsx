"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";
const readOnlyClass = "bg-gray-50 dark:bg-gray-900 cursor-not-allowed";

export type ContractVariation = {
  id: string;
  variationDate: string;
  comments: string;
  unit: string | null;
  rate: number | null;
  variationValue: number;
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
  currency: string;
  rate: number;
  contractValue: number;
  totalVariation: number;
  consumed: number;
  remaining: number;
  comments: string;
  fileUrls: string[];
  variations: ContractVariation[];
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
  return date.toISOString().slice(0, 10);
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function fieldClass(editable: boolean) {
  return `${inputClass} ${editable ? "" : readOnlyClass}`;
}

export function ContractForm({ defaults = {}, defaultOwnerId, onSubmit, isSaving }: Props) {
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
  const [currency, setCurrency] = useState(defaults.currency ?? "AUD");
  const [rate, setRate] = useState(defaults.rate != null ? String(defaults.rate) : "");
  const [contractValue, setContractValue] = useState(
    defaults.contractValue != null ? String(defaults.contractValue) : "",
  );
  const [consumed] = useState(String(defaults.consumed ?? "0"));
  const [comments, setComments] = useState(defaults.comments ?? "");
  const [fileUrls, setFileUrls] = useState<string[]>(defaults.fileUrls ?? []);
  const [variations, setVariations] = useState<ContractVariation[]>(defaults.variations ?? []);
  const [uploading, setUploading] = useState(false);
  const [showVariationForm, setShowVariationForm] = useState(false);
  const [variationDate, setVariationDate] = useState("");
  const [variationComments, setVariationComments] = useState("");
  const [variationUnit, setVariationUnit] = useState<ContractUnit | "">("");
  const [variationRate, setVariationRate] = useState("");
  const [variationValue, setVariationValue] = useState("");
  const [addingVariation, setAddingVariation] = useState(false);

  const isEditable = status === "DRAFT";
  const showRate = type !== "FIXED_PRICE";
  const rateRequired = type === "T_AND_M";
  const showNumberOfUnits = type === "T_AND_M";
  const contractValueReadOnly = type === "T_AND_M" || !isEditable;
  const contractValueRequired = type === "FIXED_PRICE";
  const numberOfUnitsReadOnly = !isEditable;
  const canAddVariations = Boolean(defaults.id) && status === "ACTIVE";

  const totalVariation = useMemo(
    () => variations.reduce((sum, row) => sum + row.variationValue, 0),
    [variations],
  );
  const remaining = useMemo(() => {
    const value = Number.parseFloat(contractValue) || 0;
    const used = Number.parseFloat(consumed) || 0;
    return value - totalVariation - used;
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
    if (type === "T_AND_M") {
      const units = Number.parseInt(numberOfUnits, 10) || 0;
      const rateValue = Number.parseFloat(rate) || 0;
      setContractValue(String(units * rateValue));
    }
  }, [type, numberOfUnits, rate]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || !isEditable) return;
    setUploading(true);
    try {
      const nextUrls = [...fileUrls];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("resume", file);
        const res = await adminFetch("/api/upload/resume", { method: "POST", body: formData });
        const data = await res.json();
        const url = readUploadImageUrlFromJson(data);
        if (url) nextUrls.push(url);
      }
      setFileUrls(nextUrls);
    } catch (error) {
      console.error(error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  async function addVariation() {
    if (!defaults.id || !canAddVariations) return;
    if (!variationDate || !variationComments.trim()) {
      alert("Variation date and comments are required.");
      return;
    }
    setAddingVariation(true);
    try {
      const body: Record<string, unknown> = {
        variationDate,
        comments: variationComments.trim(),
      };
      if (type === "T_AND_M") {
        if (!variationUnit || !variationRate) {
          alert("Unit and rate are required for T&M variations.");
          return;
        }
        body.unit = variationUnit;
        body.rate = Number.parseFloat(variationRate);
      } else {
        const value = Number.parseFloat(variationValue);
        if (Number.isNaN(value)) {
          alert("Variation value is required.");
          return;
        }
        body.variationValue = value;
      }
      const res = await adminFetch(`/api/admin/contracts/${defaults.id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to add variation");
      setVariations((prev) => [data.data as ContractVariation, ...prev]);
      setShowVariationForm(false);
      setVariationDate("");
      setVariationComments("");
      setVariationUnit("");
      setVariationRate("");
      setVariationValue("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add variation");
    } finally {
      setAddingVariation(false);
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
      const units = Number.parseInt(numberOfUnits, 10);
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

    const payload: Record<string, unknown> = {
      title: title.trim(),
      clientId,
      type,
      startDate,
      endDate: endDate || null,
      unit: type === "T_AND_M" ? unit : null,
      numberOfUnits: type === "T_AND_M" ? Number.parseInt(numberOfUnits, 10) : null,
      currency,
      rate: type === "FIXED_PRICE" ? 0 : rate ? Number.parseFloat(rate) : 0,
      contractValue:
        type === "T_AND_M"
          ? (Number.parseInt(numberOfUnits, 10) || 0) * (Number.parseFloat(rate) || 0)
          : contractValue
            ? Number.parseFloat(contractValue)
            : 0,
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
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contract number</label>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{defaults.contractNumber}</p>
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
            onChange={(e) => setEndDate(e.target.value)}
            readOnly={!isEditable}
            className={fieldClass(isEditable)}
          />
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
              min="1"
              step="1"
              value={numberOfUnits}
              onChange={(e) => setNumberOfUnits(e.target.value)}
              required
              readOnly={numberOfUnitsReadOnly}
              className={fieldClass(!numberOfUnitsReadOnly)}
            />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
            Contract value{contractValueRequired ? " *" : ""}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={contractValue}
            onChange={(e) => setContractValue(e.target.value)}
            required={contractValueRequired}
            readOnly={contractValueReadOnly}
            className={`${inputClass} ${contractValueReadOnly ? readOnlyClass : ""}`}
          />
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
          <input
            type="number"
            min="0"
            step="0.01"
            value={consumed}
            readOnly
            className={`${inputClass} ${readOnlyClass}`}
          />
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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Variations</h3>
            {canAddVariations ? (
              <button
                type="button"
                onClick={() => setShowVariationForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add variation
              </button>
            ) : null}
          </div>
          {!canAddVariations && status !== "ACTIVE" ? (
            <p className="text-sm text-gray-400">Variations can be added once the contract is active.</p>
          ) : null}
          {showVariationForm ? (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              {type === "T_AND_M" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select value={variationUnit} onChange={(e) => setVariationUnit(e.target.value as ContractUnit)} className={inputClass}>
                    <option value="">Unit *</option>
                    {CONTRACT_UNITS.map((value) => (
                      <option key={value} value={value}>{CONTRACT_UNIT_LABELS[value]}</option>
                    ))}
                  </select>
                  <input type="number" min="0" step="0.01" value={variationRate} onChange={(e) => setVariationRate(e.target.value)} placeholder="Rate *" className={inputClass} />
                </div>
              ) : (
                <input type="number" min="0" step="0.01" value={variationValue} onChange={(e) => setVariationValue(e.target.value)} placeholder="Variation value *" className={inputClass} />
              )}
              <input type="date" value={variationDate} onChange={(e) => setVariationDate(e.target.value)} className={inputClass} />
              <textarea value={variationComments} onChange={(e) => setVariationComments(e.target.value)} rows={3} placeholder="Variation comments *" className={inputClass} />
              <div className="flex gap-2">
                <button type="button" onClick={() => void addVariation()} disabled={addingVariation} className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
                  {addingVariation ? "Adding…" : "Save variation"}
                </button>
                <button type="button" onClick={() => setShowVariationForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {variations.length === 0 ? (
            <p className="text-sm text-gray-400">No variations yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {variations.map((variation) => (
                <li key={variation.id} className="py-3 text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatMoney(currency, variation.variationValue)} · {formatDate(variation.variationDate)}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">{variation.comments}</p>
                </li>
              ))}
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
        {isEditable ? (
          <input type="file" multiple onChange={(e) => void uploadFiles(e.target.files)} className="block w-full text-sm" />
        ) : null}
        {uploading ? <p className="mt-1 text-xs text-gray-500">Uploading…</p> : null}
        {fileUrls.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {fileUrls.map((url, index) => (
              <li key={`${url}-${index}`} className="flex items-center justify-between gap-2 text-sm">
                <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
                  {url.split("/").pop()}
                </a>
                {isEditable ? (
                  <button type="button" onClick={() => setFileUrls((prev) => prev.filter((_, i) => i !== index))} className="text-red-600">
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
