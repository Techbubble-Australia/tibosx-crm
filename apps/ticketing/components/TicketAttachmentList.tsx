"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export type TicketAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

export function isImageAttachment(fileName: string): boolean {
  return IMAGE_EXT.test(fileName.trim());
}

function formatFileSize(bytes?: number | null): string | null {
  if (bytes == null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachmentList({ attachments }: { attachments: TicketAttachmentItem[] }) {
  const [lightbox, setLightbox] = useState<TicketAttachmentItem | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, closeLightbox]);

  if (attachments.length === 0) {
    return <p className="text-sm text-slate-500">No files attached.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {attachments.map((a) => {
          const sizeLabel = formatFileSize(a.fileSize);
          const image = isImageAttachment(a.fileName);

          if (image) {
            return (
              <li key={a.id} className="flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  onClick={() => setLightbox(a)}
                  className="group shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition hover:border-sky-300 hover:ring-2 hover:ring-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label={`Preview ${a.fileName}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- attachment URLs are dynamic / cross-origin */}
                  <img
                    src={a.fileUrl}
                    alt={a.fileName}
                    className="h-28 w-28 object-cover transition group-hover:opacity-95 sm:h-32 sm:w-32"
                    loading="lazy"
                  />
                </button>
                <div className="min-w-0 flex-1 pt-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setLightbox(a)}
                    className="font-medium text-sky-700 hover:underline text-left break-all"
                  >
                    {a.fileName}
                  </button>
                  {sizeLabel ? <p className="mt-0.5 text-slate-500">{sizeLabel}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">Click preview to expand</p>
                </div>
              </li>
            );
          }

          return (
            <li key={a.id} className="text-sm">
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 hover:underline break-all"
              >
                {a.fileName}
              </a>
              {sizeLabel ? <span className="text-slate-500"> ({sizeLabel})</span> : null}
            </li>
          );
        })}
      </ul>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${lightbox.fileName}`}
          onClick={closeLightbox}
        >
          <div
            className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="min-w-0 truncate text-sm font-medium">{lightbox.fileName}</p>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={lightbox.fileUrl}
                download={lightbox.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex items-center justify-center rounded-lg bg-white/15 p-2 hover:bg-white/25"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.fileUrl}
              alt={lightbox.fileName}
              className="max-h-[calc(100vh-6rem)] max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
