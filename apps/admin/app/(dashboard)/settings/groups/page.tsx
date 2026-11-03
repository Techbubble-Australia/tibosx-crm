"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800";

type ClientRow = { id: string; name: string };
type UserRow = { id: string; email: string; name: string | null };
type GroupRow = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  members: { adminUserId: string; email: string; name: string | null }[];
};

export default function WorkspaceGroupsPage() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function load() {
    void Promise.all([
      adminFetch("/api/admin/workspace-groups").then((r) => r.json()),
      adminFetch("/api/admin/clients").then((r) => r.json()),
      adminFetch("/api/admin/users").then((r) => r.json()),
    ])
      .then(([groupsRes, clientsRes, usersRes]) => {
        setGroups((groupsRes.data as GroupRow[]) ?? []);
        setClients((clientsRes.data as ClientRow[]) ?? []);
        setUsers((usersRes.data as UserRow[]) ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientId) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/workspace-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), clientId, memberUserIds: memberIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to create group");
      setName("");
      setClientId("");
      setMemberIds([]);
      load();
    } catch (err) {
      appAlert(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!(await appConfirm("Delete this group?"))) return;
    const res = await adminFetch(`/api/admin/workspace-groups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      appAlert((data as { error?: string }).error || "Failed to delete");
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Groups</h2>
        <p className="text-sm text-gray-500">
          Map a client to a support group and add TBOS users who should receive notifications for that account.
        </p>
      </div>

      <form onSubmit={(e) => void createGroup(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">New group</h3>
        <div>
          <label className="mb-1 block text-sm font-medium">Group name <span className="text-red-500">*</span></label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Encore" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Client <span className="text-red-500">*</span></label>
          <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Members</label>
          <select
            multiple
            className={`${inputClass} min-h-[120px]`}
            value={memberIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              setMemberIds(selected);
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Hold Cmd/Ctrl to select multiple consultants.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          <Plus className="h-4 w-4" /> {saving ? "Saving…" : "Add group"}
        </button>
      </form>

      <ul className="divide-y rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-700 dark:bg-gray-900">
        {groups.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-gray-500">No groups yet.</li>
        ) : (
          groups.map((group) => (
            <li key={group.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{group.name}</p>
                <p className="text-sm text-gray-500">Client: {group.clientName}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {group.members.length
                    ? group.members.map((m) => m.name || m.email).join(", ")
                    : "No members"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void deleteGroup(group.id)}
                className="rounded-lg border border-gray-200 p-2 text-red-600 dark:border-gray-600"
                aria-label="Delete group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
