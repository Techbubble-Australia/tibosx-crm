"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
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

type UserSessionGroup = {
  userId: string;
  name: string | null;
  email: string;
  totalOnlineMinutes: number;
  totalScreenshots: number;
  sessionCount: number;
  openSessionCount: number;
  lastSeenAt: string | null;
  devices: string[];
  sessions: SessionRow[];
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

type UserScreenshotGroup = {
  userId: string;
  name: string | null;
  email: string;
  count: number;
  lastCapturedAt: string | null;
  devices: string[];
  screenshots: ScreenshotRow[];
};

type DateScreenshotGroup = {
  dateKey: string;
  label: string;
  screenshots: ScreenshotRow[];
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

/** Display online time primarily in hours (e.g. 1.5h, 0.1h). */
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
  const [y, m, day] = dateKey.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, day || 1);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function groupScreenshotsByUser(shots: ScreenshotRow[]): UserScreenshotGroup[] {
  const map = new Map<string, UserScreenshotGroup>();
  for (const shot of shots) {
    const userId = shot.adminUser.id;
    let group = map.get(userId);
    if (!group) {
      group = {
        userId,
        name: shot.adminUser.name,
        email: shot.adminUser.email,
        count: 0,
        lastCapturedAt: null,
        devices: [],
        screenshots: [],
      };
      map.set(userId, group);
    }
    group.screenshots.push(shot);
    group.count += 1;
    const deviceLabel = shot.device.deviceName || shot.device.id.slice(0, 8);
    if (!group.devices.includes(deviceLabel)) group.devices.push(deviceLabel);
    if (!group.lastCapturedAt || new Date(shot.capturedAt) > new Date(group.lastCapturedAt)) {
      group.lastCapturedAt = shot.capturedAt;
    }
  }
  for (const g of map.values()) {
    g.screenshots.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  }
  return Array.from(map.values()).sort((a, b) => {
    const aT = a.lastCapturedAt ? new Date(a.lastCapturedAt).getTime() : 0;
    const bT = b.lastCapturedAt ? new Date(b.lastCapturedAt).getTime() : 0;
    return bT - aT;
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

function groupSessionsByUser(sessions: SessionRow[]): UserSessionGroup[] {
  const map = new Map<string, UserSessionGroup>();
  for (const s of sessions) {
    const userId = s.adminUser.id;
    let group = map.get(userId);
    if (!group) {
      group = {
        userId,
        name: s.adminUser.name,
        email: s.adminUser.email,
        totalOnlineMinutes: 0,
        totalScreenshots: 0,
        sessionCount: 0,
        openSessionCount: 0,
        lastSeenAt: null,
        devices: [],
        sessions: [],
      };
      map.set(userId, group);
    }
    group.sessions.push(s);
    group.totalOnlineMinutes += s.onlineMinutes || 0;
    group.totalScreenshots += s.screenshotCount || 0;
    group.sessionCount += 1;
    if (!s.endedAt) group.openSessionCount += 1;
    const deviceLabel = s.device.deviceName || s.device.id.slice(0, 8);
    if (!group.devices.includes(deviceLabel)) group.devices.push(deviceLabel);
    const seen = s.lastHeartbeatAt || s.startedAt;
    if (!group.lastSeenAt || new Date(seen) > new Date(group.lastSeenAt)) {
      group.lastSeenAt = seen;
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const aT = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
    const bT = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
    return bT - aT;
  });
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
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(() => new Set());
  const [selectedScreenshotUserId, setSelectedScreenshotUserId] = useState<string | null>(null);

  const userGroups = useMemo(() => groupSessionsByUser(sessions), [sessions]);
  const screenshotUserGroups = useMemo(() => groupScreenshotsByUser(screenshots), [screenshots]);
  const selectedScreenshotUser = useMemo(
    () => screenshotUserGroups.find((g) => g.userId === selectedScreenshotUserId) || null,
    [screenshotUserGroups, selectedScreenshotUserId],
  );
  const selectedScreenshotsByDate = useMemo(
    () => (selectedScreenshotUser ? groupScreenshotsByDate(selectedScreenshotUser.screenshots) : []),
    [selectedScreenshotUser],
  );

  function toggleUser(userId: string) {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

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
            onClick={() => {
              setTab(id);
              if (id !== "screenshots") setSelectedScreenshotUserId(null);
            }}
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
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Devices</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Hours online</th>
                <th className="px-4 py-3">Shots</th>
              </tr>
            </thead>
            <tbody>
              {userGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No sessions yet.
                  </td>
                </tr>
              ) : (
                userGroups.map((g) => {
                  const open = expandedUserIds.has(g.userId);
                  return (
                    <Fragment key={g.userId}>
                      <tr
                        className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
                        onClick={() => toggleUser(g.userId)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {open ? (
                            <ChevronDown className="h-4 w-4" aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{g.name || g.email}</div>
                          <div className="text-xs text-gray-500">{g.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[220px] truncate" title={g.devices.join(", ")}>
                            {g.devices.join(", ") || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {g.sessionCount}
                          {g.openSessionCount > 0 ? (
                            <span className="ml-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              · {g.openSessionCount} open
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{fmt(g.lastSeenAt)}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {formatOnlineHours(g.totalOnlineMinutes)}
                          <span className="ml-1.5 text-xs font-normal text-gray-400">
                            ({g.totalOnlineMinutes}m)
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{g.totalScreenshots}</td>
                      </tr>
                      {open
                        ? g.sessions.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-gray-50 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/50"
                            >
                              <td className="px-4 py-2" />
                              <td className="px-4 py-2 text-xs text-gray-500">Session</td>
                              <td className="px-4 py-2 text-xs">
                                <div>{s.device.deviceName || s.device.id.slice(0, 8)}</div>
                                <div className="text-gray-400">{s.device.platform}</div>
                              </td>
                              <td className="px-4 py-2 text-xs whitespace-nowrap text-gray-600">
                                Started {fmt(s.startedAt)}
                              </td>
                              <td className="px-4 py-2 text-xs whitespace-nowrap text-gray-600">
                                {s.endedAt ? `Ended ${fmt(s.endedAt)}` : "Open"}
                              </td>
                              <td className="px-4 py-2 text-xs tabular-nums">
                                {formatOnlineHours(s.onlineMinutes)}
                                <span className="ml-1 text-gray-400">({s.onlineMinutes}m)</span>
                              </td>
                              <td className="px-4 py-2 text-xs tabular-nums">{s.screenshotCount}</td>
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "screenshots" ? (
        selectedScreenshotUser ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedScreenshotUserId(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                ← All users
              </button>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedScreenshotUser.name || selectedScreenshotUser.email}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedScreenshotUser.email} · {selectedScreenshotUser.count} screenshots
                </div>
              </div>
            </div>

            {selectedScreenshotsByDate.length === 0 ? (
              <p className="text-sm text-gray-500">No screenshots for this user.</p>
            ) : (
              selectedScreenshotsByDate.map((day) => (
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
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-950">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Devices</th>
                  <th className="px-4 py-3">Screenshots</th>
                  <th className="px-4 py-3">Latest</th>
                </tr>
              </thead>
              <tbody>
                {screenshotUserGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No screenshots yet.
                    </td>
                  </tr>
                ) : (
                  screenshotUserGroups.map((g) => (
                    <tr
                      key={g.userId}
                      className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
                      onClick={() => setSelectedScreenshotUserId(g.userId)}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{g.name || g.email}</div>
                        <div className="text-xs text-gray-500">{g.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[220px] truncate" title={g.devices.join(", ")}>
                          {g.devices.join(", ") || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{g.count}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(g.lastCapturedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )
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
