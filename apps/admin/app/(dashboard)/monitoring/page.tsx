"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveAdminMediaPreviewUrl } from "@/lib/public-media-url";

type SessionRow = {
  id: string;
  startedAt: string;
  lastHeartbeatAt: string;
  endedAt: string | null;
  onlineMinutes: number;
  screenshotCount: number;
  adminUser: { id: string; email: string; name: string | null };
  device: {
    id: string;
    deviceName: string;
    platform: string;
    lastSeenAt: string | null;
    revokedAt: string | null;
  };
};

type ScreenshotRow = {
  id: string;
  imageUrl: string;
  capturedAt: string;
  width: number | null;
  height: number | null;
  adminUser: { id: string; email: string; name: string | null };
  device: { id: string; deviceName: string; platform: string };
  session: { id: string };
};

type DeviceRow = {
  id: string;
  deviceName: string;
  platform: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  adminUser: { id: string; email: string; name: string | null };
  _count: { sessions: number; screenshots: number };
};

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function MonitoringReviewPage() {
  const [tab, setTab] = useState<"sessions" | "screenshots" | "devices">("sessions");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [sRes, shRes, dRes] = await Promise.all([
        adminFetch("/api/admin/monitoring/sessions?limit=100"),
        adminFetch("/api/admin/monitoring/screenshots?limit=100"),
        adminFetch("/api/admin/monitoring/devices"),
      ]);
      const [sJson, shJson, dJson] = await Promise.all([sRes.json(), shRes.json(), dRes.json()]);
      if (!sRes.ok) throw new Error(sJson.error || "Failed to load sessions");
      if (!shRes.ok) throw new Error(shJson.error || "Failed to load screenshots");
      if (!dRes.ok) throw new Error(dJson.error || "Failed to load devices");
      setSessions(sJson.data || []);
      setScreenshots(shJson.data || []);
      setDevices(dJson.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load monitoring data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revokeDevice(id: string) {
    if (!window.confirm("Revoke this device? It will stop uploading until re-enrolled.")) return;
    setBusyDeviceId(id);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/monitoring/devices/${id}/revoke`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to revoke device");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke device");
    } finally {
      setBusyDeviceId(null);
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Monitoring review</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Online sessions, screenshot captures, and enrolled devices from the desktop monitor agent.
          </p>
        </div>
        <Link
          href="/settings/monitoring"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Settings
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(
          [
            ["sessions", "Sessions"],
            ["screenshots", "Screenshots"],
            ["devices", "Devices"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === id
                ? "border-black text-gray-900 dark:border-white dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "sessions" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Ended</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3">Shots</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No sessions yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.adminUser.name || s.adminUser.email}</div>
                      <div className="text-xs text-gray-500">{s.adminUser.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{s.device.deviceName || s.device.id.slice(0, 8)}</div>
                      <div className="text-xs text-gray-500">{s.device.platform}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(s.startedAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(s.lastHeartbeatAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.endedAt ? fmt(s.endedAt) : "Open"}</td>
                    <td className="px-4 py-3">{s.onlineMinutes}m</td>
                    <td className="px-4 py-3">{s.screenshotCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "screenshots" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {screenshots.length === 0 ? (
            <p className="text-sm text-gray-500">No screenshots yet.</p>
          ) : (
            screenshots.map((shot) => {
              const src = resolveAdminMediaPreviewUrl(shot.imageUrl) || shot.imageUrl;
              return (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => setPreviewUrl(src)}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="aspect-video w-full object-cover bg-gray-100" />
                  <div className="space-y-0.5 p-3 text-xs text-gray-600 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {shot.adminUser.name || shot.adminUser.email}
                    </div>
                    <div>{fmt(shot.capturedAt)}</div>
                    <div className="text-gray-400">
                      {shot.device.platform} · {shot.device.deviceName || shot.device.id.slice(0, 8)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}

      {tab === "devices" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Counts</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No enrolled devices.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.adminUser.name || d.adminUser.email}</div>
                      <div className="text-xs text-gray-500">{d.adminUser.email}</div>
                    </td>
                    <td className="px-4 py-3">{d.deviceName || d.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{d.platform}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmt(d.lastSeenAt)}</td>
                    <td className="px-4 py-3">{d.revokedAt ? "Revoked" : "Active"}</td>
                    <td className="px-4 py-3">
                      {d._count.sessions} sessions · {d._count.screenshots} shots
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!d.revokedAt ? (
                        <button
                          type="button"
                          disabled={busyDeviceId === d.id}
                          onClick={() => void revokeDevice(d.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {busyDeviceId === d.id ? "Revoking…" : "Revoke"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
          role="presentation"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Screenshot preview"
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
