"use client";

import { useState } from "react";
import { Loader2, ShieldOff } from "lucide-react";
import { appAlert, appConfirm } from "@/lib/app-alert";
import { adminFetch } from "@/lib/admin-api";
import { messageFromApiError } from "@/lib/api-error";

type Props = {
  resetUrl: string;
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
  onReset?: (next: { mfaEnabled: boolean; mfaEnrolledAt: string | null }) => void;
};

function formatEnrolledAt(value: string | null): string {
  if (!value) return "Not enrolled yet";
  return new Date(value).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminResetMfaSection({ resetUrl, mfaEnabled, mfaEnrolledAt, onReset }: Props) {
  const [loading, setLoading] = useState(false);
  const enrolled = Boolean(mfaEnrolledAt);

  async function handleReset() {
    const ok = await appConfirm(
      "Turn MFA off for this user and clear their authenticator? They can sign in with password only until they enable MFA again.",
      {
        title: "Disable MFA",
        confirmLabel: "Disable MFA",
        destructive: true,
      },
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await adminFetch(resetUrl, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(messageFromApiError(data, "Failed to reset MFA"));
      const next = data.data as { mfaEnabled?: boolean; mfaEnrolledAt?: string | null };
      onReset?.({
        mfaEnabled: Boolean(next?.mfaEnabled ?? false),
        mfaEnrolledAt: next?.mfaEnrolledAt ?? null,
      });
      appAlert(
        typeof data.message === "string"
          ? data.message
          : "MFA disabled. The user can sign in with password only.",
      );
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to reset MFA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Multi-factor authentication</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Status:{" "}
            <span
              className={`font-medium ${mfaEnabled && enrolled ? "text-sky-700 dark:text-sky-300" : "text-amber-700 dark:text-amber-300"}`}
            >
              {mfaEnabled && enrolled ? "Enrolled" : mfaEnabled ? "Setup required" : "Off"}
            </span>
            {enrolled ? ` · ${formatEnrolledAt(mfaEnrolledAt)}` : null}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleReset()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
          Reset MFA
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Clears the user’s authenticator and turns MFA off. They can sign in with password only until they enable MFA
        again under Settings → Security.
      </p>
    </div>
  );
}
