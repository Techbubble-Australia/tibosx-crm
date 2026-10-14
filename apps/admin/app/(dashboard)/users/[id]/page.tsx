"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatRolesLabel } from "@/lib/admin-roles";
import { AdminRolesMultiSelect, rolesFromApi, rolesToApi } from "@/components/users/AdminRolesMultiSelect";
import { MappedClientContactSelect } from "@/components/users/MappedClientContactSelect";
import { MappedProfileSelect, type ProfileMapOption } from "@/components/users/MappedProfileSelect";
import { AdminUserFilesField, type UserFileRow } from "@/components/users/AdminUserFilesField";
import { UserPhotoField } from "@/components/users/UserPhotoField";
import { UserAssignCredentialsModal } from "@/components/users/UserAssignCredentialsModal";
import type { AdminRole } from "@/lib/admin-roles";
import { COUNTRY_OPTIONS } from "@/lib/country-options";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

type EmergencyContact = { name: string; email?: string; phone?: string; relation?: string };

type ActivityRow = {
  id: string;
  action: string;
  fieldName: string | null;
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
  emergencyContacts: EmergencyContact[];
  agreementDocumentUrl: string | null;
  mappedClientContactId: string | null;
  mappedProfileId: string | null;
  mappedProfileLabel: string | null;
  idProofUrl: string | null;
  addressProofUrl: string | null;
  userFiles: { name?: string; url?: string }[];
  projectMembership: {
    memberId: string;
    projectId: string;
    projectLabel: string;
    profileName: string;
    profileEmail: string;
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
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([{ name: "", email: "", phone: "" }]);
  const [mappedClientContactId, setMappedClientContactId] = useState("");
  const [mappedProfileId, setMappedProfileId] = useState("");
  const [mappedProfileOption, setMappedProfileOption] = useState<ProfileMapOption | null>(null);
  const [userFiles, setUserFiles] = useState<UserFileRow[]>([]);

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
      if (Array.isArray(row.emergencyContacts) && row.emergencyContacts.length) {
        setEmergencyContacts(row.emergencyContacts);
      }
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

  function validateEmergencyContacts(rows: EmergencyContact[]) {
    const filled = rows.filter(
      (row) => row.name.trim() || row.email?.trim() || row.phone?.trim(),
    );
    for (const row of filled) {
      if (!row.name.trim() || !row.email?.trim() || !row.phone?.trim()) {
        alert("Each emergency contact needs a name, email, and phone.");
        return false;
      }
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateEmergencyContacts(emergencyContacts)) return;
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
      mappedProfileId: mappedProfileId.trim() || null,
      userFiles,
    };
    if (password) body.password = password;

    try {
      const res = await adminFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      await load();
      router.push("/users");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update user");
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
  const memberForModal = membership
    ? {
        id: membership.memberId,
        firstName: membership.profileName.split(" ")[0] ?? membership.profileName,
        lastName: membership.profileName.split(" ").slice(1).join(" ") || "—",
        email: membership.profileEmail,
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/users" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit user</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!membership) {
              alert("Link this user to a project member before assigning a template.");
              return;
            }
            setAssignOpen(true);
          }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium dark:border-gray-600"
        >
          Assign template
        </button>
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
            <AdminRolesMultiSelect value={roles} onChange={setRoles} />
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
          <MappedProfileSelect
            value={mappedProfileId}
            onChange={setMappedProfileId}
            currentUserId={id}
            initialOption={mappedProfileOption}
          />
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
          {defaults.mfaEnabled ? (
            <p className="text-xs text-gray-500">MFA is enabled. User manages it under Settings → Security.</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Address</h3>
          <p className="mb-4 text-xs text-gray-500">Usually completed by the member during first login after signing their contract.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Address line 1 *</label>
              <input name="addressLine1" required defaultValue={defaults.addressLine1 ?? ""} className={inputClass} />
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
              <label className="mb-1 block text-sm font-medium">City *</label>
              <input name="city" required defaultValue={defaults.city ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State *</label>
              <input name="state" required defaultValue={defaults.state ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country *</label>
              <select name="country" required defaultValue={defaults.country ?? ""} className={inputClass}>
                <option value="">Select country…</option>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Emergency contacts</h3>
          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-800 sm:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="Name *"
                  value={contact.name}
                  onChange={(e) =>
                    setEmergencyContacts((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Relation"
                  value={contact.relation ?? ""}
                  onChange={(e) =>
                    setEmergencyContacts((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, relation: e.target.value } : row)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Email *"
                  type="email"
                  value={contact.email ?? ""}
                  onChange={(e) =>
                    setEmergencyContacts((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, email: e.target.value } : row)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Phone *"
                  value={contact.phone ?? ""}
                  onChange={(e) =>
                    setEmergencyContacts((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, phone: e.target.value } : row)),
                    )
                  }
                />
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

        <AdminUserFilesField files={userFiles} onChange={setUserFiles} />

        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold">Activity log</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
              {activity.map((row) => (
                <li key={row.id} className="py-3">
                  <p className="font-medium">{row.fieldName ? `${row.fieldName} updated` : row.action.replaceAll("_", " ")}</p>
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

      {assignOpen && membership && memberForModal ? (
        <UserAssignCredentialsModal
          projectId={membership.projectId}
          member={memberForModal}
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
