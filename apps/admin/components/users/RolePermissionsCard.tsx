"use client";

import { ADMIN_ROLES, ROLE_META, ROLE_PERMISSIONS } from "@/lib/admin-roles";

export function RolePermissionsCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Role permissions</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Assign the least privilege needed. API routes enforce these rules server-side.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300">Permission</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role} className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300">
                  {ROLE_META[role].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {ROLE_PERMISSIONS.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{row.label}</td>
                {ADMIN_ROLES.map((role) => (
                  <td key={role} className="px-4 py-2 text-center">
                    {row[role] ? (
                      <span className="text-green-600 dark:text-green-400" aria-label="Allowed">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600" aria-label="Denied">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 border-t border-gray-200 px-4 py-4 sm:grid-cols-3 dark:border-gray-700">
        {ADMIN_ROLES.map((role) => (
          <div key={role} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {ROLE_META[role].label}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{ROLE_META[role].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
