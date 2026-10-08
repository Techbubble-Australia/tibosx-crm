"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SignaturePad } from "@/components/agreements/SignaturePad";

type Props = {
  html: string;
  captureIds: string[];
  signedCaptureIds: string[];
  onSignedCaptureIdsChange: (ids: string[]) => void;
  signatures: Record<string, string>;
  onSignaturesChange: (next: Record<string, string>) => void;
};

export function AgreementSigningDocument({
  html,
  captureIds,
  signedCaptureIds,
  onSignedCaptureIdsChange,
  signatures,
  onSignaturesChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [draftSignature, setDraftSignature] = useState<string | null>(null);

  const bindCaptureAreas = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;

    for (const captureId of captureIds) {
      const el = host.querySelector(`[data-signature-capture="${captureId}"]`);
      if (!(el instanceof HTMLElement)) continue;
      el.classList.add("agreement-signature-target");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("title", signedCaptureIds.includes(captureId) ? "Signed — click to replace" : "Click to sign");
      if (signedCaptureIds.includes(captureId) && signatures[captureId]) {
        el.innerHTML = `<img src="${signatures[captureId]}" alt="Signature" style="max-height:72px;display:block;" />`;
      } else if (!el.querySelector("img")) {
        el.textContent = "Click to sign";
      }
    }
  }, [captureIds, signedCaptureIds, signatures]);

  useEffect(() => {
    bindCaptureAreas();
  }, [html, bindCaptureAreas]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    function onClick(event: MouseEvent) {
      const node = hostRef.current;
      if (!node) return;
      const target = event.target as HTMLElement;
      const capture = target.closest("[data-signature-capture]") as HTMLElement | null;
      if (!capture || !node.contains(capture)) return;
      const id = capture.getAttribute("data-signature-capture");
      if (!id || !captureIds.includes(id)) return;
      event.preventDefault();
      setActiveCaptureId(id);
      setDraftSignature(signatures[id] ?? null);
    }

    host.addEventListener("click", onClick);
    return () => host.removeEventListener("click", onClick);
  }, [captureIds, signatures]);

  function saveActiveSignature() {
    if (!activeCaptureId || !draftSignature) return;
    const next = { ...signatures, [activeCaptureId]: draftSignature };
    onSignaturesChange(next);
    const nextSigned = captureIds.filter((id) => Boolean(next[id]));
    onSignedCaptureIdsChange(nextSigned);
    setActiveCaptureId(null);
    setDraftSignature(null);
    window.requestAnimationFrame(() => bindCaptureAreas());
  }

  return (
    <div className="space-y-4">
      <div
        ref={hostRef}
        className="agreement-signing-doc max-h-[55vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-950 [&_.signature-block]:cursor-default [&_.signature-drag-handle]:hidden [&_.signature-resize-handle]:hidden"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .agreement-signature-target {
          min-height: 56px;
          border-bottom: 1px dashed #2563eb;
          color: #2563eb;
          font-size: 12px;
          padding: 8px 4px;
          cursor: pointer;
          background: rgba(37, 99, 235, 0.06);
        }
        .agreement-signature-target:hover { background: rgba(37, 99, 235, 0.12); }
      `}</style>

      {activeCaptureId ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Draw your signature</h4>
          <SignaturePad onChange={setDraftSignature} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveCaptureId(null);
                setDraftSignature(null);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draftSignature}
              onClick={saveActiveSignature}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              Save signature
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
