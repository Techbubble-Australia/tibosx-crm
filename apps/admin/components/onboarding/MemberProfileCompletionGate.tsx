"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { COUNTRY_OPTIONS } from "@/lib/country-options";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800";

type EmergencyContact = { name: string; email?: string; phone?: string; relation?: string };

export function MemberProfileCompletionGate() {
  const { isEffectiveProjectMember, loading: sessionLoading } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCountry, setBankCountry] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [bsb, setBsb] = useState("");
  const [bankNotes, setBankNotes] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", email: "", phone: "" },
  ]);

  useEffect(() => {
    if (sessionLoading || !isEffectiveProjectMember) return;
    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const onboarding = data?.data?.user?.onboarding as {
          agreementSigned?: boolean;
          profileComplete?: boolean;
        } | null;
        if (!onboarding?.agreementSigned || onboarding.profileComplete) return;
        const user = data?.data?.user as Record<string, unknown>;
        setAddressLine1(String(user.addressLine1 ?? ""));
        setCity(String(user.city ?? ""));
        setCountry(String(user.country ?? ""));
        const bank = user.bankDetails as Record<string, string> | null;
        if (bank) {
          setBankName(bank.bankName ?? "");
          setAccountName(bank.accountName ?? "");
          setAccountNumber(bank.accountNumber ?? "");
          setBankCountry(bank.country ?? "");
          setSwiftCode(bank.swiftCode ?? "");
          setBsb(bank.bsb ?? "");
          setBankNotes(bank.notes ?? "");
        }
        setIdProofUrl(String(user.idProofUrl ?? ""));
        setAddressProofUrl(String(user.addressProofUrl ?? ""));
        const contacts = user.emergencyContacts;
        if (Array.isArray(contacts) && contacts.length) {
          setEmergencyContacts(contacts as EmergencyContact[]);
        }
        setOpen(true);
      })
      .catch(() => undefined);
  }, [sessionLoading, isEffectiveProjectMember]);

  async function uploadProof(file: File | undefined, setter: (url: string) => void) {
    if (!file) return;
    const formData = new FormData();
    formData.append("document", file);
    const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
    const url =
      (json as { url?: string }).url ||
      (json as { data?: { url?: string } }).data?.url ||
      "";
    if (!url) throw new Error("Upload failed");
    setter(url);
  }

  async function handleSave() {
    const filled = emergencyContacts.filter((row) => row.name.trim());
    if (!addressLine1.trim() || !city.trim() || !country.trim()) {
      alert("Address line 1, city, and country are required.");
      return;
    }
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim() || !bankCountry.trim()) {
      alert("Complete all required bank details.");
      return;
    }
    if (!filled.length) {
      alert("Add at least one emergency contact.");
      return;
    }
    for (const row of filled) {
      if (!row.email?.trim() || !row.phone?.trim()) {
        alert("Each emergency contact needs name, email, and phone.");
        return;
      }
    }
    if (!idProofUrl || !addressProofUrl) {
      alert("Upload ID proof and address proof.");
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          country: country.trim(),
          bankDetails: {
            bankName: bankName.trim(),
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            country: bankCountry.trim(),
            swiftCode: swiftCode.trim() || undefined,
            bsb: bsb.trim() || undefined,
            notes: bankNotes.trim() || undefined,
          },
          idProofUrl,
          addressProofUrl,
          emergencyContacts: filled,
          markProfileComplete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
      setOpen(false);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Complete your profile</h2>
        <p className="mt-1 text-sm text-gray-500">Bank details, address, emergency contact, and proof documents are required.</p>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="mb-3 font-medium">Bank details *</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputClass} placeholder="Bank name *" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <input className={inputClass} placeholder="Account name *" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              <input className={inputClass} placeholder="Account number *" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              <select className={inputClass} value={bankCountry} onChange={(e) => setBankCountry(e.target.value)}>
                <option value="">Bank country *</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input className={inputClass} placeholder="SWIFT / BIC" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} />
              <input className={inputClass} placeholder="BSB / routing" value={bsb} onChange={(e) => setBsb(e.target.value)} />
              <textarea className={`${inputClass} sm:col-span-2`} rows={2} placeholder="Other bank details" value={bankNotes} onChange={(e) => setBankNotes(e.target.value)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-medium">Address *</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={`${inputClass} sm:col-span-2`} placeholder="Address line 1 *" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              <input className={inputClass} placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
              <select className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Country *</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-medium">Emergency contact *</h3>
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="mb-3 grid gap-2 sm:grid-cols-2">
                <input className={inputClass} placeholder="Name *" value={contact.name} onChange={(e) => setEmergencyContacts((prev) => prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))} />
                <input className={inputClass} placeholder="Relation" value={contact.relation ?? ""} onChange={(e) => setEmergencyContacts((prev) => prev.map((row, i) => (i === index ? { ...row, relation: e.target.value } : row)))} />
                <input className={inputClass} placeholder="Email *" value={contact.email ?? ""} onChange={(e) => setEmergencyContacts((prev) => prev.map((row, i) => (i === index ? { ...row, email: e.target.value } : row)))} />
                <input className={inputClass} placeholder="Phone *" value={contact.phone ?? ""} onChange={(e) => setEmergencyContacts((prev) => prev.map((row, i) => (i === index ? { ...row, phone: e.target.value } : row)))} />
              </div>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">ID proof *</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => void uploadProof(e.target.files?.[0], setIdProofUrl).catch((err) => alert(err instanceof Error ? err.message : "Upload failed"))} />
              {idProofUrl ? <p className="mt-1 text-xs text-green-600">Uploaded</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address proof *</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => void uploadProof(e.target.files?.[0], setAddressProofUrl).catch((err) => alert(err instanceof Error ? err.message : "Upload failed"))} />
              {addressProofUrl ? <p className="mt-1 text-xs text-green-600">Uploaded</p> : null}
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save and continue
          </button>
        </div>
      </div>
    </div>
  );
}
