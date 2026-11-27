"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type MonitoringSettings = {
  id: string;
  enabled: boolean;
  captureIntervalSeconds: number;
  updatedAt?: string;
};

export default function MonitoringSettingsPage() {
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/monitoring/settings");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to load settings");
      }
      const data = json.data as MonitoringSettings;
      setSettings(data);
      setEnabled(Boolean(data.enabled));
      setIntervalMinutes(Math.max(1, Math.round((data.captureIntervalSeconds || 300) / 60)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const captureIntervalSeconds = Math.round(intervalMinutes * 60);
      const res = await adminFetch("/api/admin/monitoring/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, captureIntervalSeconds }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to save settings");
      }
      setSettings(json.data);
      setMessage("Monitoring settings saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employee monitoring</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controls the desktop monitor agent. Capture interval is pushed to enrolled devices. Each employee email
            may be linked to only one active device; linking a new device warns and can replace the old one. Revoke
            devices from the review page when needed.
          </p>
        </div>
        <Link
          href="/monitoring"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Open review
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <label className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-100">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Enable screenshot monitoring
        </label>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Capture interval (minutes)
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value) || 1)}
            className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
          />
          <p className="mt-1 text-xs text-gray-500">
            Allowed range: 1–60 minutes ({settings?.captureIntervalSeconds ?? 300}s currently stored).
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
