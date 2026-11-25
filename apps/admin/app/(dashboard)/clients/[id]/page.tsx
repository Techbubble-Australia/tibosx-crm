"use client";
import { appAlert } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { CountryFlagPicker } from "@/components/CountryFlagPicker";
import { ClientContactsField, type ClientContactInput } from "@/components/clients/ClientContactsField";
import type { ClientStatus } from "@/lib/client-status";
import { CLIENT_STATUS_COLORS, CLIENT_STATUS_LABELS } from "@/lib/client-status";
import {
  ClientStatusFields,
  clientListPathForStatus,
  readClientStatusFromForm,
} from "@/components/clients/ClientStatusFields";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type ClientOpportunity = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: string;
  active: boolean;
  stage: string | null;
};

type ClientContract = {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  consumed: number;
  contractValue: number;
};

type ClientDetail = {
  name: string;
  website: string;
  country: string;
  order: number;
  status: ClientStatus;
  contacts: ClientContactInput[];
  opportunities?: ClientOpportunity[];
  contracts?: ClientContract[];
  customFields?: Record<string, unknown> | null;
};

function formatMoney(currency: string, amount: number) {
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

function websiteHref(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function Client360Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState<ClientDetail | null>(null);
  const [contacts, setContacts] = useState<ClientContactInput[]>([]);
  const [creatingUserIndex, setCreatingUserIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/clients/${id}`);
        const data = await res.json();
        const row = data.data as ClientDetail;
        setDefaults({
          name: row.name,
          website: row.website ?? "",
          country: row.country,
          order: row.order,
          status: row.status,
          contacts: row.contacts ?? [],
          opportunities: row.opportunities ?? [],
          contracts: row.contracts ?? [],
          customFields: row.customFields ?? null,
        });
        setContacts(
          (row.contacts ?? []).map((contact) => ({
            id: contact.id,
            name: contact.name,
            email: contact.email,
            position: contact.position ?? "",
            phoneCountryCode: contact.phoneCountryCode,
            phoneNumber: contact.phoneNumber,
            adminUserId: contact.adminUserId ?? null,
          })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [id]);

  const openOpps = useMemo(
    () => (defaults?.opportunities ?? []).filter((o) => o.active && o.status !== "REJECTED"),
    [defaults?.opportunities],
  );
  const openOppValue = useMemo(
    () => openOpps.reduce((sum, o) => sum + (o.amount || 0), 0),
    [openOpps],
  );
  const openOppCurrency = openOpps[0]?.currency ?? "AUD";
  const activeContracts = useMemo(
    () => (defaults?.contracts ?? []).filter((c) => c.status === "ACTIVE"),
    [defaults?.contracts],
  );
  const customFieldEntries = useMemo(() => {
    const raw = defaults?.customFields;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    return Object.entries(raw).filter(([, v]) => v != null && String(v).trim() !== "");
  }, [defaults?.customFields]);

  async function createUserForContact(contact: ClientContactInput, index: number) {
    if (!contact.id) {
      appAlert("Save the client before creating a user for this contact.");
      return;
    }
    setCreatingUserIndex(index);
    try {
      const res = await adminFetch(`/api/admin/clients/contacts/${contact.id}/create-user`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create user");
      const tempPassword = (data.data as { temporaryPassword?: string }).temporaryPassword;
      if (tempPassword) {
        appAlert(
          "Portal user created. No invite email was sent — use Customer users → Invite user when you are ready, or share the temporary password shown in the API response.",
        );
      }
      const adminUserId = (data.data as { adminUserId?: string }).adminUserId;
      if (adminUserId) {
        setContacts((prev) =>
          prev.map((row, i) => (i === index ? { ...row, adminUserId } : row)),
        );
        router.push(`/customer-users/${adminUserId}`);
      }
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUserIndex(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const status = readClientStatusFromForm(formData);
    try {
      const res = await adminFetch(`/api/admin/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          website: formData.get("website") ?? "",
          country: formData.get("country"),
          order: parseInt(formData.get("order") as string, 10) || 0,
          status,
          contacts,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      const name = String(formData.get("name") ?? defaults?.name ?? "");
      const website = String(formData.get("website") ?? "");
      const country = String(formData.get("country") ?? defaults?.country ?? "");
      const order = parseInt(formData.get("order") as string, 10) || 0;
      setDefaults((prev) =>
        prev
          ? {
              ...prev,
              name,
              website,
              country,
              order,
              status,
              contacts,
            }
          : prev,
      );
      setEditing(false);
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setIsLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">Client not found.</p>;

  const statusColors = CLIENT_STATUS_COLORS[defaults.status] ?? CLIENT_STATUS_COLORS.ACTIVE;
  const site = websiteHref(defaults.website);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={clientListPathForStatus(defaults.status)}
            className="mt-1 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
                {defaults.name}
              </h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}
              >
                {CLIENT_STATUS_LABELS[defaults.status] ?? defaults.status}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{defaults.country || "—"}</span>
              {site ? (
                <a
                  href={site}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                >
                  {defaults.website.replace(/^https?:\/\//i, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>No website</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Edit details
          {editing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Open opportunities</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {openOpps.length}
          </p>
          <p className="text-xs text-gray-500">{formatMoney(openOppCurrency, openOppValue)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Active contracts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {activeContracts.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Contacts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {contacts.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">All contracts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {(defaults.contracts ?? []).length}
          </p>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
              Name <span className="text-red-500">*</span>
            </label>
            <input name="name" required defaultValue={defaults.name} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Website</label>
            <input
              name="website"
              type="url"
              defaultValue={defaults.website}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>
          <CountryFlagPicker
            defaultCountry={defaults.country}
            selectClassName={inputClass}
            labelClassName="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100"
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Order</label>
            <input name="order" type="number" defaultValue={defaults.order} className={inputClass} />
          </div>
          <ClientStatusFields
            defaultProspect={defaults.status === "PROSPECT"}
            defaultActive={defaults.status !== "INACTIVE"}
            inputClass={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ClientContactsField
          contacts={contacts}
          onChange={setContacts}
          inputClassName={inputClass}
          creatingUserIndex={creatingUserIndex}
          onCreateUser={(contact, index) => void createUserForContact(contact, index)}
        />
        {editing ? null : (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const res = await adminFetch(`/api/admin/clients/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: defaults.name,
                      website: defaults.website,
                      country: defaults.country,
                      order: defaults.order,
                      status: defaults.status,
                      contacts,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error((err as { error?: string }).error || "Failed");
                  }
                  setDefaults((prev) => (prev ? { ...prev, contacts } : prev));
                } catch (err) {
                  appAlert(err instanceof Error ? err.message : "Failed to save contacts");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save contacts
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Opportunities</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Deals linked to this client.</p>
          </div>
          <Link
            href={`/opportunities/new?clientId=${encodeURIComponent(id)}`}
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            New opportunity
          </Link>
        </div>
        {(defaults.opportunities ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No opportunities yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(defaults.opportunities ?? []).map((opp) => (
              <li key={opp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/opportunities/${opp.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {opp.name}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {opp.stage || opp.status}
                    {opp.active ? "" : " · Inactive"}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
                  {formatMoney(opp.currency, opp.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contracts</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Agreements for this client.</p>
        </div>
        {(defaults.contracts ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No contracts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(defaults.contracts ?? []).map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/contracts/${c.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {c.contractNumber}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {c.title} · {c.status}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
                  {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(c.consumed)}
                  {" / "}
                  {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(c.contractValue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {customFieldEntries.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Custom fields</h3>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {customFieldEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{key}</dt>
                <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
