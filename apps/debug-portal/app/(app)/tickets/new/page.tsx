"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { PageHeader } from "@/components/ui/PageHeader";
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
      setError("Please add a description so others can understand the issue.");
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
      <PageHeader
        backHref="/tickets"
        backLabel="All tickets"
        title="New ticket"
        description="Report a bug or enhancement that is not tied to a TBOS screen capture (API, infra, process, etc.)."
      />

      <form onSubmit={(e) => void onSubmit(e)} className="dp-card space-y-6 p-5 sm:p-6">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <fieldset>
          <legend className="dp-label">Type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["BUG", "ENHANCEMENT"] as TicketType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? "border-sky-600 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {t === "BUG" ? "Bug" : "Enhancement"}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="env" className="dp-label">
            Environment
          </label>
          <ChevronSelect
            id="env"
            value={reportedEnvironment}
            onChange={(v) => setReportedEnvironment(v as ReportedEnvironment)}
            className="block w-full max-w-xs"
            aria-label="Reported environment"
          >
            <option value="development">Development</option>
            <option value="production">Production</option>
          </ChevronSelect>
        </div>

        <div>
          <label htmlFor="related-url" className="dp-label">
            Related URL <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="related-url"
            type="url"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            placeholder="https://…"
            className="dp-input"
          />
        </div>

        <div>
          <label htmlFor="description" className="dp-label">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={6}
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            placeholder="What happened, what you expected, steps to reproduce, logs, etc."
            className="dp-input min-h-[8rem] resize-y"
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="dp-label mb-0">Screenshot (optional)</span>
            {previewUrl ? (
              <button
                type="button"
                onClick={() => onPickScreenshot(null)}
                className="dp-btn-ghost py-1 text-xs text-slate-600"
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
              className="mb-3 max-h-56 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1"
            />
          ) : null}
          <label className="dp-btn-secondary inline-flex cursor-pointer">
            <Upload className="h-4 w-4" aria-hidden />
            Choose image
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="sr-only"
              onChange={(e) => onPickScreenshot(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">PNG, JPEG, GIF, or WebP · max 10 MB</p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button type="submit" disabled={submitting} className="dp-btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Create ticket
          </button>
          <Link href="/tickets" className="dp-btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
