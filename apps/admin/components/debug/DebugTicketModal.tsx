"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, EyeOff, ImagePlus, Loader2, X } from "lucide-react";
import { appAlert } from "@/lib/app-alert";
import {
  MAX_DEBUG_SCREENSHOTS,
  useDebugMode,
  type DebugCaptureType,
  type ReportedEnvironment,
} from "@/contexts/DebugModeContext";
import { JsonTreePreview } from "@/components/debug/JsonTreePreview";

function trafficLogHint(reason: string | undefined): string {
  switch (reason) {
    case "element_text":
      return "Matched a recent API response using text or ids from the element you clicked (and nearby labels).";
    case "list_context":
      return "Matched a recent list/table API call for this part of the page.";
    case "recent_request":
      return "Matched a recent API call on this page (no strong text match — verify the endpoint below).";
    default:
      return "Inferred from recent adminFetch traffic on this page.";
  }
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="text-xs text-gray-500">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-800">{children}</div> : null}
    </div>
  );
}

export function DebugTicketModal() {
  const {
    modalOpen,
    closeModal,
    captureLoading,
    draft,
    setDraftField,
    buildPayloadJson,
    submitTicket,
    copyPayloadJson,
    recaptureViewport,
    addExtraScreenshotFiles,
    captureExtraScreen,
    extraCapturing,
    extraCaptureMode,
    startExtraCapture,
    finishExtraCapture,
    cancelExtraCapture,
  } = useDebugMode();
  const [saving, setSaving] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const usedSlots = (draft?.screenshotDataUrl ? 1 : 0) + (draft?.extraScreenshots.length ?? 0);
  const extraRoom = MAX_DEBUG_SCREENSHOTS - usedSlots;

  const addExtraScreenshots = useCallback(
    (files: FileList | File[] | null) => {
      const images = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
      if (!images.length) return;
      const added = addExtraScreenshotFiles(images);
      if (added < images.length) {
        appAlert(`You can attach up to ${MAX_DEBUG_SCREENSHOTS} screenshots per ticket.`);
      }
    },
    [addExtraScreenshotFiles],
  );

  /** Paste screenshots from the clipboard while the modal is open (text pastes are left alone). */
  useEffect(() => {
    if (!modalOpen || extraCaptureMode) return;
    function onPaste(e: ClipboardEvent) {
      const files = Array.from(e.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      addExtraScreenshots(
        files.map((file, i) => new File([file], `pasted-${Date.now()}-${i + 1}.png`, { type: file.type || "image/png" })),
      );
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [modalOpen, extraCaptureMode, addExtraScreenshots]);

  if (!modalOpen) return null;

  async function onCaptureNow() {
    const ok = await captureExtraScreen();
    if (!ok) appAlert("Could not capture the screen. Try uploading an image instead.");
  }

  if (extraCaptureMode) {
    return (
      <div
        data-debug-ui
        className="fixed bottom-20 left-1/2 z-[170] flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-white px-4 py-3 shadow-2xl dark:border-sky-900 dark:bg-gray-900"
        role="dialog"
        aria-label="Capture another screenshot"
      >
        <Camera className="h-5 w-5 text-sky-600" aria-hidden />
        <p className="text-sm text-gray-700 dark:text-gray-200">
          Set up the screen you want (scroll, open menus, or go to another page), then capture.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={extraCapturing}
            onClick={() => void finishExtraCapture()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {extraCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" aria-hidden />}
            Capture
          </button>
          <button
            type="button"
            disabled={extraCapturing}
            onClick={cancelExtraCapture}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600"
          >
            Back to ticket
          </button>
        </div>
      </div>
    );
  }

  function removeExtraScreenshot(index: number) {
    if (!draft) return;
    const target = draft.extraScreenshots[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    setDraftField(
      "extraScreenshots",
      draft.extraScreenshots.filter((_, i) => i !== index),
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      const result = await submitTicket();
      if (!result.ok) {
        appAlert(result.error ?? "Failed to save");
        return;
      }
      closeModal();
      appAlert("Debug capture saved.");
    } finally {
      setSaving(false);
    }
  }

  async function onCopy() {
    const ok = await copyPayloadJson();
    appAlert(ok ? "JSON copied to clipboard." : "Could not copy to clipboard.");
  }

  return (
    <div data-debug-ui className="fixed inset-0 z-[160] flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Debug capture ticket</h2>
          <button type="button" onClick={closeModal} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {captureLoading || !draft ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {(["BUG", "ENHANCEMENT"] as DebugCaptureType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDraftField("type", t)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      draft.type === t
                        ? "border-sky-600 bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {t === "BUG" ? "Bug 🐛" : "Enhancement 💡"}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Environment</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  value={draft.reportedEnvironment}
                  onChange={(e) =>
                    setDraftField("reportedEnvironment", e.target.value as ReportedEnvironment)
                  }
                >
                  <option value="development">Development</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  value={draft.userDescription}
                  onChange={(e) => setDraftField("userDescription", e.target.value)}
                  placeholder="What went wrong or what should improve?"
                />
              </div>

              {draft.screenshotDataUrl ? (
                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {draft.elementDiagnostics.captureScope === "viewport"
                        ? "Screen capture"
                        : "Element screenshot"}
                    </p>
                    <button
                      type="button"
                      disabled={captureLoading || saving}
                      onClick={() => void recaptureViewport()}
                      className="rounded border border-gray-200 px-2 py-1 text-xs font-medium dark:border-gray-600"
                    >
                      Recapture screen
                    </button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.screenshotDataUrl}
                    alt={draft.elementDiagnostics.captureScope === "viewport" ? "Screen capture" : "Captured element"}
                    className={`max-w-full rounded border border-gray-200 dark:border-gray-700 ${
                      draft.elementDiagnostics.captureScope === "viewport" ? "max-h-72" : "max-h-40"
                    }`}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-gray-500">No screenshot captured.</p>
                  <button
                    type="button"
                    disabled={captureLoading || saving}
                    onClick={() => void recaptureViewport()}
                    className="rounded border border-gray-200 px-2 py-1 text-xs font-medium dark:border-gray-600"
                  >
                    Capture screen
                  </button>
                </div>
              )}

              <div
                onDragOver={(e) => {
                  if (!Array.from(e.dataTransfer.types).includes("Files")) return;
                  e.preventDefault();
                  setDropActive(true);
                }}
                onDragLeave={() => setDropActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDropActive(false);
                  addExtraScreenshots(e.dataTransfer.files);
                }}
                className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
                  dropActive ? "border-sky-400 bg-sky-50/60 dark:bg-sky-950/30" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    More screenshots <span className="font-normal text-gray-500">(optional)</span>
                  </p>
                  <span className="text-xs text-gray-500">
                    {usedSlots} / {MAX_DEBUG_SCREENSHOTS}
                  </span>
                </div>
                {extraRoom > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving || extraCapturing}
                      onClick={() => void onCaptureNow()}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      title="Capture the page behind this window"
                    >
                      {extraCapturing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" aria-hidden />}
                      Capture screen
                    </button>
                    <button
                      type="button"
                      disabled={saving || extraCapturing}
                      onClick={startExtraCapture}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
                      title="Hide this window, set up the screen (scroll, open a menu, go to another page), then capture"
                    >
                      <EyeOff className="h-3.5 w-3.5" aria-hidden />
                      Hide &amp; capture…
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      Upload images
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="sr-only"
                        disabled={saving}
                        onChange={(e) => {
                          addExtraScreenshots(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <p className="mb-2 text-xs text-amber-700">Screenshot limit reached.</p>
                )}
                {draft.extraScreenshots.length ? (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {draft.extraScreenshots.map((shot, index) => (
                      <li key={shot.previewUrl} className="relative rounded border border-gray-200 p-1 dark:border-gray-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={shot.previewUrl} alt={shot.file.name} className="h-20 w-full rounded object-contain" />
                        <button
                          type="button"
                          onClick={() => removeExtraScreenshot(index)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-gray-600 shadow hover:text-red-600"
                          aria-label={`Remove ${shot.file.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">
                    Capture other screens, upload images, drag files here, or paste with Ctrl/Cmd+V.
                  </p>
                )}
              </div>

              <Accordion title={draft.elementDiagnostics.captureScope === "viewport" ? "Screen metadata" : "DOM metadata"} defaultOpen>
                <dl className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  <div>
                    <dt className="font-medium">Tag</dt>
                    <dd>{draft.elementDiagnostics.tagName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Selector</dt>
                    <dd className="break-all font-mono">{draft.elementDiagnostics.cssSelector}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Text preview</dt>
                    <dd>{draft.elementDiagnostics.innerText ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Bounding box</dt>
                    <dd>{JSON.stringify(draft.elementDiagnostics.boundingRect)}</dd>
                  </div>
                </dl>
              </Accordion>

              <Accordion title="API prerequisite">
                {draft.apiPrerequisite ? (
                  <>
                    {draft.apiPrerequisite.captureSource === "traffic_log" ? (
                      <p className="mb-2 text-xs text-sky-700 dark:text-sky-300">
                        {trafficLogHint(draft.apiPrerequisite.trafficMatchReason)}
                      </p>
                    ) : draft.apiPrerequisite.captureSource === "dom" ? (
                      <p className="mb-2 text-xs text-gray-500">
                        From <code className="text-[11px]">data-api-endpoint</code> on this element or a parent.
                      </p>
                    ) : null}
                    <JsonTreePreview value={draft.apiPrerequisite} />
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    No API captured. In development, load the page so data appears (API calls are recorded), then
                    capture again. For a guaranteed link, add{" "}
                    <code className="text-[11px]">data-api-endpoint=&quot;/api/...&quot;</code> on a parent of
                    this UI.
                  </p>
                )}
              </Accordion>

              <Accordion title="User metadata">
                <JsonTreePreview value={draft.userMetadata} />
              </Accordion>

              <Accordion title="JSON payload preview">
                <pre className="max-h-48 overflow-auto rounded bg-gray-950 p-2 text-[11px] text-gray-100">
                  {buildPayloadJson()}
                </pre>
              </Accordion>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <button
            type="button"
            disabled={!draft || captureLoading}
            onClick={() => void onCopy()}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
          >
            Copy JSON
          </button>
          <button
            type="button"
            disabled={!draft || captureLoading || saving}
            onClick={() => void onSave()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save ticket
          </button>
        </div>
      </div>
    </div>
  );
}
