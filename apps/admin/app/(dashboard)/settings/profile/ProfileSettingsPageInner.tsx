"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveDocumentHref } from "@/lib/media-url";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

type EmergencyContact = {
  name: string;
  email?: string;
  phone?: string;
  relation?: string;
};

type ActivityRow = {
  id: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedByName: string;
  createdAt: string;
};

export default function ProfileSettingsPageInner() {
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([{ name: "" }]);
  const [agreementDocumentUrl, setAgreementDocumentUrl] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, activityRes] = await Promise.all([
          adminFetch("/api/auth/me"),
          adminFetch("/api/auth/profile/activity"),
        ]);
        const meData = await meRes.json();
        const user = meData.data?.user as Record<string, unknown>;
        setEmail(String(user.email ?? ""));
        setName(String(user.name ?? ""));
        setPhone(String(user.phone ?? ""));
        setAddressLine1(String(user.addressLine1 ?? ""));
        setAddressLine2(String(user.addressLine2 ?? ""));
        setSuburb(String(user.suburb ?? ""));
        setCity(String(user.city ?? ""));
        setStateRegion(String(user.state ?? ""));
        setCountry(String(user.country ?? ""));
        const contacts = user.emergencyContacts;
        if (Array.isArray(contacts) && contacts.length) {
          setEmergencyContacts(contacts as EmergencyContact[]);
        }
        setAgreementDocumentUrl(
          typeof user.agreementDocumentUrl === "string" ? user.agreementDocumentUrl : null,
        );
        const activityData = await activityRes.json();
        setActivity((activityData.data as ActivityRow[]) ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function updateContact(index: number, patch: Partial<EmergencyContact>) {
    setEmergencyContacts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          addressLine1: addressLine1.trim() || null,
          addressLine2: addressLine2.trim() || null,
          suburb: suburb.trim() || null,
          city: city.trim() || null,
          state: stateRegion.trim() || null,
          country: country.trim() || null,
          emergencyContacts: emergencyContacts.filter((row) => row.name.trim()),
          markProfileComplete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save profile");
      if (onboarding) {
        window.location.href = "/timesheets";
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {onboarding ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Complete your personal details to access timesheets.
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500">Your contact details and emergency contacts.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input className={`${inputClass} bg-gray-50 dark:bg-gray-950`} value={email} readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Full name *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country *</label>
              <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address line 1 *</label>
              <input className={inputClass} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address line 2</label>
              <input className={inputClass} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Suburb</label>
              <input className={inputClass} value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City *</label>
              <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State</label>
              <input className={inputClass} value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Emergency contacts</h3>
            <button
              type="button"
              onClick={() => setEmergencyContacts((prev) => [...prev, { name: "" }])}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="Name *"
                  value={contact.name}
                  onChange={(e) => updateContact(index, { name: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Relation"
                  value={contact.relation ?? ""}
                  onChange={(e) => updateContact(index, { relation: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Phone"
                  value={contact.phone ?? ""}
                  onChange={(e) => updateContact(index, { phone: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="Email"
                    value={contact.email ?? ""}
                    onChange={(e) => updateContact(index, { email: e.target.value })}
                  />
                  {emergencyContacts.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setEmergencyContacts((prev) => prev.filter((_, i) => i !== index))}
                      className="rounded-lg border border-gray-200 p-2 text-red-500 dark:border-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {agreementDocumentUrl ? (
          <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Signed agreement</h3>
            <a
              href={resolveDocumentHref(agreementDocumentUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Download agreement
            </a>
          </section>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save profile
          </button>
        </div>
      </form>

      {activity.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {activity.map((row) => (
              <li key={row.id} className="py-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {row.fieldName ? `${row.fieldName} updated` : row.action.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(row.createdAt).toLocaleString("en-AU")}
                  {row.performedByName ? ` · ${row.performedByName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
