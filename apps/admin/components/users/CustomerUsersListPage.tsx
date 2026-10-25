"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

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

  useEffect(() => {
    void adminFetch("/api/admin/customer-users")
      .then((res) => res.json())
      .then((data) => setRows((data.data as CustomerUserRow[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rows.filter((row) => (activeOnly ? row.active : !row.active)),
    [rows, activeOnly],
  );

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
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No customer users found.</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
