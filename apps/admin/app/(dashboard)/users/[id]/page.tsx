"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { messageFromApiError } from "@/lib/api-error";
import { UserAgreementsSection, type AgreementRecordRow } from "@/components/users/UserAgreementsSection";
import { buildPinnedUserFiles } from "@/lib/user-pinned-files";
import { adminFetch } from "@/lib/admin-api";
import { formatRolesLabel } from "@/lib/admin-roles";
import { AdminRolesMultiSelect, rolesFromApi, rolesToApi } from "@/components/users/AdminRolesMultiSelect";
import { MappedClientContactSelect } from "@/components/users/MappedClientContactSelect";
import { MappedProfileSelect, type ProfileMapOption } from "@/components/users/MappedProfileSelect";
import { AdminUserFilesField, type UserFileRow } from "@/components/users/AdminUserFilesField";
import { formatAdminUserActivityTitle } from "@/lib/admin-user-activity-display";
import { UserPhotoField } from "@/components/users/UserPhotoField";
import { UserAssignCredentialsModal } from "@/components/users/UserAssignCredentialsModal";
import { RecordOfflineAgreementModal } from "@/components/users/RecordOfflineAgreementModal";
import type { AdminRole } from "@/lib/admin-roles";
import { COUNTRY_OPTIONS } from "@/lib/country-options";
import {
  BankDetailsFields,
  bankDetailsFromUser,
  bankDetailsToApi,
  validateBankDetailsForm,
  type BankDetailsFormValue,
} from "@/components/users/BankDetailsFields";
import { COUNTRY_OTHER } from "@/lib/country-form";
import { profileKycStatusBadgeClass, profileKycStatusLabel } from "@/lib/profile-kyc";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

type EmergencyContact = { name: string; email?: string; phone?: string; relation?: string };

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

