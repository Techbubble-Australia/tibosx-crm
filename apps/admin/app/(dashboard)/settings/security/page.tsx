"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type MfaStatus = {
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
};

type SetupPayload = {
  otpauthUrl: string;
  secret: string;
};

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!setup?.otpauthUrl) {
      setQrDataUrl("");
      return;
    }
    void QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [setup]);

  async function startSetup() {
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await adminFetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to start MFA setup");
      }
      setSetup({
        otpauthUrl: data.data.otpauthUrl,
        secret: data.data.secret,
      });
      setConfirmCode("");
      setMessage("Scan the QR code with your authenticator app, then enter a code to confirm.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start MFA setup");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const res = await adminFetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: confirmCode.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to enable MFA");
      }
      setSetup(null);
      setConfirmCode("");
      setMessage("Two-factor authentication is now enabled.");
      await loadStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enable MFA");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      setSetup(null);
      setMessage("Two-factor authentication has been disabled.");
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
          Protect your admin account with a time-based one-time password (TOTP) from an authenticator app.
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
                : "Not enabled. We recommend enabling MFA for all admin users."}
            </p>
          </div>
          {status?.mfaEnabled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <ShieldOff className="h-3.5 w-3.5" />
              Disabled
            </span>
          )}
        </div>

        {!status?.mfaEnabled ? (
          <div className="mt-6 space-y-6">
            {!setup ? (
              <button
                type="button"
                onClick={() => void startSetup()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Enable MFA
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start gap-6">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="MFA QR code"
                      className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-600"
                    />
                  ) : null}
                  <div className="min-w-0 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p>Scan this QR code with Google Authenticator, 1Password, or another TOTP app.</p>
                    <p>
                      Manual entry key:{" "}
                      <code className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{setup.secret}</code>
                    </p>
                  </div>
                </div>

                <form onSubmit={confirmSetup} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Verification code
                    </label>
                    <input
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9\s]{6,8}"
                      maxLength={8}
                      required
                      className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
                      placeholder="123456"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    Confirm and enable
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={disableMfa} className="mt-6 space-y-4 max-w-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To disable MFA, confirm your password and enter a current authenticator code.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Authenticator code
              </label>
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
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
        )}
      </div>
    </div>
  );
}
