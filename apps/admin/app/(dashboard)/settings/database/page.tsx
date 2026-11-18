"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert, appConfirm } from "@/lib/app-alert";
import { useIsDevelopmentAppEnv } from "@/lib/use-is-development-app-env";

type PreserveUser = { email: string; label: string };

type CloneJob = {
  id: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  options: {
    preserveDebugTickets: boolean;
    preserveUserEmails: string[];
    overwriteEmails: boolean;
  };
  logs: string[];
  error: string | null;
  startedBy: string | null;
};

type CloneOptions = {
  available: boolean;
  defaultPreserveUsers: PreserveUser[];
  currentJob: CloneJob | null;
};

export default function DatabaseCloneSettingsPage() {
  const isDev = useIsDevelopmentAppEnv();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [options, setOptions] = useState<CloneOptions | null>(null);
  const [preserveDebugTickets, setPreserveDebugTickets] = useState(true);
  const [overwriteEmails, setOverwriteEmails] = useState(true);
  const [preserveEmails, setPreserveEmails] = useState<string[]>([]);
  const [job, setJob] = useState<CloneJob | null>(null);

  const loadOptions = useCallback(async () => {
    const res = await adminFetch("/api/admin/dev-database/clone-options");
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Failed to load clone options");
    const data = body.data as CloneOptions;
    setOptions(data);
    setPreserveEmails(data.defaultPreserveUsers.map((u) => u.email));
    setJob(data.currentJob);
  }, []);

  useEffect(() => {
    if (!isDev) {
      setLoading(false);
      return;
    }
    void loadOptions()
      .catch((error) => appAlert(error instanceof Error ? error.message : "Failed to load clone options"))
      .finally(() => setLoading(false));
  }, [isDev, loadOptions]);

  useEffect(() => {
    if (!job || job.status !== "RUNNING") return;
    const timer = setInterval(() => {
      void adminFetch("/api/admin/dev-database/clone-status")
        .then(async (res) => {
          const body = await res.json();
          if (res.ok) setJob((body.data as CloneJob | null) ?? null);
        })
        .catch(() => undefined);
    }, 2000);
    return () => clearInterval(timer);
  }, [job]);

  function togglePreserveEmail(email: string) {
    setPreserveEmails((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));
  }

  async function startClone() {
    const ok = await appConfirm(
      "This replaces the development database with a copy of production. Development data that is not protected by the options below will be overwritten. Continue?",
      { title: "Clone production to development", confirmLabel: "Clone" },
    );
    if (!ok) return;
    setStarting(true);
    try {
      const res = await adminFetch("/api/admin/dev-database/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          preserveDebugTickets,
          preserveUserEmails: preserveEmails,
          overwriteEmails,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to start clone");
      setJob(body.data as CloneJob);
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to start clone");
    } finally {
      setStarting(false);
    }
  }

  if (!isDev) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Database clone is only available on the development app.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const running = job?.status === "RUNNING" || starting;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Database clone</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Copy production into this development database. This page is hidden on production.
        </p>
      </div>

      {!options?.available ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Clone is not configured yet. Ask an admin to set production and development database URLs on the development API.
        </p>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Clone options</h3>
        <div className="mt-4 space-y-4 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={preserveDebugTickets}
              onChange={(e) => setPreserveDebugTickets(e.target.checked)}
              disabled={running}
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Exclude Debug portal tickets from clone</span>
              <span className="mt-0.5 block text-gray-500">
                Keep the current development debug tickets instead of overwriting them with production.
              </span>
            </span>
          </label>

          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Exclude below users&apos; contact details from overwrite
            </p>
            <p className="mt-0.5 text-gray-500">Ticked users keep their real email and phone on development.</p>
            <div className="mt-2 space-y-2">
              {(options?.defaultPreserveUsers ?? []).map((user) => (
                <label key={user.email} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preserveEmails.includes(user.email)}
                    onChange={() => togglePreserveEmail(user.email)}
                    disabled={running || !overwriteEmails}
                  />
                  <span>
                    {user.label} <span className="text-gray-400">({user.email})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={overwriteEmails}
              onChange={(e) => setOverwriteEmails(e.target.checked)}
              disabled={running}
            />
            <span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Overwrite customer and internal user email addresses
              </span>
              <span className="mt-0.5 block text-gray-500">
                Replace production contact details with anonymous test values, except for the users ticked above.
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void startClone()}
          disabled={running || !options?.available}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {running ? "Cloning…" : "Clone"}
        </button>
      </section>

      {job ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Latest clone</h3>
          <p className="mt-1 text-sm text-gray-500">
            Status: <span className="font-medium text-gray-900 dark:text-gray-100">{job.status}</span>
            {job.startedBy ? ` · started by ${job.startedBy}` : ""}
          </p>
          {job.error ? <p className="mt-2 text-sm text-red-600">{job.error}</p> : null}
          <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-950 dark:text-gray-300">
            {(job.logs.length ? job.logs : ["Waiting for output…"]).join("\n")}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
