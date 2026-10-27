"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert, appConfirm } from "@/lib/app-alert";
import { messageFromApiError } from "@/lib/api-error";

type CustomerUserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
  mfaEnabled: boolean;
};

export function CustomerUsersListPage({ activeOnly }: { activeOnly: boolean }) {
  const [rows, setRows] = useState<CustomerUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const res = await adminFetch("/api/admin/customer-users");
    const data = await res.json();
    setRows((data.data as CustomerUserRow[]) ?? []);
  }

  useEffect(() => {
    void reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((row) => (activeOnly ? row.active : !row.active)),
    [rows, activeOnly],
  );

  async function deactivate(row: CustomerUserRow) {
    if (!(await appConfirm(`Deactivate ${row.name || row.email}? They will not be able to sign in.`))) return;
    setBusyId(row.id);
    try {
      const res = await adminFetch(`/api/admin/customer-users/${row.id}/deactivate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to deactivate"));
      await reload();
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Failed to deactivate");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(row: CustomerUserRow) {
    if (!(await appConfirm(`Delete ${row.name || row.email}? This cannot be undone.`))) return;
    setBusyId(row.id);
    try {
      const res = await adminFetch(`/api/admin/customer-users/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to delete"));
      await reload();
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {activeOnly ? "Active customer users" : "Inactive customer users"}
        </h2>
        <p className="text-sm text-gray-500">
          Client portal accounts linked to CRM contacts. Create them from a client contact record.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">MFA</th>
              {activeOnly ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={activeOnly ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                  No customer users found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/customer-users/${row.id}`} className="hover:text-blue-600 hover:underline">
                      {row.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.mfaEnabled
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {row.mfaEnabled ? "Enabled" : "Off"}
                    </span>
                  </td>
                  {activeOnly ? (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void deactivate(row)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void deleteUser(row)}
                          className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-red-950/30"
                          aria-label={`Delete ${row.name || row.email}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
