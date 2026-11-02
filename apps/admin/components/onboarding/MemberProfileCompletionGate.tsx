"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { BANK_PAYROLL_NOTES_LABEL } from "@/lib/bank-details-copy";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import { COUNTRY_OTHER, mergeCountryValue, splitCountryValue } from "@/lib/country-form";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { messageFromApiError } from "@/lib/api-error";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800";

type EmergencyContact = { name: string; email?: string; phone?: string; relation?: string };

export function MemberProfileCompletionGate() {
  const pathname = usePathname();
  const { sessionLoaded, memberOnboarding, refreshSession, role, additionalRoles } = useAdminSession();
  const isClientUser =
    role === "client" || additionalRoles.some((r) => r === "client");
  const needsProfileCompletion = Boolean(
    !isClientUser &&
      memberOnboarding?.profileOnboardingRequired &&
      memberOnboarding?.agreementSigned,
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postcode, setPostcode] = useState("");
  const [countrySelect, setCountrySelect] = useState("");
  const [countryOther, setCountryOther] = useState("");
  const [uploadingProof, setUploadingProof] = useState<"id" | "address" | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCountrySelect, setBankCountrySelect] = useState("");
  const [bankCountryOther, setBankCountryOther] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [bsb, setBsb] = useState("");
  const [bankNotes, setBankNotes] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");
  const [addressProofUrl, setAddressProofUrl] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", email: "", phone: "" },
  ]);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  useEffect(() => {
    if (!sessionLoaded || !needsProfileCompletion) return;
    void adminFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.data?.user as Record<string, unknown>;
        setTaxNumber(typeof user.taxNumber === "string" ? user.taxNumber : "");
        setAddressLine1(String(user.addressLine1 ?? ""));
        setCity(String(user.city ?? ""));
        setStateRegion(String(user.state ?? ""));
        setPostcode(String(user.postcode ?? ""));
        const addressCountry = splitCountryValue(String(user.country ?? ""));
        setCountrySelect(addressCountry.select);
        setCountryOther(addressCountry.other);
        const bank = user.bankDetails as Record<string, string> | null;
        if (bank) {
          setBankName(bank.bankName ?? "");
          setAccountName(bank.accountName ?? "");
          setAccountNumber(bank.accountNumber ?? "");
          const bankCountry = splitCountryValue(bank.country ?? "");
          setBankCountrySelect(bankCountry.select);
          setBankCountryOther(bankCountry.other);
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
  }, [sessionLoaded, needsProfileCompletion]);

  async function uploadProof(
    file: File | undefined,
    kind: "id" | "address",
    setter: (url: string) => void,
  ) {
    if (!file) return;
    setUploadingProof(kind);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
      const url = readUploadImageUrlFromJson(json);
      if (!url) throw new Error("Upload failed");
      setter(url);
    } finally {
      setUploadingProof(null);
    }
  }

  async function handleSave() {
    const filled = emergencyContacts.filter((row) => row.name.trim());
    const country = mergeCountryValue(countrySelect, countryOther);
    const bankCountry = mergeCountryValue(bankCountrySelect, bankCountryOther);
    if (!addressLine1.trim() || !city.trim() || !stateRegion.trim() || !postcode.trim() || !country) {
      appAlert("Address line 1, city, state, postcode, and country are required.");
      return;
    }
    if (countrySelect === COUNTRY_OTHER && !countryOther.trim()) {
      appAlert("Enter your country name when Other is selected.");
      return;
    }
    if (
      !bankName.trim() ||
      !accountName.trim() ||
      !accountNumber.trim() ||
      !bankCountry ||
      !bsb.trim() ||
      !bankNotes.trim() ||
      !taxNumber.trim()
    ) {
      appAlert("Complete all required bank details (including tax number, BSB/Routing/IFSC, and payroll compliance notes).");
      return;
    }
    if (bankCountrySelect === COUNTRY_OTHER && !bankCountryOther.trim()) {
      appAlert("Enter bank country name when Other is selected.");
      return;
    }
    if (!filled.length) {
      appAlert("Add at least one emergency contact.");
      return;
    }
    for (const row of filled) {
      const email = row.email?.trim() ?? "";
      const phone = row.phone?.trim() ?? "";
      if (!email || !phone) {
        appAlert("Each emergency contact needs name, email, and phone.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        appAlert(`Emergency contact email looks invalid: ${email}`);
        return;
      }
    }
    if (!idProofUrl || !addressProofUrl) {
      appAlert("Upload ID proof and address proof.");
      return;
    }
    if (!privacyAcknowledged) {
      appAlert("Please read and acknowledge the Privacy Notice before continuing.");
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
          state: stateRegion.trim(),
          postcode: postcode.trim(),
          country,
          taxNumber: taxNumber.trim(),
          bankDetails: {
            bankName: bankName.trim(),
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            country: bankCountry,
            swiftCode: swiftCode.trim() || undefined,
            bsb: bsb.trim(),
            notes: bankNotes.trim(),
          },
          idProofUrl,
          addressProofUrl,
          emergencyContacts: filled,
          markProfileComplete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save profile"));
      await refreshSession();
      setOpen(false);
      window.location.reload();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (isClientUser) {
    return null;
  }

  if (pathname === "/timesheets" || pathname.startsWith("/timesheets/")) {
    return null;
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
              <select className={inputClass} value={bankCountrySelect} onChange={(e) => setBankCountrySelect(e.target.value)}>
                <option value="">Bank country *</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {bankCountrySelect === COUNTRY_OTHER ? (
                <input
                  className={`${inputClass} mt-2 sm:col-span-2`}
                  placeholder="Enter country name *"
                  value={bankCountryOther}
                  onChange={(e) => setBankCountryOther(e.target.value)}
                  required
                />
              ) : null}
              <input className={inputClass} placeholder="SWIFT / BIC" value={swiftCode} onChange={(e) => setSwiftCode(e.target.value)} />
              <input className={inputClass} placeholder="BSB/Routing/IFSC etc. *" required value={bsb} onChange={(e) => setBsb(e.target.value)} />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Tax number *"
                required
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
              />
              <label className="mb-1 block text-sm font-medium sm:col-span-2">
                {BANK_PAYROLL_NOTES_LABEL} *
              </label>
              <textarea
                className={`${inputClass} sm:col-span-2`}
                rows={2}
                required
                placeholder="Not applicable"
                value={bankNotes}
                onChange={(e) => setBankNotes(e.target.value)}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-medium">Address *</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={`${inputClass} sm:col-span-2`} placeholder="Address line 1 *" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
              <input className={inputClass} placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className={inputClass} placeholder="State *" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
              <input className={inputClass} placeholder="Postcode *" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              <select className={inputClass} value={countrySelect} onChange={(e) => setCountrySelect(e.target.value)}>
                <option value="">Country *</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {countrySelect === COUNTRY_OTHER ? (
                <input
                  className={`${inputClass} sm:col-span-2`}
                  placeholder="Enter country name *"
                  value={countryOther}
                  onChange={(e) => setCountryOther(e.target.value)}
                  required
                />
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-medium">Emergency contact *</h3>
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="mb-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name *</label>
                  <input
                    className={inputClass}
                    value={contact.name}
                    onChange={(e) =>
                      setEmergencyContacts((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Relation</label>
                  <input
                    className={inputClass}
                    value={contact.relation ?? ""}
                    onChange={(e) =>
                      setEmergencyContacts((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, relation: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email *</label>
                  <input
                    className={inputClass}
                    value={contact.email ?? ""}
                    onChange={(e) =>
                      setEmergencyContacts((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, email: e.target.value } : row)),
                      )
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone *</label>
                  <input
                    className={inputClass}
                    value={contact.phone ?? ""}
                    onChange={(e) =>
                      setEmergencyContacts((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, phone: e.target.value } : row)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">ID proof *</label>
              <input
                type="file"
                accept=".pdf,image/*"
                disabled={uploadingProof === "id"}
                onChange={(e) =>
                  void uploadProof(e.target.files?.[0], "id", setIdProofUrl).catch((err) =>
                    appAlert(err instanceof Error ? err.message : "Upload failed"),
                  )
                }
              />
              {uploadingProof === "id" ? <p className="mt-1 text-xs text-gray-500">Uploading…</p> : null}
              {idProofUrl ? <p className="mt-1 text-xs text-green-600">Uploaded</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address proof *</label>
              <input
                type="file"
                accept=".pdf,image/*"
                disabled={uploadingProof === "address"}
                onChange={(e) =>
                  void uploadProof(e.target.files?.[0], "address", setAddressProofUrl).catch((err) =>
                    appAlert(err instanceof Error ? err.message : "Upload failed"),
                  )
                }
              />
              {uploadingProof === "address" ? <p className="mt-1 text-xs text-gray-500">Uploading…</p> : null}
              {addressProofUrl ? <p className="mt-1 text-xs text-green-600">Uploaded</p> : null}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          <p className="font-semibold text-gray-900 dark:text-gray-100">Privacy notice — Documents and personal information</p>
          <p className="mt-2 leading-relaxed">
            Documents uploaded to TIBOSX may contain personal, employment, identity, visa, financial or other confidential
            information. The system collects and uses these documents for legitimate business purposes, including recruitment,
            employment administration, customer management and project delivery. Access is restricted according to user
            permissions and business requirements. The system stores all information securely and follows our data retention
            policy. Authorised personnel and service providers, including those located overseas, may process or access
            information where necessary. For details about collection, use, storage, disclosure, retention and your privacy
            rights, read the{" "}
            <a
              href={`${(process.env.NEXT_PUBLIC_WEB_URL || "https://techbubble.com.au").replace(/\/$/, "")}/privacy`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-600 underline dark:text-blue-400"
            >
              TIBOSX Privacy Policy
            </a>{" "}
            or contact{" "}
            <a href="mailto:hr@techbubble.com.au" className="font-medium text-blue-600 underline dark:text-blue-400">
              hr@techbubble.com.au
            </a>
            .
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
              checked={privacyAcknowledged}
              onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
              required
            />
            <span>
              I have read the Privacy Notice and acknowledge how my information may be handled as described in the TIBOSX
              Privacy Policy.
            </span>
          </label>
        </section>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saving || !privacyAcknowledged}
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