type UserDetail = {
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
  mfaEnabled: boolean;
  passwordNeedsReset: boolean;
  profilePhotoUrl: string | null;
  role: string;
  additionalRoles: string[];
  addressLine1: string | null;
  addressLine2: string | null;
  suburb: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  bankDetails: unknown;
  emergencyContacts: EmergencyContact[];
  agreementDocumentUrl: string | null;
  mappedClientContactId: string | null;
  mappedProfileId: string | null;
  mappedProfileLabel: string | null;
  idProofUrl: string | null;
  addressProofUrl: string | null;
  userFiles: { name?: string; url?: string }[];
  agreementTemplate?: { templatesSent: number; templatesSigned: number };
  agreementRecords?: AgreementRecordRow[];
  taxNumber?: string | null;
  requireProfileAfterFirstLogin: boolean;
  profileKycStatus: string;
  agreementFiles?: UserFileRow[];
  projectMembership: {
    memberId: string;
    projectId: string;
    projectLabel: string;
    profileName: string;
    profileEmail: string;
    templateAssigned: boolean;
    templateSigned: boolean;
  } | null;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roles, setRoles] = useState<AdminRole[]>(["website"]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<UserDetail | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [offlineAgreementOpen, setOfflineAgreementOpen] = useState(false);
  const [agreementRecords, setAgreementRecords] = useState<AgreementRecordRow[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([{ name: "", email: "", phone: "" }]);
  const [mappedClientContactId, setMappedClientContactId] = useState("");
  const [mappedProfileId, setMappedProfileId] = useState("");
  const [mappedProfileOption, setMappedProfileOption] = useState<ProfileMapOption | null>(null);
  const [userFiles, setUserFiles] = useState<UserFileRow[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetailsFormValue>(bankDetailsFromUser({}));
  const [inviteLoading, setInviteLoading] = useState(false);
  const [requireProfileAfterFirstLogin, setRequireProfileAfterFirstLogin] = useState(true);

  async function inviteUser() {
    const ok = await appConfirm(
      "Existing password will be overwritten by a temporary password. Do you want to continue?",
    );
    if (!ok) return;
    setInviteLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users/${id}/invite`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        temporaryPassword?: string;
        inviteEmailSent?: boolean;
      };
      if (!res.ok) {
        if (data.temporaryPassword) {
          appAlert(
            `${messageFromApiError(data, "Failed to send invite")}\n\n` +
              "Their previous password was already replaced. Share this temporary password so they can sign in:\n\n" +
              data.temporaryPassword,
          );
          return;
        }
        throw new Error(messageFromApiError(data, "Failed to send invite"));
      }
      appAlert(
        (data.message ||
          "Invite email sent.") +
          "\n\nAny password set earlier for this user no longer works. They must use the new temporary password from the invite email.",
      );
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function load() {
    try {
      const [userRes, activityRes] = await Promise.all([
        adminFetch(`/api/admin/users/${id}`),
        adminFetch(`/api/admin/users/${id}/activity`),
      ]);
      const data = await userRes.json();
      const row = data.data as UserDetail;
      setDefaults(row);
      setRoles(rolesFromApi(row.role, row.additionalRoles));
      setMappedClientContactId(row.mappedClientContactId ?? "");
      setMappedProfileId(row.mappedProfileId ?? "");
      setMappedProfileOption(
        row.mappedProfileId && row.mappedProfileLabel
          ? {
              id: row.mappedProfileId,
              label: row.mappedProfileLabel,
              mappedUserId: id,
              mappedUserEmail: row.email,
            }
          : null,
      );
      setUserFiles(
        Array.isArray(row.userFiles)
          ? row.userFiles
              .filter((f) => f && typeof f.url === "string" && f.url.trim())
              .map((f) => ({
                name: typeof f.name === "string" && f.name.trim() ? f.name.trim() : "File",
                url: f.url!.trim(),
              }))
          : [],
      );
      setPhotoUrl(row.profilePhotoUrl);
      setBankDetails(bankDetailsFromUser({ bankDetails: row.bankDetails, taxNumber: row.taxNumber }));
      if (Array.isArray(row.emergencyContacts) && row.emergencyContacts.length) {
        setEmergencyContacts(row.emergencyContacts);
      }
      setAgreementRecords(row.agreementRecords ?? []);
      setRequireProfileAfterFirstLogin(row.requireProfileAfterFirstLogin ?? true);
      const activityData = await activityRes.json();
      setActivity((activityData.data as ActivityRow[]) ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    if (defaults?.role === "client") {
      router.replace(`/customer-users/${id}`);
    }
  }, [defaults?.role, id, router]);

  function validateEmergencyContacts(rows: EmergencyContact[]) {
    const filled = rows.filter(
      (row) => row.name.trim() || row.email?.trim() || row.phone?.trim(),
    );
    for (const row of filled) {
      if (!row.name.trim() || !row.email?.trim() || !row.phone?.trim()) {
        appAlert("Each emergency contact needs a name, email, and phone.");
        return false;
      }
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateEmergencyContacts(emergencyContacts)) return;
    if (!roles.includes("client")) {
      const bankError = validateBankDetailsForm(bankDetails);
      if (bankError) {
        appAlert(bankError);
        return;
      }
    }
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "").trim();
    const { role, additionalRoles } = rolesToApi(roles);
    const body: Record<string, unknown> = {
      email: formData.get("email"),
      name: formData.get("name") || null,
      phone: String(formData.get("phone") ?? "").trim(),
      role,
      additionalRoles,
      profilePhotoUrl: photoUrl,
      active: formData.get("active") === "on",
      passwordNeedsReset: formData.get("passwordNeedsReset") === "on",
      addressLine1: String(formData.get("addressLine1") ?? "").trim() || null,
      addressLine2: String(formData.get("addressLine2") ?? "").trim() || null,
      postcode: String(formData.get("postcode") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      state: String(formData.get("state") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      emergencyContacts: emergencyContacts.filter(
        (row) => row.name.trim() && row.email?.trim() && row.phone?.trim(),
      ),
      mappedClientContactId: roles.includes("client") ? mappedClientContactId || null : null,
      mappedProfileId: roles.includes("client") ? null : mappedProfileId.trim() || null,
      userFiles,
      bankDetails: bankDetailsToApi(bankDetails),
      taxNumber: bankDetails.taxNumber.trim(),
      requireProfileAfterFirstLogin,
    };
    if (password) body.password = password;
    if (roles.includes("client")) {
      delete body.addressLine1;
      delete body.addressLine2;
      delete body.postcode;
      delete body.city;
      delete body.state;
      delete body.country;
      delete body.bankDetails;
      delete body.emergencyContacts;
      delete body.taxNumber;
    }

    try {
      const res = await adminFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(messageFromApiError(err, "Failed to save user"));
      }
      await load();
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }
  if (!defaults) return <p className="text-gray-500">User not found.</p>;

  const membership = defaults.projectMembership;
  const canAssignTemplate = !roles.includes("client");
  const isClientUser = roles.includes("client");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/users" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit user</h2>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Account</h3>
          <UserPhotoField
            name={defaults.name}
            email={defaults.email}
            photoUrl={photoUrl}
            onChange={setPhotoUrl}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input name="email" type="email" required defaultValue={defaults.email} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input name="name" defaultValue={defaults.name ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone *</label>
              <input name="phone" required defaultValue={defaults.phone ?? ""} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Roles *</label>
            <AdminRolesMultiSelect
              value={roles}
              onChange={(next) => {
                setRoles(next);
                if (next.includes("client")) {
                  setMappedProfileId("");
                  setMappedProfileOption(null);
                }
              }}
            />
            <p className="mt-2 text-xs text-gray-500">Effective access: {formatRolesLabel(roles[0] ?? defaults.role, roles.slice(1))}</p>
          </div>
          {roles.includes("client") ? (
            <MappedClientContactSelect
              value={mappedClientContactId}
              onChange={setMappedClientContactId}
              currentUserId={id}
              required
            />
          ) : null}
          {!roles.includes("client") ? (
            <MappedProfileSelect
              value={mappedProfileId}
              onChange={setMappedProfileId}
              currentUserId={id}
              initialOption={mappedProfileOption}
            />
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <input name="password" type="password" minLength={8} className={inputClass} placeholder="Leave blank to keep current" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="passwordNeedsReset" type="checkbox" defaultChecked={defaults.passwordNeedsReset} className="h-4 w-4 rounded" />
            Password needs reset (user must change password on next login)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="active" type="checkbox" defaultChecked={defaults.active} className="h-4 w-4 rounded" />
            Active (user can sign in)
          </label>
          {!isClientUser ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile KYC</p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${profileKycStatusBadgeClass(defaults.profileKycStatus)}`}
                >
                  {profileKycStatusLabel(defaults.profileKycStatus)}
                </span>
              </div>
              <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded"
                  checked={requireProfileAfterFirstLogin}
                  onChange={(e) => setRequireProfileAfterFirstLogin(e.target.checked)}
                />
                <span>User to add details after first login</span>
              </label>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                When checked, the user must complete bank details, address, emergency contact, and proof documents after
                signing in (Complete your profile).
              </p>
            </div>
          ) : null}
          {defaults.mfaEnabled ? (
            <p className="text-xs text-gray-500">MFA is enabled. User manages it under Settings → Security.</p>
          ) : null}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sends a sign-in email with a <strong>new temporary password</strong>. This overwrites any password
              already on the account (for example one set when you created the user). Use{" "}
              <strong>New password</strong> above only if you are <em>not</em> sending an invite.
            </p>
            <button
              type="button"
              disabled={inviteLoading || !defaults.active}
              onClick={() => void inviteUser()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Invite user
            </button>
          </div>
        </section>

        {!isClientUser ? (
        <>
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Address</h3>
          <p className="mb-4 text-xs text-gray-500">Usually completed by the member during first login after signing their contract.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Address line 1{isClientUser ? "" : " *"}
              </label>
              <input
                name="addressLine1"
                required={!isClientUser}
                defaultValue={defaults.addressLine1 ?? ""}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address line 2</label>
              <input name="addressLine2" defaultValue={defaults.addressLine2 ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Postcode</label>
              <input
                name="postcode"
                defaultValue={defaults.postcode ?? defaults.suburb ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">City{isClientUser ? "" : " *"}</label>
              <input name="city" required={!isClientUser} defaultValue={defaults.city ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State{isClientUser ? "" : " *"}</label>
              <input name="state" required={!isClientUser} defaultValue={defaults.state ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country{isClientUser ? "" : " *"}</label>
              <select name="country" required={!isClientUser} defaultValue={defaults.country ?? ""} className={inputClass}>
                <option value="">Select country…</option>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Bank details</h3>
          <BankDetailsFields value={bankDetails} onChange={setBankDetails} showTaxNumber />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Emergency contacts</h3>
          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-2">
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
                    type="email"
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
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-gray-600 hover:text-gray-900"
            onClick={() => setEmergencyContacts((prev) => [...prev, { name: "", email: "", phone: "" }])}
          >
            + Add contact
          </button>
        </section>

        <UserAgreementsSection
          records={agreementRecords}
          editableUserId={id}
          onRecordsChange={setAgreementRecords}
          onEditAgreement={() => setOfflineAgreementOpen(true)}
          emptyMessage="No agreements assigned yet. Assign a template or record an offline agreement."
          headerAction={
            canAssignTemplate ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOfflineAgreementOpen(true)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Record offline agreement
                </button>
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Assign template
                </button>
              </div>
            ) : null
          }
        />
        </>
        ) : null}

        <AdminUserFilesField
          files={userFiles}
          pinnedFiles={buildPinnedUserFiles(defaults)}
          onChange={setUserFiles}
        />

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Activity log</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              {activity.map((row) => (
                <li key={row.id} className="py-3">
                  <p className="font-medium">{formatAdminUserActivityTitle(row)}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(row.createdAt).toLocaleString("en-AU")}
                    {row.performedByName ? ` · ${row.performedByName}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </button>
      </form>

      <RecordOfflineAgreementModal
        userId={id}
        open={offlineAgreementOpen}
        onClose={() => setOfflineAgreementOpen(false)}
        onSaved={(records) => {
          setAgreementRecords(records);
          setOfflineAgreementOpen(false);
        }}
      />

      {assignOpen && canAssignTemplate ? (
        <UserAssignCredentialsModal
          userId={id}
          displayName={membership?.profileName || defaults.name || defaults.email}
          userEmail={defaults.email}
          projectId={membership?.projectId}
          memberId={membership?.memberId}
          onClose={() => setAssignOpen(false)}
          onSuccess={() => {
            setAssignOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
