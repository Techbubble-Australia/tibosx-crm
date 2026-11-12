"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export type ClientAccessMode = "SUPPORT_AND_TIMESHEETS" | "TIMESHEETS_ONLY";

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
  mode: ClientAccessMode;
  onModeChange: (mode: ClientAccessMode) => void;
  rows: SupportClientContactRow[];
  onRowsChange: (rows: SupportClientContactRow[]) => void;
  ticketPrefix: string;
  onTicketPrefixChange: (value: string) => void;
  ticketNumberDigits: number;
  onTicketNumberDigitsChange: (value: number) => void;
  ticketSettingsLocked?: boolean;
};

export function ProjectCustomerSupportSettings({
  projectId,
  clientId,
  enabled,
  onEnabledChange,
  mode,
  onModeChange,
  rows,
  onRowsChange,
  ticketPrefix,
  onTicketPrefixChange,
  ticketNumberDigits,
  onTicketNumberDigitsChange,
  ticketSettingsLocked = false,
}: Props) {
  const [available, setAvailable] = useState<AvailableContact[]>([]);

  useEffect(() => {
    if (!clientId) {
      setAvailable([]);
      return;
    }
    const url = projectId
      ? `/api/admin/projects/${projectId}/support/available-contacts`
      : `/api/admin/clients/${clientId}/support-available-contacts`;
    void adminFetch(url)
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

  const timesheetsOnly = mode === "TIMESHEETS_ONLY";
  const choice = !enabled ? "NONE" : mode;

  function choose(next: "NONE" | ClientAccessMode) {
    if (next === "NONE") {
      onEnabledChange(false);
      return;
    }
    onEnabledChange(true);
    onModeChange(next);
    // Older timesheet-only setups stored approvers without Access; give them Access back.
    if (rows.some((r) => !r.portalAccess)) onRowsChange(rows.map((r) => ({ ...r, portalAccess: true })));
  }

  function patchRow(contactId: string, patch: Partial<SupportClientContactRow>) {
    onRowsChange(rows.map((r) => (r.contactId === contactId ? { ...r, ...patch } : r)));
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Project settings</h3>
      <fieldset className="space-y-3 text-sm">
        <legend className="sr-only">Client access</legend>
        {(
          [
            {
              value: "SUPPORT_AND_TIMESHEETS",
              label: "This project requires customer support and timesheet access for the client",
              hint: "Selected client contacts can raise and follow support tickets, and approvers can approve timesheets.",
            },
            {
              value: "TIMESHEETS_ONLY",
              label: "This project requires only timesheet access for the client",
              hint: "No support tickets. Contacts with Access see their projects and timesheets; timesheet approvers can also approve or reject them.",
            },
            {
              value: "NONE",
              label: "No client access",
              hint: "Clients don't sign in for this project.",
            },
          ] as const
        ).map((option) => (
          <label key={option.value} className="flex items-start gap-2">
            <input
              type="radio"
              name="client-access-mode"
              className="mt-1"
              checked={choice === option.value}
              onChange={() => choose(option.value)}
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
              <span className="mt-0.5 block text-gray-500">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {enabled ? (
        <div className="mt-6 space-y-6">
          {timesheetsOnly ? null : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Ticket prefix <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase dark:border-gray-600 dark:bg-gray-800"
                value={ticketPrefix}
                onChange={(e) => onTicketPrefixChange(e.target.value.toUpperCase())}
                required
                disabled={ticketSettingsLocked}
                maxLength={20}
                pattern="[A-Za-z0-9-]+"
                title="Letters, numbers, and hyphens only"
              />
              {ticketSettingsLocked ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Locked while this project has tickets. Delete all tickets to change prefix or digits.
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">
                No. of digits <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={ticketNumberDigits}
                onChange={(e) => onTicketNumberDigitsChange(Number.parseInt(e.target.value, 10) || 5)}
                required
                disabled={ticketSettingsLocked}
              />
              <p className="mt-1 text-xs text-gray-500">
                Example: {ticketPrefix.trim() || "TKT"}-{String(1).padStart(Math.min(Math.max(ticketNumberDigits, 1), 10), "0")}
              </p>
            </div>
          </div>
          )}
          <div>
          <h4 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Client access</h4>
          {!clientId ? (
            <p className="text-sm text-gray-500">Select a client to configure client access.</p>
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
        </div>
      ) : null}
    </section>
  );
}
