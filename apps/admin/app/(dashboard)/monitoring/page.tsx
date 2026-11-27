"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
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

type UserMonitorSummary = {
  userId: string;
  name: string | null;
  email: string;
  totalOnlineMinutes: number;
  sessionCount: number;
  openSessionCount: number;
  screenshotCount: number;
  deviceCount: number;
  activeDeviceCount: number;
  lastSeenAt: string | null;
  devices: string[];
  sessions: SessionRow[];
  screenshots: ScreenshotRow[];
  deviceRows: DeviceRow[];
};

type DateScreenshotGroup = {
  dateKey: string;
  label: string;
  screenshots: ScreenshotRow[];
};

type DetailTab = "screenshots" | "sessions" | "devices";

function fmt(dt: string | null | undefined) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function formatOnlineHours(minutes: number) {
  const hours = minutes / 60;
  if (minutes <= 0) return "0h";
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function dateKeyLocal(dt: string) {
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateKey: string) {
  if (dateKey === "unknown") return "Unknown date";
  const parts = dateKey.split("-").map((p) => Number(p));
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function groupScreenshotsByDate(shots: ScreenshotRow[]): DateScreenshotGroup[] {
  const map = new Map<string, ScreenshotRow[]>();
  for (const shot of shots) {
    const key = dateKeyLocal(shot.capturedAt);
    const list = map.get(key) || [];
    list.push(shot);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, screenshots]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      screenshots: screenshots.sort(
        (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
      ),
    }));
}

