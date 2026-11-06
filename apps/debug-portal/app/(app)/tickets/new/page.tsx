"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { ChevronSelect } from "@/components/ChevronSelect";
import { PageHeader } from "@/components/ui/PageHeader";
import { MAX_TICKET_SCREENSHOTS, SCREENSHOT_ACCEPT, uploadScreenshots } from "@/lib/upload-screenshot";
import { useSprints } from "@/lib/sprints";

type TicketType = "BUG" | "ENHANCEMENT";
type ReportedEnvironment = "development" | "production";
type PendingShot = { file: File; previewUrl: string };

export default function NewTicketPage() {
  const router = useRouter();
  const [type, setType] = useState<TicketType>("BUG");
  const [reportedEnvironment, setReportedEnvironment] = useState<ReportedEnvironment>("development");
  const [currentUrl, setCurrentUrl] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [shots, setShots] = useState<PendingShot[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { sprints, loading: sprintsLoading } = useSprints();
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") ?? null;

  const addFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((file) => SCREENSHOT_ACCEPT.split(",").includes(file.type));
    if (incoming.length && !images.length) {
      setError("Only PNG, JPEG, GIF, or WebP images can be attached.");
      return;
    }
    setShots((prev) => {
      const room = MAX_TICKET_SCREENSHOTS - prev.length;
      if (images.length > room) {
        setError(`You can attach up to ${MAX_TICKET_SCREENSHOTS} screenshots per ticket.`);
      }
      const picked = images.slice(0, Math.max(room, 0));
      return [...prev, ...picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))];
    });
  }, []);

  function onPickScreenshots(files: FileList | null) {
    if (files?.length) addFiles(Array.from(files));
  }

  /** Paste screenshots straight from the clipboard (e.g. after Print Screen / Cmd+Shift+Ctrl+4). */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (!files.length) return;
      e.preventDefault();
      addFiles(
        files.map((file, i) =>
          file.name && file.name !== "image.png"
            ? file
            : new File([file], `pasted-${Date.now()}-${i + 1}.png`, { type: file.type || "image/png" }),
        ),
      );
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  function removeShot(index: number) {
    setShots((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
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
      const screenshotUrls = await uploadScreenshots(shots.map((shot) => shot.file));

      const res = await fetch("/api/debug-portal/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reportedEnvironment,
          userDescription: userDescription.trim(),
          currentUrl: currentUrl.trim() || undefined,
          screenshotUrls,
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

        <div
          onDragOver={(e) => {
            if (!Array.from(e.dataTransfer.types).includes("Files")) return;
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(Array.from(e.dataTransfer.files));
          }}
          className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
            dragOver ? "border-sky-400 bg-sky-50/60" : "border-slate-200"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="dp-label mb-0">
              Screenshots <span className="font-normal text-slate-500">(optional)</span>
            </span>
            {shots.length ? (
              <span className="text-xs text-slate-500">
                {shots.length} / {MAX_TICKET_SCREENSHOTS}
              </span>
            ) : null}
          </div>
          {shots.length ? (
            <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shots.map((shot, index) => (
                <li key={shot.previewUrl} className="relative rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.previewUrl} alt={`Screenshot ${index + 1}`} className="h-28 w-full rounded object-contain" />
                  <p className="mt-1 truncate px-1 text-[11px] text-slate-500" title={shot.file.name}>
                    {shot.file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeShot(index)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-slate-600 shadow hover:text-red-600"
                    aria-label={`Remove ${shot.file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {shots.length < MAX_TICKET_SCREENSHOTS ? (
            <label className="dp-btn-secondary inline-flex cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden />
              {shots.length ? "Add more images" : "Choose images"}
              <input
                type="file"
                multiple
                accept={SCREENSHOT_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  onPickScreenshots(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            Choose several at once, drag images here, or paste with Ctrl/Cmd+V. PNG, JPEG, GIF, or WebP · max 10 MB
            each · up to {MAX_TICKET_SCREENSHOTS} images
          </p>
        </div>

        {!sprintsLoading ? (
          <p className="text-xs text-slate-500">
            {activeSprint
              ? `This ticket will be added to the active sprint, ${activeSprint.name}.`
              : "There is no active sprint, so this ticket will be saved to the Backlog."}
          </p>
        ) : null}

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
