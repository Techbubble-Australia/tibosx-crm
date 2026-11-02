"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";

type TicketType = "BUG" | "ENHANCEMENT";
type ReportedEnvironment = "development" | "production";

export default function NewTicketPage() {
  const router = useRouter();
  const [type, setType] = useState<TicketType>("BUG");
  const [reportedEnvironment, setReportedEnvironment] = useState<ReportedEnvironment>("development");
  const [currentUrl, setCurrentUrl] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onPickScreenshot(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setScreenshotFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function uploadScreenshot(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof json.error === "string" ? json.error : "Screenshot upload failed");
    }
    return readUploadImageUrlFromJson(json) || null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!userDescription.trim()) {
      setError("Description is required.");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshotFile) {
        screenshotUrl = await uploadScreenshot(screenshotFile);
        if (!screenshotUrl) {
          throw new Error("Screenshot upload failed");
        }
      }

      const res = await fetch("/api/debug-portal/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reportedEnvironment,
          userDescription: userDescription.trim(),
          currentUrl: currentUrl.trim() || undefined,
          screenshotUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to create ticket");
      }
      const id = data?.data?.id;
      if (typeof id === "string") {
        router.push(`/tickets/${id}`);
        return;
      }
      router.push("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/tickets" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        All tickets
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">New ticket</h1>
        <p className="mt-1 text-sm text-slate-600">
          File a bug or enhancement that is not tied to a TBOS admin UI capture (API issues, infra, process, etc.).
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          {(["BUG", "ENHANCEMENT"] as TicketType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                type === t
                  ? "border-sky-600 bg-sky-50 text-sky-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t === "BUG" ? "Bug" : "Enhancement"}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="env" className="mb-1 block text-sm font-medium text-slate-800">
            Environment
          </label>
          <ChevronSelect
            id="env"
            value={reportedEnvironment}
            onChange={(v) => setReportedEnvironment(v as ReportedEnvironment)}
            className="w-full min-w-0"
            aria-label="Reported environment"
          >
            <option value="development">Development</option>
            <option value="production">Production</option>
          </ChevronSelect>
        </div>

        <div>
          <label htmlFor="related-url" className="mb-1 block text-sm font-medium text-slate-800">
            Related URL <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="related-url"
            type="url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://… or page where you saw the issue"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-800">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder="What happened, expected behavior, steps to reproduce, logs, etc."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">Screenshot (optional)</span>
            {previewUrl ? (
              <button
                type="button"
                onClick={() => onPickScreenshot(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Screenshot preview"
              className="mb-2 max-h-48 rounded-lg border border-slate-100 object-contain"
            />
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100">
            <Upload className="h-4 w-4" />
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="sr-only"
              onChange={(e) => onPickScreenshot(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create ticket
          </button>
          <Link
            href="/tickets"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
