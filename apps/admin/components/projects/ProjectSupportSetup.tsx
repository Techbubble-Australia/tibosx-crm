"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { ProjectFormValues } from "./ProjectForm";

type AvailableContact = { id: string; name: string; email: string; position: string | null };

type ClientContactRow = {
  contactId: string;
  portalAccess: boolean;
  canApproveTimesheets: boolean;
};

type Props = {
  projectId: string;
  project: ProjectFormValues;
  onUpdated: () => void;
};

export function ProjectSupportSetup({ projectId, project, onUpdated }: Props) {
  const [available, setAvailable] = useState<AvailableContact[]>([]);
  const [contactRows, setContactRows] = useState<ClientContactRow[]>([]);
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [savingContacts, setSavingContacts] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

  const existingContacts = useMemo(
    () =>
      (project.clientContacts as Array<{
        contactId: string;
        portalAccess: boolean;
        canApproveTimesheets: boolean;
      }>) ?? [],
    [project.clientContacts],
  );

  const existingGroupIds = useMemo(
    () =>
      ((project.supportGroupMembers as Array<{ projectMemberId: string | null }>) ?? [])
        .map((m) => m.projectMemberId)
        .filter((id): id is string => Boolean(id)),
    [project.supportGroupMembers],
  );

  useEffect(() => {
    setContactRows(
      existingContacts.map((c) => ({
        contactId: c.contactId,
        portalAccess: c.portalAccess,
        canApproveTimesheets: c.canApproveTimesheets,
      })),
    );
    setGroupMemberIds(existingGroupIds);
  }, [existingContacts, existingGroupIds]);

  useEffect(() => {
    void adminFetch(`/api/admin/projects/${projectId}/support/available-contacts`)
      .then((r) => r.json())
      .then((data) => setAvailable((data.data as AvailableContact[]) ?? []));
  }, [projectId]);

  const toggleContact = useCallback((contactId: string) => {
    setContactRows((prev) => {
      const hit = prev.find((r) => r.contactId === contactId);
      if (hit) return prev.filter((r) => r.contactId !== contactId);
      return [...prev, { contactId, portalAccess: true, canApproveTimesheets: false }];
    });
  }, []);

  async function saveContacts() {
    setSavingContacts(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${projectId}/support/client-contacts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: contactRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
      onUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save client contacts");
    } finally {
      setSavingContacts(false);
    }
  }

  async function saveGroup() {
    setSavingGroup(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${projectId}/support/group-members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectMemberIds: groupMemberIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to save");
      onUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save support group");
    } finally {
      setSavingGroup(false);
    }
  }

  if (project.kind !== "SUPPORT") return null;

  return (
    <div className="mb-6 space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Client contacts (portal)</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select client contacts for this project. Portal access creates client logins on the{" "}
          <strong>client support portal</strong> (not TBOS). Approvers review timesheets there under Timesheet approvals.
        </p>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">No contacts on this client — add them under Sales → Clients.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {available.map((c) => {
              const row = contactRows.find((r) => r.contactId === c.id);
              const selected = Boolean(row);
              return (
                <li key={c.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input type="checkbox" checked={selected} onChange={() => toggleContact(c.id)} className="mt-1" />
                    <span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                      <span className="block text-xs text-gray-500">{c.email}</span>
                    </span>
                  </label>
                  {selected ? (
                    <div className="mt-2 flex flex-wrap gap-4 pl-6 text-xs">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={row?.portalAccess ?? true}
                          onChange={(e) =>
                            setContactRows((prev) =>
                              prev.map((r) =>
                                r.contactId === c.id ? { ...r, portalAccess: e.target.checked } : r,
                              ),
                            )
                          }
                        />
                        Portal access
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={row?.canApproveTimesheets ?? false}
                          onChange={(e) =>
                            setContactRows((prev) =>
                              prev.map((r) =>
                                r.contactId === c.id ? { ...r, canApproveTimesheets: e.target.checked } : r,
                              ),
                            )
                          }
                        />
                        Timesheet approver
                      </label>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => void saveContacts()}
          disabled={savingContacts}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          {savingContacts ? "Saving…" : "Save client contacts"}
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support group</h3>
        <p className="mt-1 text-sm text-gray-500">
          Project members in this group receive new cases (round-robin) and should have credentials generated for portal consultant access.
        </p>
        {project.members.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">Add project members from the contract or members section first.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {project.members.map((m) => {
              const label = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || m.id;
              const checked = groupMemberIds.includes(m.id);
              return (
                <li key={m.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setGroupMemberIds((prev) =>
                          checked ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                        )
                      }
                    />
                    <span>{label}</span>
                    {m.hasCredentials ? (
                      <span className="text-xs text-green-600">TBOS credentials</span>
                    ) : (
                      <span className="text-xs text-amber-600">Generate credentials</span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => void saveGroup()}
          disabled={savingGroup}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          {savingGroup ? "Saving…" : "Save support group"}
        </button>
      </section>
    </div>
  );
}
