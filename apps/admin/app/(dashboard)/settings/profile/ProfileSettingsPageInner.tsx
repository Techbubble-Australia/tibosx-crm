"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info, Loader2, Plus, Trash2 } from "lucide-react";
import { UserPhotoField } from "@/components/users/UserPhotoField";
import { adminFetch } from "@/lib/admin-api";
import { messageFromApiError } from "@/lib/api-error";
import { AdminUserFilesField, type UserFileRow } from "@/components/users/AdminUserFilesField";
import { UserAgreementsSection, type AgreementRecordRow } from "@/components/users/UserAgreementsSection";
import { buildPinnedUserFiles } from "@/lib/user-pinned-files";
import { formatAdminUserActivityTitle } from "@/lib/admin-user-activity-display";
import { roleLabel, type AdminRole, isAdminRole } from "@/lib/admin-roles";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import { COUNTRY_OTHER, mergeCountryValue, splitCountryValue } from "@/lib/country-form";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import {
  BankDetailsFields,
  bankDetailsFromUser,
  bankDetailsToApi,
  validateBankDetailsForm,
  type BankDetailsFormValue,
} from "@/components/users/BankDetailsFields";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-white";

const readOnlyClass = `${inputClass} bg-gray-50 dark:bg-gray-950`;

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
  fieldLabel?: string | null;
  oldValue: string | null;
  newValue: string | null;
  performedByName: string;
  createdAt: string;
};

