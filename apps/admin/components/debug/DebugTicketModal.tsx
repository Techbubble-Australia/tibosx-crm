"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { appAlert } from "@/lib/app-alert";
import { useDebugMode, type DebugCaptureType, type ReportedEnvironment } from "@/contexts/DebugModeContext";
import { JsonTreePreview } from "@/components/debug/JsonTreePreview";

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
  } = useDebugMode();
  const [saving, setSaving] = useState(false);

  if (!modalOpen) return null;

  async function onSave() {
    setSaving(true);
    try {
      const result = await submitTicket();
      if (!result.ok) {
        appAlert(result.error ?? "Failed to save");
        return;
      }
      appAlert("Debug capture saved.");
      closeModal();
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
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description *</label>
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
                  <p className="mb-1 text-sm font-medium">Element screenshot</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.screenshotDataUrl}
                    alt="Captured element"
                    className="max-h-40 rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              ) : null}

              <Accordion title="DOM metadata" defaultOpen>
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
                  <JsonTreePreview value={draft.apiPrerequisite} />
                ) : (
                  <p className="text-xs text-gray-500">No data-api-endpoint on this element or its ancestors.</p>
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
