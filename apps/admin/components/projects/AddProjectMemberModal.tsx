"use client";

import { useEffect, useState } from "react";
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

export function AddProjectMemberModal({ projectId, onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractProfiles, setContractProfiles] = useState<ProfileOption[]>([]);
  const [databaseProfiles, setDatabaseProfiles] = useState<ProfileOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [source, setSource] = useState<"contract" | "database">("contract");

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
          setSelectedId(contract[0]!.profileId);
        } else if (database.length) {
          setSource("database");
          setSelectedId(database[0]!.profileId);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const options = source === "contract" ? contractProfiles : databaseProfiles;

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
        <p className="mt-1 text-sm text-gray-500">Choose someone from the linked contract or the profile database.</p>

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
                  setSelectedId(contractProfiles[0]?.profileId ?? "");
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
                  setSelectedId(databaseProfiles[0]?.profileId ?? "");
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
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                {options.map((row) => (
                  <option key={row.profileId} value={row.profileId}>
                    {row.firstName} {row.lastName} — {row.email}
                  </option>
                ))}
              </select>
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