export default function ProfileSettingsPageInner() {
  const { refreshSession, memberOnboarding } = useAdminSession();
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding") === "1";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdminRole>("website");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [countrySelect, setCountrySelect] = useState("");
  const [countryOther, setCountryOther] = useState("");
  const [bankDetails, setBankDetails] = useState<BankDetailsFormValue>(bankDetailsFromUser({}));
  const [savingBank, setSavingBank] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([{ name: "", email: "", phone: "" }]);
  const [agreementDocumentUrl, setAgreementDocumentUrl] = useState<string | null>(null);
  const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
  const [addressProofUrl, setAddressProofUrl] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<UserFileRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [agreementRecords, setAgreementRecords] = useState<AgreementRecordRow[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isClientUser = role === "client";
  const isProjectMemberOnboarding = onboarding && role === "project_member";
  const showConsultantOnboardingBanner =
    onboarding && Boolean(memberOnboarding?.profileOnboardingRequired) && !loading;
  const addressFieldsRequired =
    Boolean(memberOnboarding?.profileOnboardingRequired) || role === "project_member" || isProjectMemberOnboarding;
  const canEditAccountFields = role === "admin";

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
        const userRole = user.role;
        if (typeof userRole === "string" && isAdminRole(userRole)) setRole(userRole);
        setAddressLine1(String(user.addressLine1 ?? ""));
        setAddressLine2(String(user.addressLine2 ?? ""));
        setPostcode(String(user.postcode ?? user.suburb ?? ""));
        setCity(String(user.city ?? ""));
        setStateRegion(String(user.state ?? ""));
        const addressCountry = splitCountryValue(String(user.country ?? ""));
        setCountrySelect(addressCountry.select);
        setCountryOther(addressCountry.other);
        setBankDetails(
          bankDetailsFromUser({
            bankDetails: user.bankDetails,
            taxNumber: typeof user.taxNumber === "string" ? user.taxNumber : null,
          }),
        );
        const contacts = user.emergencyContacts;
        if (Array.isArray(contacts) && contacts.length) {
          setEmergencyContacts(contacts as EmergencyContact[]);
        }
        let agreementUrl =
          typeof user.agreementDocumentUrl === "string" ? user.agreementDocumentUrl : null;
        if (!agreementUrl?.trim()) {
          try {
            const agRes = await adminFetch("/api/admin/projects/my-agreement");
            if (agRes.ok) {
              const agData = await agRes.json();
              const signed = Boolean((agData.data as { signed?: boolean })?.signed);
              const docUrl = (agData.data as { agreementDocumentUrl?: string })?.agreementDocumentUrl;
              if (signed && typeof docUrl === "string" && docUrl.trim()) agreementUrl = docUrl;
            }
          } catch {
            /* optional */
          }
        }
        setAgreementDocumentUrl(agreementUrl);
        setIdProofUrl(typeof user.idProofUrl === "string" ? user.idProofUrl : null);
        setAddressProofUrl(typeof user.addressProofUrl === "string" ? user.addressProofUrl : null);
        const files = user.userFiles;
        setUserFiles(
          Array.isArray(files)
            ? files
                .filter((f): f is { name?: string; url?: string } => f && typeof f === "object")
                .map((f) => ({ name: String(f.name ?? "File"), url: String(f.url ?? "") }))
                .filter((f) => f.url.trim())
            : [],
        );
        setProfilePhotoUrl(
          typeof user.profilePhotoUrl === "string" && user.profilePhotoUrl.trim()
            ? user.profilePhotoUrl.trim()
            : null,
        );
        const records = user.agreementRecords;
        setAgreementRecords(Array.isArray(records) ? (records as AgreementRecordRow[]) : []);
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

  function buildAddressPayload(country: string) {
    return {
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      postcode: postcode.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      country,
    };
  }

  function validateAddressFields(country: string) {
    if (!addressFieldsRequired) return true;
    if (!addressLine1.trim() || !city.trim() || !stateRegion.trim() || !postcode.trim() || !country) {
      appAlert("Address line 1, city, state, postcode, and country are required.");
      return false;
    }
    if (countrySelect === COUNTRY_OTHER && !countryOther.trim()) {
      appAlert("Enter your country name when Other is selected.");
      return false;
    }
    return true;
  }

  function validateEmergencyContacts(rows: EmergencyContact[]) {
    const touched = rows.filter(
      (row) => row.name.trim() || row.email?.trim() || row.phone?.trim(),
    );
    if (!touched.length) {
      appAlert("Add at least one emergency contact.");
      return false;
    }
    for (const row of touched) {
      if (!row.name.trim() || !row.email?.trim() || !row.phone?.trim()) {
        appAlert("Each emergency contact needs a name, email, and phone.");
        return false;
      }
    }
    return true;
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmergencyContacts(emergencyContacts)) return;

    const country = mergeCountryValue(countrySelect, countryOther);
    if (isProjectMemberOnboarding && !validateAddressFields(country)) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        emergencyContacts: emergencyContacts.filter(
          (row) => row.name.trim() && row.email?.trim() && row.phone?.trim(),
        ),
        profilePhotoUrl,
        userFiles,
      };
      if (canEditAccountFields) {
        body.name = name.trim();
        body.email = email.trim();
        body.phone = phone.trim() || null;
      }
      if (isProjectMemberOnboarding) {
        body.markProfileComplete = true;
        Object.assign(body, buildAddressPayload(country));
      }

      const res = await adminFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to save profile"));
      await refreshSession();
      if (onboarding) {
        window.location.href = "/timesheets";
      }
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      appAlert("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await adminFetch("/api/auth/password/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to update password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      appAlert("Password updated.");
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setSavingPassword(false);
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
      {showConsultantOnboardingBanner ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Complete your personal details to access timesheets.
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your user record</h2>
          <p className="text-sm text-gray-500">
            {canEditAccountFields
              ? "As an administrator you can update your account details below, plus password and emergency contacts."
              : isClientUser
                ? "Name, email, phone, and role are managed by your administrator. You can update your profile photo and password below."
                : "Name, email, phone, and role are managed by your administrator. Update your password and emergency contacts below."}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            if (!canEditAccountFields) return;
            setSaving(true);
            try {
              const res = await adminFetch("/api/auth/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: name.trim(),
                  email: email.trim(),
                  phone: phone.trim() || null,
                  profilePhotoUrl,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
              await refreshSession();
              appAlert("Account saved.");
            } catch (error) {
              appAlert(error instanceof Error ? error.message : "Failed to save");
            } finally {
              setSaving(false);
            }
          })();
        }}
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Account</h3>
        <div className="mb-4">
          <UserPhotoField
            name={name}
            email={email}
            photoUrl={profilePhotoUrl}
            onChange={(url) => {
              setProfilePhotoUrl(url);
              void (async () => {
                try {
                  const res = await adminFetch("/api/auth/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profilePhotoUrl: url }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    throw new Error(messageFromApiError(data, "Failed to save profile photo"));
                  }
                  await refreshSession();
                } catch (error) {
                  appAlert(error instanceof Error ? error.message : "Failed to save profile photo");
                }
              })();
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              className={canEditAccountFields ? inputClass : readOnlyClass}
              value={email}
              readOnly={!canEditAccountFields}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              className={canEditAccountFields ? inputClass : readOnlyClass}
              value={name}
              readOnly={!canEditAccountFields}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              className={canEditAccountFields ? inputClass : readOnlyClass}
              value={phone}
              readOnly={!canEditAccountFields}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Role</label>
            <input className={readOnlyClass} value={roleLabel(role)} readOnly />
          </div>
        </div>
        {canEditAccountFields ? (
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save account
            </button>
          </div>
        ) : null}
      </form>

      <form onSubmit={(e) => void handlePasswordSubmit(e)} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">New password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Current password</label>
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <input
              type="password"
              className={inputClass}
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirm new password</label>
            <input
              type="password"
              className={inputClass}
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update password
          </button>
        </div>
      </form>

      {!isClientUser ? (
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Address line 1{addressFieldsRequired ? <span className="text-red-500"> *</span> : null}
            </label>
            <input
              className={inputClass}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required={addressFieldsRequired}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address line 2</label>
            <input className={inputClass} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Postcode{addressFieldsRequired ? <span className="text-red-500"> *</span> : null}</label>
            <input
              className={inputClass}
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              required={addressFieldsRequired}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">City{addressFieldsRequired ? <span className="text-red-500"> *</span> : null}</label>
            <input
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required={addressFieldsRequired}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">State{addressFieldsRequired ? <span className="text-red-500"> *</span> : null}</label>
            <input
              className={inputClass}
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              required={addressFieldsRequired}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Country{addressFieldsRequired ? <span className="text-red-500"> *</span> : null}</label>
            <select
              className={inputClass}
              value={countrySelect}
              onChange={(e) => setCountrySelect(e.target.value)}
              required={addressFieldsRequired}
            >
              <option value="">Select country…</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {countrySelect === COUNTRY_OTHER ? (
              <input
                className={`${inputClass} mt-2`}
                placeholder="Enter country name *"
                value={countryOther}
                onChange={(e) => setCountryOther(e.target.value)}
                required={addressFieldsRequired}
              />
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={savingAddress}
            onClick={() => {
              void (async () => {
                const country = mergeCountryValue(countrySelect, countryOther);
                if (!validateAddressFields(country)) return;
                setSavingAddress(true);
                try {
                  const res = await adminFetch("/api/auth/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(buildAddressPayload(country)),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
                  await refreshSession();
                  appAlert("Address saved.");
                } catch (error) {
                  appAlert(error instanceof Error ? error.message : "Failed to save address");
                } finally {
                  setSavingAddress(false);
                }
              })();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {savingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save address
          </button>
        </div>
      </section>
      ) : null}

      {!isClientUser ? (
      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Bank details</h3>
        <BankDetailsFields value={bankDetails} onChange={setBankDetails} showTaxNumber />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={savingBank}
            onClick={() => {
              void (async () => {
                const bankError = validateBankDetailsForm(bankDetails);
                if (bankError) {
                  appAlert(bankError);
                  return;
                }
                const payload = bankDetailsToApi(bankDetails);
                if (!payload) {
                  appAlert("Complete all required bank details.");
                  return;
                }
                if (!bankDetails.taxNumber.trim()) {
                  appAlert("Tax number is required.");
                  return;
                }
                setSavingBank(true);
                try {
                  const res = await adminFetch("/api/auth/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      bankDetails: payload,
                      taxNumber: bankDetails.taxNumber.trim() || null,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
                } catch (error) {
                  appAlert(error instanceof Error ? error.message : "Failed to save bank details");
                } finally {
                  setSavingBank(false);
                }
              })();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {savingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save bank details
          </button>
        </div>
      </section>
      ) : null}

      {!isClientUser ? (
      <form onSubmit={(e) => void handleProfileSubmit(e)} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Emergency contacts</h3>
            <button
              type="button"
              onClick={() => setEmergencyContacts((prev) => [...prev, { name: "", email: "", phone: "" }])}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                  <input
                    className={inputClass}
                    value={contact.name}
                    required
                    onChange={(e) => updateContact(index, { name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Relation</label>
                  <input
                    className={inputClass}
                    value={contact.relation ?? ""}
                    onChange={(e) => updateContact(index, { relation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                  <input
                    className={inputClass}
                    type="email"
                    required
                    value={contact.email ?? ""}
                    onChange={(e) => updateContact(index, { email: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone <span className="text-red-500">*</span></label>
                    <input
                      className={inputClass}
                      required
                      value={contact.phone ?? ""}
                      onChange={(e) => updateContact(index, { phone: e.target.value })}
                    />
                  </div>
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
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isProjectMemberOnboarding ? "Save and continue" : "Save emergency contacts"}
            </button>
          </div>
        </section>
      </form>
      ) : null}

      <UserAgreementsSection records={agreementRecords} />

      <AdminUserFilesField
        files={userFiles}
        pinnedFiles={buildPinnedUserFiles({
          idProofUrl,
          addressProofUrl,
        })}
        allowUpload={role === "admin"}
        allowRemove={role === "admin"}
        onChange={(next) => {
          setUserFiles(next);
          if (role !== "admin") return;
          void adminFetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userFiles: next }),
          }).catch(() => undefined);
        }}
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Activity log</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">No changes recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {activity.map((row) => (
              <li key={row.id} className="py-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatAdminUserActivityTitle(row)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(row.createdAt).toLocaleString("en-AU")}
                  {row.performedByName ? ` · ${row.performedByName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
