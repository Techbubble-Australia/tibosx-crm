"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { getSortedCountryOptions } from "@/lib/country-flags";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  SALES_CURRENCIES,
  type OpportunityStatus,
} from "@/lib/opportunity-status";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABELS,
  type OpportunityType,
} from "@/lib/opportunity-types";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientOption = { id: string; name: string; status: string };
type ContactOption = { id: string; name: string; email: string };

type UserOption = { id: string; name: string | null; email: string; active: boolean };

export type OpportunityFormValues = {
  name: string;
  clientId: string;
  location: string;
  type: OpportunityType;
  contactId: string | null;
  ownerId?: string | null;
  ownerName?: string;
  status: OpportunityStatus;
  currency: string;
  amount: number;
  comments: string;
  active?: boolean;
  nextStep?: string | null;
  nextStepDue?: string | Date | null;
};

function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function toNextStepDueIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes("T")) return trimmed;
  return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
}

type Props = {
  defaults?: Partial<OpportunityFormValues>;
  presetClientId?: string;
  defaultOwnerId?: string;
};

export function OpportunityFields({ defaults = {}, presetClientId = "", defaultOwnerId }: Props) {
  const countryOptions = useMemo(() => getSortedCountryOptions(), []);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [clientId, setClientId] = useState(defaults.clientId ?? presetClientId ?? "");
  const [contactId, setContactId] = useState(defaults.contactId ?? "");
  const [ownerId, setOwnerId] = useState(defaults.ownerId ?? defaultOwnerId ?? "");

  useEffect(() => {
    void adminFetch("/api/admin/clients")
      .then((res) => res.json())
      .then((data) => {
        const list = ((data.data ?? []) as ClientOption[])
          .filter(
            (c) => c.status === "ACTIVE" || c.status === "PROSPECT" || c.id === defaults.clientId,
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        setClients(list);
      })
      .catch(console.error);
  }, [defaults.clientId]);

  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      setContactId("");
      return;
    }
    void adminFetch(`/api/admin/clients/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        const list = ((data.data?.contacts ?? []) as ContactOption[]).filter((c) => c.id && c.name);
        setContacts(list);
        if (defaults.contactId && list.some((c) => c.id === defaults.contactId)) {
          setContactId(defaults.contactId);
        } else {
          setContactId("");
        }
      })
      .catch(() => setContacts([]));
  }, [clientId, defaults.contactId]);

  useEffect(() => {
    if (defaults.ownerId) setOwnerId(defaults.ownerId);
    else if (!ownerId && defaultOwnerId) setOwnerId(defaultOwnerId);
  }, [defaults.ownerId, defaultOwnerId, ownerId]);

  useEffect(() => {
    void adminFetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        const list = (data.data ?? []) as UserOption[];
        setUsers(list.filter((user) => user.active || user.id === defaults.ownerId || user.id === defaultOwnerId));
      })
      .catch(console.error);
  }, [defaults.ownerId, defaultOwnerId]);

  const ownerDisplayName =
    defaults.ownerName ||
    users.find((user) => user.id === ownerId)?.name ||
    users.find((user) => user.id === ownerId)?.email ||
    "";

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name <span className="text-red-500">*</span></label>
        <input name="name" required defaultValue={defaults.name ?? ""} className={inputClass} placeholder="e.g. ServiceNow AMS renewal" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Client <span className="text-red-500">*</span></label>
          <select
            name="clientId"
            required
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setContactId("");
            }}
            className={inputClass}
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Location <span className="text-red-500">*</span></label>
          <select name="location" required defaultValue={defaults.location ?? ""} className={inputClass}>
            <option value="">Select country…</option>
            {countryOptions.map((country) => (
              <option key={country.code} value={country.name}>{country.flag} {country.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Type <span className="text-red-500">*</span></label>
        <select name="type" required defaultValue={defaults.type ?? "FIXED_PRICE"} className={inputClass}>
          {OPPORTUNITY_TYPES.map((type) => (
            <option key={type} value={type}>{OPPORTUNITY_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Contact</label>
        <select
          name="contactId"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className={inputClass}
          disabled={!clientId}
        >
          <option value="">Optional — select contact</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}{contact.email ? ` (${contact.email})` : ""}
            </option>
          ))}
        </select>
        {clientId && contacts.length === 0 ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No contacts on file for this client.</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Owner <span className="text-red-500">*</span></label>
          <select
            name="ownerId"
            required
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner…</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
          {!ownerId && ownerDisplayName ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Current owner: {ownerDisplayName}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Status <span className="text-red-500">*</span></label>
          <select name="status" required defaultValue={defaults.status ?? "DRAFT"} className={inputClass}>
            {OPPORTUNITY_STATUSES.map((status) => (
              <option key={status} value={status}>{OPPORTUNITY_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Currency <span className="text-red-500">*</span></label>
          <select name="currency" required defaultValue={defaults.currency ?? "AUD"} className={inputClass}>
            {SALES_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Estimated Value <span className="text-red-500">*</span></label>
          <input
            name="amount"
            type="number"
            required
            min="0.01"
            step="0.01"
            defaultValue={defaults.amount ?? ""}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Next step</label>
          <input
            name="nextStep"
            defaultValue={defaults.nextStep ?? ""}
            className={inputClass}
            placeholder="e.g. Send proposal draft"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Next step due</label>
          <input
            name="nextStepDue"
            type="date"
            defaultValue={toDateInputValue(defaults.nextStepDue)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Comments</label>
        <textarea name="comments" rows={4} defaultValue={defaults.comments ?? ""} className={inputClass} placeholder="Optional notes" />
      </div>

      {defaults.clientId ? (
        <>
          <input type="hidden" name="_hasActiveField" value="1" />
          <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={defaults.active !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            Active
          </label>
        </>
      ) : null}
    </>
  );
}

export function readOpportunityFormData(formData: FormData) {
  const contactRaw = String(formData.get("contactId") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim(),
    clientId: String(formData.get("clientId") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    type: String(formData.get("type") ?? "").trim(),
    contactId: contactRaw || null,
    ownerId: String(formData.get("ownerId") ?? "").trim() || null,
    status: String(formData.get("status") ?? "DRAFT").trim(),
    currency: String(formData.get("currency") ?? "").trim(),
    amount: formData.get("amount"),
    comments: String(formData.get("comments") ?? "").trim(),
    nextStep: String(formData.get("nextStep") ?? "").trim() || null,
    nextStepDue: toNextStepDueIso(String(formData.get("nextStepDue") ?? "")),
    ...(formData.get("_hasActiveField") === "1"
      ? { active: formData.get("active") === "true" }
      : {}),
  };
}
