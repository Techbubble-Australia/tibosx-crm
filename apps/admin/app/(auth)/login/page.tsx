"use client";

import { useEffect, useState } from "react";
import { Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import { defaultLandingPath } from "@/lib/admin-roles";
import { TechBubbleLogo } from "@/components/TechBubbleLogo";

type LoginStep = "credentials" | "mfa";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (step === "mfa") {
      setMfaCode("");
    }
  }, [step]);

  async function onCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Login failed");
      }

      if (data.requiresMfa && typeof data.mfaToken === "string") {
        setMfaToken(data.mfaToken);
        setEmailHint(typeof data.user?.email === "string" ? data.user.email : email);
        setStep("mfa");
        return;
      }

      if (data.requiresPasswordReset) {
        window.location.assign("/settings/security?reset=required");
        return;
      }

      if (data.requiresMfaSetup) {
        window.location.assign("/settings/security?mfa=required");
        return;
      }

      window.location.assign(defaultLandingPath(data?.user?.role ?? "website"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function onMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const code = mfaCode.replace(/\s/g, "");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mfaToken, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "MFA verification failed");
      }

      if (data.requiresPasswordReset) {
        window.location.assign("/settings/security?reset=required");
        return;
      }
      if (data.requiresMfaSetup) {
        window.location.assign("/settings/security?mfa=required");
        return;
      }
      window.location.assign(defaultLandingPath(data?.user?.role ?? "website"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "MFA verification failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-neutral-900">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <TechBubbleLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {step === "mfa" ? "Two-factor authentication" : "TIBOSX.AI"}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {step === "mfa"
              ? `Enter the 6-digit code from your authenticator app for ${emailHint}.`
              : "AI-powered Business Operating System"}
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {step === "credentials" ? (
          <form onSubmit={onCredentialsSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-neutral-950 dark:text-gray-100 dark:focus:ring-white"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-neutral-950 dark:text-gray-100 dark:focus:ring-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={onMfaSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100" htmlFor="mfa-totp-code">
                Verification code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="mfa-totp-code"
                  name="mfa-totp-code"
                  type="text"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/[^\d\s]/g, ""))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore
                  pattern="[0-9\s]{6,8}"
                  maxLength={8}
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-600 dark:bg-neutral-950 dark:text-gray-100 dark:focus:ring-white"
                  placeholder="123456"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and continue"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setMfaToken("");
                setMfaCode("");
                setError("");
              }}
              className="w-full text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
