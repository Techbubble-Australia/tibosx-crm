"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  formatDisplayFileName,
  ticketAttachmentContentUrl,
  ticketAttachmentDownloadUrl,
} from "@/lib/ticket-attachment-url";

export type TicketAttachmentItem = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

function isImageAttachment(fileName: string): boolean {
  return IMAGE_EXT.test(formatDisplayFileName(fileName).trim());
}

function formatFileSize(bytes?: number | null): string | null {
  if (bytes == null || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachmentList({
  ticketId,
  attachments,
}: {
  ticketId: string;
  attachments: TicketAttachmentItem[];
}) {
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
    return <p className="text-sm text-gray-500">No attachments.</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {attachments.map((a) => {
          const displayName = formatDisplayFileName(a.fileName);
          const previewUrl = ticketAttachmentContentUrl(ticketId, a.id);
          const downloadUrl = ticketAttachmentDownloadUrl(ticketId, a.id);
          const sizeLabel = formatFileSize(a.fileSize);
          const image = isImageAttachment(a.fileName);

          if (image) {
            return (
              <li key={a.id} className="flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  onClick={() => setLightbox(a)}
                  className="group shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition hover:border-blue-300 hover:ring-2 hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                  aria-label={`Preview ${displayName}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={displayName}
                    className="h-28 w-28 object-cover transition group-hover:opacity-95 sm:h-32 sm:w-32"
                    loading="lazy"
                  />
                </button>
                <div className="min-w-0 flex-1 pt-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setLightbox(a)}
                    className="text-left font-medium text-blue-600 hover:underline break-all dark:text-blue-400"
                  >
                    {displayName}
                  </button>
                  {sizeLabel ? <p className="mt-0.5 text-gray-500">{sizeLabel}</p> : null}
                  <p className="mt-1 text-xs text-gray-400">Click preview to expand</p>
                </div>
              </li>
            );
          }

          return (
            <li key={a.id} className="text-sm">
              <a
                href={downloadUrl}
                className="font-medium text-blue-600 hover:underline break-all dark:text-blue-400"
              >
                {displayName}
              </a>
              {sizeLabel ? <span className="text-gray-400"> ({sizeLabel})</span> : null}
            </li>
          );
        })}
      </ul>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${formatDisplayFileName(lightbox.fileName)}`}
          onClick={closeLightbox}
        >
          <div
            className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-3 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="min-w-0 truncate text-sm font-medium">{formatDisplayFileName(lightbox.fileName)}</p>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={ticketAttachmentDownloadUrl(ticketId, lightbox.id)}
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
              src={ticketAttachmentContentUrl(ticketId, lightbox.id)}
              alt={formatDisplayFileName(lightbox.fileName)}
              className="max-h-[calc(100vh-6rem)] max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
