"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type NotificationRow = {
  id: string;
  description: string;
  implemented: boolean;
};

type RoleColumn = { id: string; label: string };

type PreferencesPayload = {
  notifications: NotificationRow[];
  roles: RoleColumn[];
  matrix: Record<string, Record<string, boolean>>;
};

function cellEnabled(matrix: Record<string, Record<string, boolean>>, notificationId: string, role: string): boolean {
  const row = matrix[notificationId];
  if (!row || row[role] === undefined) return true;
  return row[role];
}

export default function EmailNotificationsSettingsPage() {
  const [data, setData] = useState<PreferencesPayload | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/notifications/preferences");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      const payload = json.data as PreferencesPayload;
      setData(payload);
      setMatrix(payload.matrix ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(notificationId: string, role: string, enabled: boolean) {
    setMatrix((prev) => ({
      ...prev,
      [notificationId]: {
        ...(prev[notificationId] ?? {}),
        [role]: enabled,
      },
    }));
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updates: Array<{ notificationId: string; role: string; enabled: boolean }> = [];
      for (const notification of data.notifications) {
        for (const role of data.roles) {
          updates.push({
            notificationId: notification.id,
            role: role.id,
            enabled: cellEnabled(matrix, notification.id, role.id),
          });
        }
      }
      const res = await adminFetch("/api/admin/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setMessage("Preferences saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-red-600">{error || "Unable to load notifications."}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Email notifications</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Choose which roles receive each transactional email. Unchecked cells disable that notification for users with
          that role.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-green-700 dark:text-green-400">{message}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/60">
              <th className="sticky left-0 z-10 min-w-[220px] bg-gray-50 px-4 py-3 text-left font-medium text-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                Notification
              </th>
              {data.roles.map((role) => (
                <th
                  key={role.id}
                  className="min-w-[100px] px-3 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.notifications.map((notification) => (
              <tr key={notification.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-gray-900">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{notification.id}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                </td>
                {data.roles.map((role) => {
                  const checked = cellEnabled(matrix, notification.id, role.id);
                  return (
                    <td key={role.id} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={checked}
                        aria-label={`${notification.id} for ${role.label}`}
                        onChange={(e) => toggle(notification.id, role.id, e.target.checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}
