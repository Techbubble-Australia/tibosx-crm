"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type ProfileOption = {
  profileId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Props = {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
};

function profileLabel(row: ProfileOption) {
  return `${row.firstName} ${row.lastName}`.trim();
}

export function AddProjectMemberModal({ projectId, onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractProfiles, setContractProfiles] = useState<ProfileOption[]>([]);
  const [databaseProfiles, setDatabaseProfiles] = useState<ProfileOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [source, setSource] = useState<"contract" | "database">("contract");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void adminFetch(`/api/admin/projects/${projectId}/member-options`)
      .then((r) => r.json())
      .then((data) => {
        const payload = data.data as {
          contractProfiles?: ProfileOption[];
          databaseProfiles?: ProfileOption[];
        };
        const contract = payload.contractProfiles ?? [];
        const database = payload.databaseProfiles ?? [];
        setContractProfiles(contract);
        setDatabaseProfiles(database);
        if (contract.length) {
          setSource("contract");
        } else if (database.length) {
          setSource("database");
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const options = source === "contract" ? contractProfiles : databaseProfiles;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((row) => {
      const haystack = [profileLabel(row), row.email, row.phone].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId("");
      return;
    }
    if (!filtered.some((row) => row.profileId === selectedId)) {
      setSelectedId(filtered[0]!.profileId);
    }
  }, [filtered, selectedId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: selectedId }),
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
        <p className="mt-1 text-sm text-gray-500">Search by name or email, then add to this project.</p>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!contractProfiles.length}
                onClick={() => {
                  setSource("contract");
                  setQuery("");
                }}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  source === "contract" ? "bg-black text-white dark:bg-white dark:text-black" : "border border-gray-200"
                }`}
              >
                From contract ({contractProfiles.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource("database");
                  setQuery("");
                }}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  source === "database" ? "bg-black text-white dark:bg-white dark:text-black" : "border border-gray-200"
                }`}
              >
                Profile database ({databaseProfiles.length})
              </button>
            </div>
            {options.length === 0 ? (
              <p className="text-sm text-gray-500">No profiles available to add.</p>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search profile *
                  </label>
                  <input
                    type="search"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a name or email…"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
                  {filtered.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">No profiles match your search.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filtered.map((row) => {
                        const selected = row.profileId === selectedId;
                        return (
                          <li key={row.profileId}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(row.profileId)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                selected ? "bg-gray-100 dark:bg-gray-800" : ""
                              }`}
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {profileLabel(row)}
                              </span>
                              <span className="block text-xs text-gray-500">{row.email}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loading || !selectedId}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add member
          </button>
        </div>
      </form>
    </div>
  );
}