function buildUserSummaries(
  sessions: SessionRow[],
  screenshots: ScreenshotRow[],
  devices: DeviceRow[],
): UserMonitorSummary[] {
  const map = new Map<string, UserMonitorSummary>();

  function ensure(user: { id: string; email: string; name: string | null }) {
    let row = map.get(user.id);
    if (!row) {
      row = {
        userId: user.id,
        name: user.name,
        email: user.email,
        totalOnlineMinutes: 0,
        sessionCount: 0,
        openSessionCount: 0,
        screenshotCount: 0,
        deviceCount: 0,
        activeDeviceCount: 0,
        lastSeenAt: null,
        devices: [],
        sessions: [],
        screenshots: [],
        deviceRows: [],
      };
      map.set(user.id, row);
    } else if (!row.name && user.name) {
      row.name = user.name;
    }
    return row;
  }

  function touchLastSeen(row: UserMonitorSummary, dt: string | null | undefined) {
    if (!dt) return;
    if (!row.lastSeenAt || new Date(dt) > new Date(row.lastSeenAt)) {
      row.lastSeenAt = dt;
    }
  }

  function addDeviceLabel(row: UserMonitorSummary, label: string) {
    if (label && !row.devices.includes(label)) row.devices.push(label);
  }

  for (const s of sessions) {
    const row = ensure(s.adminUser);
    row.sessions.push(s);
    row.sessionCount += 1;
    row.totalOnlineMinutes += s.onlineMinutes || 0;
    if (!s.endedAt) row.openSessionCount += 1;
    addDeviceLabel(row, s.device.deviceName || s.device.id.slice(0, 8));
    touchLastSeen(row, s.lastHeartbeatAt || s.startedAt);
  }

  for (const shot of screenshots) {
    const row = ensure(shot.adminUser);
    row.screenshots.push(shot);
    row.screenshotCount += 1;
    addDeviceLabel(row, shot.device.deviceName || shot.device.id.slice(0, 8));
    touchLastSeen(row, shot.capturedAt);
  }

  for (const d of devices) {
    const row = ensure(d.adminUser);
    row.deviceRows.push(d);
    row.deviceCount += 1;
    if (!d.revokedAt) row.activeDeviceCount += 1;
    addDeviceLabel(row, d.deviceName || d.id.slice(0, 8));
    touchLastSeen(row, d.lastSeenAt);
  }

  for (const row of map.values()) {
    row.sessions.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    row.screenshots.sort(
      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
    );
    row.deviceRows.sort((a, b) => {
      const aT = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const bT = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return bT - aT;
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const aT = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const bT = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return bT - aT;
  });
}

export default function MonitoringReviewPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("screenshots");

  const users = useMemo(
    () => buildUserSummaries(sessions, screenshots, devices),
    [sessions, screenshots, devices],
  );
  const selectedUser = useMemo(
    () => users.find((u) => u.userId === selectedUserId) || null,
    [users, selectedUserId],
  );
  const selectedScreenshotsByDate = useMemo(
    () => (selectedUser ? groupScreenshotsByDate(selectedUser.screenshots) : []),
    [selectedUser],
  );

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
            Employee monitoring summary — open a user for screenshots, sessions, and devices.
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

      {!selectedUser ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Hours online</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Screenshots</th>
                <th className="px-4 py-3">Devices</th>
                <th className="px-4 py-3">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No monitored users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.userId}
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
                    onClick={() => {
                      setSelectedUserId(u.userId);
                      setDetailTab("screenshots");
                    }}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                      {u.devices.length > 0 ? (
                        <div className="mt-0.5 max-w-[260px] truncate text-xs text-gray-400" title={u.devices.join(", ")}>
                          {u.devices.join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatOnlineHours(u.totalOnlineMinutes)}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">
                        ({u.totalOnlineMinutes}m)
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {u.sessionCount}
                      {u.openSessionCount > 0 ? (
                        <span className="ml-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          · {u.openSessionCount} open
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{u.screenshotCount}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {u.deviceCount}
                      {u.activeDeviceCount > 0 ? (
                        <span className="ml-1.5 text-xs text-gray-400">
                          · {u.activeDeviceCount} active
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{fmt(u.lastSeenAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                ← All users
              </button>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedUser.name || selectedUser.email}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedUser.email} · {formatOnlineHours(selectedUser.totalOnlineMinutes)} online ·{" "}
                  {selectedUser.sessionCount} sessions · {selectedUser.screenshotCount} shots ·{" "}
                  {selectedUser.deviceCount} devices
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {(
              [
                ["screenshots", `Screenshots (${selectedUser.screenshotCount})`],
                ["sessions", `Sessions (${selectedUser.sessionCount})`],
                ["devices", `Devices (${selectedUser.deviceCount})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDetailTab(id)}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${
                  detailTab === id
                    ? "border-black text-gray-900 dark:border-white dark:text-gray-100"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {detailTab === "screenshots" ? (
            selectedScreenshotsByDate.length === 0 ? (
              <p className="text-sm text-gray-500">No screenshots for this user.</p>
            ) : (
              <div className="space-y-5">
                {selectedScreenshotsByDate.map((day) => (
                  <section key={day.dateKey} className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {day.label}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        {day.screenshots.length} shot{day.screenshots.length === 1 ? "" : "s"}
                      </span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {day.screenshots.map((shot) => {
                        const src = resolveAdminMediaPreviewUrl(shot.imageUrl) || shot.imageUrl;
                        return (
                          <button
                            key={shot.id}
                            type="button"
                            onClick={() => setPreviewUrl(src)}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-900"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="aspect-video w-full bg-gray-100 object-cover" />
                            <div className="space-y-0.5 p-3 text-xs text-gray-600 dark:text-gray-300">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(shot.capturedAt).toLocaleTimeString()}
                              </div>
                              <div className="text-gray-400">
                                {shot.device.platform} · {shot.device.deviceName || shot.device.id.slice(0, 8)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : null}

          {detailTab === "sessions" ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
                  <tr>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Last seen</th>
                    <th className="px-4 py-3">Ended</th>
                    <th className="px-4 py-3">Online</th>
                    <th className="px-4 py-3">Shots</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No sessions for this user.
                      </td>
                    </tr>
                  ) : (
                    selectedUser.sessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-3">
                          <div>{s.device.deviceName || s.device.id.slice(0, 8)}</div>
                          <div className="text-xs text-gray-500">{s.device.platform}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{fmt(s.startedAt)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{fmt(s.lastHeartbeatAt)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {s.endedAt ? fmt(s.endedAt) : "Open"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatOnlineHours(s.onlineMinutes)}
                          <span className="ml-1 text-xs text-gray-400">({s.onlineMinutes}m)</span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{s.screenshotCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {detailTab === "devices" ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
                  <tr>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Last seen</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Counts</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.deviceRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No devices for this user.
                      </td>
                    </tr>
                  ) : (
                    selectedUser.deviceRows.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-3">{d.deviceName || d.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">{d.platform}</td>
                        <td className="whitespace-nowrap px-4 py-3">{fmt(d.lastSeenAt)}</td>
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
        </div>
      )}

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
