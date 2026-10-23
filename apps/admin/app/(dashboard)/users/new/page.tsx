"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminRolesMultiSelect, rolesToApi } from "@/components/users/AdminRolesMultiSelect";
import { MappedClientContactSelect } from "@/components/users/MappedClientContactSelect";
import { MappedProfileSelect, type ProfileMapOption } from "@/components/users/MappedProfileSelect";
import { type AdminRole, isAdminRole } from "@/lib/admin-roles";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

function NewUserPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<AdminRole[]>(["website"]);
  const [mappedClientContactId, setMappedClientContactId] = useState("");
  const [mappedProfileId, setMappedProfileId] = useState("");
  const [mappedProfileOption, setMappedProfileOption] = useState<ProfileMapOption | null>(null);
  const [prefillEmail, setPrefillEmail] = useState("");
  const [prefillName, setPrefillName] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");

  useEffect(() => {
    const fromContact = searchParams.get("mappedClientContactId")?.trim();
    if (fromContact) {
      setMappedClientContactId(fromContact);
      setRoles(["client"]);
      return;
    }
    const email = searchParams.get("email")?.trim();
    if (email) setPrefillEmail(email);
    const name = searchParams.get("name")?.trim();
    if (name) setPrefillName(name);
    const phone = searchParams.get("phone")?.trim();
    if (phone) setPrefillPhone(phone);
    const fromProfile = searchParams.get("mappedProfileId")?.trim();
    if (fromProfile) {
      setMappedProfileId(fromProfile);
      setRoles(["project_member"]);
      const label =
        name && email ? `${name} (${email})` : name || email || "Selected profile";
      setMappedProfileOption({
        id: fromProfile,
        label,
        mappedUserId: null,
        mappedUserEmail: null,
      });
    }
  }, [searchParams]);

  function handleRolesChange(next: AdminRole[]) {
    const rolesNext = next.filter(isAdminRole);
    setRoles(rolesNext);
    if (rolesNext.includes("client")) {
      setMappedProfileId("");
      setMappedProfileOption(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (roles.includes("client")) {
      alert("Customer portal users are created from a client contact (Clients → contact → Create portal user).");
      return;
    }
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const { role, additionalRoles } = rolesToApi(roles);
    try {
      const res = await adminFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          name: formData.get("name") || undefined,
          phone: formData.get("phone"),
          password: formData.get("password"),
          role,
          additionalRoles,
          active: formData.get("active") === "on",
          passwordNeedsReset: formData.get("passwordNeedsReset") === "on",
          mappedClientContactId: roles.includes("client") ? mappedClientContactId : null,
          mappedProfileId: mappedProfileId.trim() || null,
          taxNumber: String(formData.get("taxNumber") ?? "").trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Failed");
      }
      router.push("/users");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/users" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New admin user</h2>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Email *</label>
          <input name="email" type="email" required className={inputClass} value={prefillEmail} onChange={(e) => setPrefillEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name</label>
          <input name="name" className={inputClass} value={prefillName} onChange={(e) => setPrefillName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Phone *</label>
          <input name="phone" required className={inputClass} value={prefillPhone} onChange={(e) => setPrefillPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Tax number *</label>
          <input name="taxNumber" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Password *</label>
          <input name="password" type="password" required minLength={8} className={inputClass} />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 8 characters.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">Roles *</label>
          <AdminRolesMultiSelect value={roles} onChange={handleRolesChange} />
        </div>
        {roles.includes("client") ? (
          <MappedClientContactSelect
            value={mappedClientContactId}
            onChange={setMappedClientContactId}
            required
          />
        ) : null}
        {!roles.includes("client") ? (
          <MappedProfileSelect
            value={mappedProfileId}
            onChange={setMappedProfileId}
            initialOption={mappedProfileOption}
          />
        ) : null}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input name="passwordNeedsReset" type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          Password needs reset (user must change password on first login)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input name="active" type="checkbox" defaultChecked className="h-4 w-4 rounded" />
          Active (user can sign in)
        </label>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create user
        </button>
      </form>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading…</div>}>
      <NewUserPageInner />
    </Suspense>
  );
}
