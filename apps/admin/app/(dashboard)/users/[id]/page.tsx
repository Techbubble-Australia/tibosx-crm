"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { AdminRoleSelect } from "@/components/users/AdminRoleSelect";
import { type AdminRole, isAdminRole } from "@/lib/admin-roles";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [role, setRole] = useState<AdminRole>("website");
  const [defaults, setDefaults] = useState<{
    email: string;
    name: string | null;
    active: boolean;
    mfaEnabled: boolean;
    passwordNeedsReset: boolean;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/users/${id}`);
        const data = await res.json();
        const row = data.data;
        setDefaults(row);
        if (typeof row?.role === "string" && isAdminRole(row.role)) {
          setRole(row.role);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setFetching(false);
      }
    }
    void load();
  }, [id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "").trim();
    const body: Record<string, unknown> = {
      email: formData.get("email"),
      name: formData.get("name") || null,
      role,
      active: formData.get("active") === "on",
      passwordNeedsReset: formData.get("passwordNeedsReset") === "on",
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

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/users" className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit admin user</h2>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Email *</label>
          <input name="email" type="email" required defaultValue={defaults.email} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Name</label>
          <input name="name" defaultValue={defaults.name ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">New password</label>
          <input
            name="password"
            type="password"
            minLength={8}
            className={inputClass}
            placeholder="Leave blank to keep current"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">Role *</label>
          <AdminRoleSelect
            value={role}
            onChange={(next) => {
              if (isAdminRole(next)) setRole(next);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            name="passwordNeedsReset"
            type="checkbox"
            defaultChecked={defaults.passwordNeedsReset}
            className="h-4 w-4 rounded"
          />
          Password needs reset (user must change password on next login)
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input name="active" type="checkbox" defaultChecked={defaults.active} className="h-4 w-4 rounded" />
          Active (user can sign in)
        </label>
        {defaults.mfaEnabled ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            MFA is enabled for this user. They manage it under Settings → Security.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </button>
      </form>
    </div>
  );
}
