"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type UserOption = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

type Props = {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
};

export function AddProjectMemberModal({ projectId, onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    void adminFetch(`/api/admin/projects/${projectId}/member-user-options${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers((data.data as UserOption[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [projectId, query]);

  const filtered = useMemo(() => users, [users]);

  useEffect(() => {
    setSelectedId("");
    setQuery("");
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to add member");
      onAdded();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add member</h3>
        <p className="mt-1 text-sm text-gray-500">
          Search TBOS users (client portal users are excluded). A recruitment profile is created automatically when needed.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="search"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500">No matching users found.</p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2 dark:border-gray-800">
              {filtered.map((row) => (
                <li key={row.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="radio"
                      name="memberUser"
                      value={row.id}
                      checked={selectedId === row.id}
                      onChange={() => setSelectedId(row.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{row.name}</span>
                      <span className="block text-xs text-gray-500">{row.email}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !selectedId}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? "Adding…" : "Add member"}
          </button>
        </div>
      </form>
    </div>
  );
}
