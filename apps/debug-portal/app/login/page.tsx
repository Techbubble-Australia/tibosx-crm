"use client";

import { useState } from "react";
import { Bug, Loader2, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Login failed");
      }
      window.location.assign("/board");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="dp-card w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <Bug className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Debug portal</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with your TBOS account. MFA is not required here.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label className="dp-label" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@company.com"
                className="dp-input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="dp-label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="dp-input pl-9"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="dp-btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
