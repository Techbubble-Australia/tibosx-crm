"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { SignatureCaptureDialog } from "@/components/agreements/SignatureCaptureDialog";
import { DOCUMENT_TEMPLATE_STYLES } from "@/lib/document-template-styles";

export type AgreementSigningDocumentHandle = {
  signNext: () => void;
};

type Props = {
  html: string;
  captureIds: string[];
  signedCaptureIds: string[];
  onSignedCaptureIdsChange: (ids: string[]) => void;
  signatures: Record<string, string>;
  onSignaturesChange: (next: Record<string, string>) => void;
};

function formatSignedOnDate() {
  return new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const AgreementSigningDocument = forwardRef<AgreementSigningDocumentHandle, Props>(
  function AgreementSigningDocument(
    {
      html,
      captureIds,
      signedCaptureIds,
      onSignedCaptureIdsChange,
      signatures,
      onSignaturesChange,
    },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
    const [draftSignature, setDraftSignature] = useState<string | null>(null);
    const [signedOnByCapture, setSignedOnByCapture] = useState<Record<string, string>>({});

    const renderSignedCapture = useCallback(
      (captureId: string, dataUrl: string) => {
        const signedOn = signedOnByCapture[captureId] ?? formatSignedOnDate();
        return `<img src="${dataUrl}" alt="Signature" style="max-height:72px;display:block;" /><p style="font-size:11px;color:#444;margin:6px 0 0;">Signed on ${signedOn}</p>`;
      },
      [signedOnByCapture],
    );

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
          el.innerHTML = renderSignedCapture(captureId, signatures[captureId]);
        } else if (!el.querySelector("img")) {
          el.textContent = "Click to sign";
        }
      }
    }, [captureIds, signedCaptureIds, signatures, renderSignedCapture]);

    useEffect(() => {
      bindCaptureAreas();
    }, [html, bindCaptureAreas]);

    const openCapture = useCallback(
      (id: string) => {
        setActiveCaptureId(id);
        setDraftSignature(signatures[id] ?? null);
        const el = hostRef.current?.querySelector(`[data-signature-capture="${id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      },
      [signatures],
    );

    useImperativeHandle(
      ref,
      () => ({
        signNext: () => {
          const next = captureIds.find((id) => !signatures[id]);
          if (!next) return;
          openCapture(next);
        },
      }),
      [captureIds, signatures, openCapture],
    );

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
        openCapture(id);
      }

      host.addEventListener("click", onClick);
      return () => host.removeEventListener("click", onClick);
    }, [captureIds, openCapture]);

    function saveActiveSignature(imageDataUrl?: string) {
      const dataUrl = imageDataUrl ?? draftSignature;
      if (!activeCaptureId || !dataUrl) return;
      const signedOn = formatSignedOnDate();
      setSignedOnByCapture((prev) => ({ ...prev, [activeCaptureId]: signedOn }));
      const next = { ...signatures, [activeCaptureId]: dataUrl };
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
          className="agreement-signing-doc max-h-[55vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-950 [&_.signature-block]:cursor-default [&_.signature-drag-handle]:hidden [&_.signature-resize-handle]:hidden"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <style>{`
        ${DOCUMENT_TEMPLATE_STYLES}
        .agreement-signing-doc ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .agreement-signing-doc ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
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

        <SignatureCaptureDialog
          open={Boolean(activeCaptureId)}
          title="Add your signature"
          onClose={() => {
            setActiveCaptureId(null);
            setDraftSignature(null);
          }}
          onInsert={(dataUrl) => saveActiveSignature(dataUrl)}
        />
      </div>
    );
  },
);
