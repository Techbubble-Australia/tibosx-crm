"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export type SupportClientContactRow = {
  contactId: string;
  portalAccess: boolean;
  canApproveTimesheets: boolean;
};

type AvailableContact = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  userRecord: { id: string; email: string } | null;
};

type Props = {
  projectId: string | undefined;
  clientId: string;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  rows: SupportClientContactRow[];
  onRowsChange: (rows: SupportClientContactRow[]) => void;
};

export function ProjectCustomerSupportSettings({
  projectId,
  clientId,
  enabled,
  onEnabledChange,
  rows,
  onRowsChange,
}: Props) {
  const [available, setAvailable] = useState<AvailableContact[]>([]);

  useEffect(() => {
    if (!projectId || !clientId) {
      setAvailable([]);
      return;
    }
    void adminFetch(`/api/admin/projects/${projectId}/support/available-contacts`)
      .then((r) => r.json())
      .then((data) => setAvailable((data.data as AvailableContact[]) ?? []))
      .catch(() => setAvailable([]));
  }, [projectId, clientId]);

  function toggleAccess(contactId: string) {
    const hit = rows.find((r) => r.contactId === contactId);
    if (hit) {
      onRowsChange(rows.filter((r) => r.contactId !== contactId));
      return;
    }
    onRowsChange([...rows, { contactId, portalAccess: true, canApproveTimesheets: false }]);
  }

  function patchRow(contactId: string, patch: Partial<SupportClientContactRow>) {
    onRowsChange(rows.map((r) => (r.contactId === contactId ? { ...r, ...patch } : r)));
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Project settings</h3>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-gray-900 dark:text-gray-100">This project is for Customer Support</span>
          <span className="mt-1 block text-gray-500">
            Enables client portal access, timesheet approvals, and support tickets for this project.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Client access</h4>
          {!projectId ? (
            <p className="text-sm text-gray-500">Save the project first to configure client access.</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-gray-500">No contacts on this client — add them under Sales → Clients.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
                    <th className="py-2 pr-3">Access</th>
                    <th className="py-2 pr-3">Contact</th>
                    <th className="py-2 pr-3">User record</th>
                    <th className="py-2">Timesheet approver</th>
                  </tr>
                </thead>
                <tbody>
                  {available.map((c) => {
                    const row = rows.find((r) => r.contactId === c.id);
                    const selected = Boolean(row);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2 pr-3">
                          <input type="checkbox" checked={selected} onChange={() => toggleAccess(c.id)} />
                        </td>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </td>
                        <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">
                          {c.userRecord ? (
                            <span>{c.userRecord.email}</span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400">None — ask admin to create</span>
                          )}
                        </td>
                        <td className="py-2">
                          {selected ? (
                            <input
                              type="checkbox"
                              checked={row?.canApproveTimesheets ?? false}
                              onChange={(e) =>
                                patchRow(c.id, { canApproveTimesheets: e.target.checked })
                              }
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
