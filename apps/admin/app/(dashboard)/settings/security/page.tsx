"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type MfaStatus = {
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
};

export default function SecuritySettingsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <SecuritySettingsPage />
    </Suspense>
  );
}

function SecuritySettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("mfa") === "required") {
      router.replace("/mfa-setup");
      return;
    }
    if (searchParams.get("reset") === "required") {
      router.replace("/change-password");
    }
  }, [searchParams, router]);

  async function loadStatus() {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/auth/mfa/status");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load MFA status");
      }
      setStatus({
        mfaEnabled: Boolean(data?.data?.mfaEnabled),
        mfaEnrolledAt: data?.data?.mfaEnrolledAt ?? null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load MFA status");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await adminFetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: disablePassword,
          code: disableCode.replace(/\s/g, ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to disable MFA");
      }
      setDisablePassword("");
      setDisableCode("");
      setMessage("Two-factor authentication has been disabled. You will be prompted to set it up again when you sign in.");
      await loadStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to disable MFA");
    } finally {
      setIsSubmitting(false);
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
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Two-factor authentication is required for all TIBOSX.AI users. You can disable MFA temporarily, but you must
          set it up again to access the app after signing in.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
          {message}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Two-factor authentication (MFA)</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {status?.mfaEnabled
                ? `Enabled${status.mfaEnrolledAt ? ` since ${new Date(status.mfaEnrolledAt).toLocaleString()}` : ""}.`
                : "MFA is not enabled on this account."}
            </p>
          </div>
          {status?.mfaEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : null}
        </div>

        {status?.mfaEnabled ? (
          <form onSubmit={disableMfa} className="mt-6 max-w-md space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To disable MFA, confirm your password and enter a current authenticator code.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="mfa-disable-password">
                Password
              </label>
              <input
                id="mfa-disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="mfa-disable-code">
                Authenticator code
              </label>
              <input
                id="mfa-disable-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/[^\d\s]/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9\s]{6,8}"
                maxLength={8}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              Disable MFA
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Sign out and sign in again to complete MFA setup.</p>
        )}
      </div>
    </div>
  );
}
