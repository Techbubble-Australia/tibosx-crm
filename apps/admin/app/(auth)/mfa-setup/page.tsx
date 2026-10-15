"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Loader2, ShieldCheck } from "lucide-react";
import { AuthPageShell } from "@/components/AuthPageShell";
import { defaultLandingPath } from "@/lib/admin-roles";
import { adminFetch } from "@/lib/admin-api";

type SetupPayload = {
  otpauthUrl: string;
  secret: string;
};

export default function MfaSetupPage() {
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      let navigatingAway = false;
      try {
        const meRes = await adminFetch("/api/auth/me");
        const meData = await meRes.json();
        const role =
          typeof meData?.data?.user?.role === "string" ? meData.data.user.role : "website";

        const requiresMfaEnrollment = Boolean(meData?.data?.user?.requiresMfaEnrollment);

        if (meRes.ok && meData?.data?.user?.mfaEnabled && !requiresMfaEnrollment) {
          const resumeRes = await fetch("/api/auth/mfa/resume-session", {
            method: "POST",
            credentials: "include",
          });
          if (resumeRes.ok) {
            navigatingAway = true;
            window.location.assign(defaultLandingPath(role));
            return;
          }
        }

        if (meRes.ok && requiresMfaEnrollment && meData?.data?.user?.mfaEnabled) {
          const restartRes = await adminFetch("/api/auth/mfa/restart-enrollment", { method: "POST" });
          if (!restartRes.ok) {
            const restartErr = await restartRes.json().catch(() => ({}));
            throw new Error(
              typeof (restartErr as { error?: string }).error === "string"
                ? (restartErr as { error: string }).error
                : "Could not start MFA setup. Sign out and sign in again.",
            );
          }
        }

        const res = await adminFetch("/api/auth/mfa/setup", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Failed to start MFA setup");
        }
        const otpauthUrl = data?.data?.otpauthUrl;
        const secret = data?.data?.secret;
        if (typeof otpauthUrl !== "string" || typeof secret !== "string") {
          throw new Error("Invalid MFA setup response from server");
        }
        setSetup({ otpauthUrl, secret });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load MFA setup");
      } finally {
        if (!navigatingAway) {
          setIsLoading(false);
        }
      }
    })();
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: confirmCode.replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to enable MFA");
      }
      const role = typeof data?.user?.role === "string" ? data.user.role : "website";
      window.location.assign(defaultLandingPath(role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enable MFA");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <AuthPageShell
      title="Two-factor authentication"
      subtitle="Scan the QR code with your authenticator app, then enter the 6-digit code to finish setup."
    >
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {!setup && !error ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to load MFA setup. Try signing out and signing in again.
        </p>
      ) : null}

      {setup ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="MFA QR code"
                className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-600"
              />
            ) : null}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Manual key: <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">{setup.secret}</code>
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100" htmlFor="mfa-setup-code">
                Verification code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="mfa-setup-code"
                  name="mfa-totp-code"
                  type="text"
                  required
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/[^\d\s]/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore
                  pattern="[0-9\s]{6,8}"
                  maxLength={8}
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-neutral-950 dark:text-gray-100 dark:focus:ring-white"
                  placeholder="123456"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify and continue"
              )}
            </button>
          </form>
        </div>
      ) : null}
    </AuthPageShell>
  );
}
