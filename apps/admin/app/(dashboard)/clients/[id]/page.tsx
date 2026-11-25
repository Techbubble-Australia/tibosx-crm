"use client";
import { appAlert } from "@/lib/app-alert";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatCrmMoney, formatCrmShortDate } from "@/lib/crm-format";
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

type ClientInvoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
};

type CustomFieldDef = { id: string; key: string; label: string };

/** "A$110k" style compact value for KPI sublines. */
function formatCompactMoney(amount: number, currency = "AUD") {
  if (Math.abs(amount) >= 1000) {
    const k = Math.round(amount / 1000);
    return currency.toUpperCase() === "AUD" ? `A$${k}k` : `${currency.toUpperCase()} ${k}k`;
  }
  return formatCrmMoney(amount, currency);
}

const PILL_BASE = "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium";

function stagePillClass(label: string) {
  const v = label.toLowerCase();
  if (v === "active" || v === "won" || v === "accepted") return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (v === "lost" || v === "rejected" || v === "inactive") return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (v === "proposal" || v === "negotiate" || v === "verbal yes") return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
}

const cardClass =
  "rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900";
const thClass = "px-3 py-2 text-left text-xs font-medium text-gray-500";

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [fieldDefs, setFieldDefs] = useState<CustomFieldDef[]>([]);

  useEffect(() => {
    // Best-effort side data: receivables and custom field labels (existing APIs).
    void adminFetch(`/api/admin/invoices?clientId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((d) => setInvoices((d.data ?? []) as ClientInvoice[]))
      .catch(() => undefined);
    void adminFetch("/api/admin/crm/settings/custom-fields?entityType=client")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((d) => setFieldDefs((d.data ?? []) as CustomFieldDef[]))
      .catch(() => undefined);
  }, [id]);

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
  const activeContractValue = useMemo(
    () => activeContracts.reduce((sum, c) => sum + (c.contractValue || 0), 0),
    [activeContracts],
  );
  const owed = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === "AWAITING_PAYMENT");
    const now = Date.now();
    const overdue = unpaid.filter((i) => new Date(i.dueDate).getTime() < now);
    return {
      total: unpaid.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
      overdueCount: overdue.length,
      overdueTotal: overdue.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
      currency: unpaid[0]?.currency ?? "AUD",
    };
  }, [invoices]);
  const recentActivity = useMemo(
    () =>
      [...invoices]
        .filter((i) => i.status !== "DRAFT" && i.status !== "CANCELED")
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5),
    [invoices],
  );
  const fieldLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of fieldDefs) {
      map.set(f.id, f.label);
      map.set(f.key, f.label);
    }
    return map;
  }, [fieldDefs]);
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
    <div className="mx-auto max-w-6xl space-y-5">
      <div className={`${cardClass} flex flex-wrap items-start justify-between gap-4`}>
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={clientListPathForStatus(defaults.status)}
            className="mt-1 rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Back to clients"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-100">
              {defaults.name}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{defaults.country || "—"}</span>
              <span aria-hidden>·</span>
              {site ? (
                <a
                  href={site}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  {defaults.website.replace(/^https?:\/\//i, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>No website</span>
              )}
              <span aria-hidden>·</span>
              <span
                className={`${PILL_BASE} ${statusColors.bg} ${statusColors.text} ${statusColors.darkBg} ${statusColors.darkText}`}
              >
                {CLIENT_STATUS_LABELS[defaults.status] ?? defaults.status}
              </span>
              {/* Owner is not stored on Client yet — wireframe shows "Owner <name>" once the API exposes it. */}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <Link
            href={`/opportunities/new?clientId=${encodeURIComponent(id)}`}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            + Opportunity
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Open opportunities</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {openOpps.length}
          </p>
          <p className="text-xs text-gray-500">{formatCompactMoney(openOppValue, openOppCurrency)}</p>
        </div>
        <div className={cardClass}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Active contracts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {activeContracts.length}
          </p>
          <p className="text-xs text-gray-500">{formatCompactMoney(activeContractValue)} value</p>
        </div>
        <div className={cardClass}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Owed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatCrmMoney(owed.total, owed.currency)}
          </p>
          <p className={`text-xs ${owed.overdueCount > 0 ? "text-red-600" : "text-gray-500"}`}>
            {owed.overdueCount > 0
              ? `${formatCrmMoney(owed.overdueTotal, owed.currency)} overdue`
              : "no overdue"}
          </p>
        </div>
        <div className={cardClass}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Open tickets</p>
          {/* Client ↔ ticketing organization link does not exist yet; value stays a placeholder. */}
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">—</p>
          <p className="text-xs text-gray-500">not linked</p>
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className={cardClass}>
            {editing ? (
              <ClientContactsField
                contacts={contacts}
                onChange={setContacts}
                inputClassName={inputClass}
                creatingUserIndex={creatingUserIndex}
                onCreateUser={(contact, index) => void createUserForContact(contact, index)}
              />
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contacts</h3>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Contacts are their own records now, not four fixed form slots
                </p>
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-400">No contacts yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className={thClass}>Name</th>
                          <th className={thClass}>Position</th>
                          <th className={thClass}>Email</th>
                          <th className={thClass}>Portal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {contacts.map((c, index) => (
                          <tr key={c.id ?? index}>
                            <td className="px-3 py-2.5 text-gray-900 dark:text-gray-100">{c.name}</td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{c.position || "—"}</td>
                            <td className="max-w-[12rem] truncate px-3 py-2.5 text-gray-600 dark:text-gray-300">
                              {c.email}
                            </td>
                            <td className="px-3 py-2.5">
                              {c.adminUserId ? (
                                <Link
                                  href={`/customer-users/${c.adminUserId}`}
                                  className={`${PILL_BASE} bg-green-50 text-green-700 hover:underline dark:bg-green-900/30 dark:text-green-400`}
                                >
                                  Active
                                </Link>
                              ) : c.id ? (
                                <button
                                  type="button"
                                  disabled={creatingUserIndex === index}
                                  onClick={() => void createUserForContact(c, index)}
                                  className={`${PILL_BASE} bg-amber-50 text-amber-700 hover:underline disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-400`}
                                  title="Create portal user"
                                >
                                  {creatingUserIndex === index ? "Creating…" : "Invite"}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>

          <section className={cardClass}>
            <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Opportunities and contracts</h3>
            {(defaults.opportunities ?? []).length === 0 && (defaults.contracts ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No opportunities or contracts yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className={thClass}>Item</th>
                      <th className={thClass}>Stage / status</th>
                      <th className={`${thClass} text-right`}>Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(defaults.opportunities ?? []).map((opp) => {
                      const label = opp.stage || titleCase(opp.status);
                      return (
                        <tr key={`o-${opp.id}`}>
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/opportunities/${opp.id}`}
                              className="text-gray-900 hover:underline dark:text-gray-100"
                            >
                              {opp.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`${PILL_BASE} ${stagePillClass(label)}`}>
                              {opp.active ? label : `${label} · Inactive`}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                            {formatCrmMoney(opp.amount, opp.currency)}
                          </td>
                        </tr>
                      );
                    })}
                    {(defaults.contracts ?? []).map((c) => {
                      const label = titleCase(c.status);
                      return (
                        <tr key={`c-${c.id}`}>
                          <td className="px-3 py-2.5">
                            <Link
                              href={`/contracts/${c.id}`}
                              className="text-gray-900 hover:underline dark:text-gray-100"
                            >
                              {c.contractNumber} {c.title}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`${PILL_BASE} ${stagePillClass(label)}`}>{label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                            {formatCrmMoney(c.contractValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {recentActivity.length > 0 ? (
            <section className={cardClass}>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Recent activity</h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {recentActivity.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-2">
                    <span className={`${PILL_BASE} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`}>
                      Invoice
                    </span>
                    <span>
                      {formatCrmShortDate(inv.issueDate)}: {inv.invoiceNumber}{" "}
                      {inv.status === "PAID" ? "paid" : "issued"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {customFieldEntries.length > 0 ? (
            <section className={cardClass}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Custom fields</h3>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Defined per workspace</p>
              <dl className="space-y-2">
                {customFieldEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-gray-500">{fieldLabel.get(key) ?? key}</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
