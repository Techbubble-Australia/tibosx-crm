import type { Response } from "express";
import {
  contentTypeFromFileName,
  normalizeDisplayFileName,
  openTicketUpload,
  resolveAttachmentStorageKey,
} from "./attachment-file.js";

type AttachmentRow = {
  id: string;
  fileName: string;
  fileUrl: string;
  storageKey?: string | null;
  fileSize?: number | null;
};

export async function streamTicketAttachmentFile(
  attachment: AttachmentRow,
  res: Response,
  options: { download?: boolean },
): Promise<boolean> {
  const storageKey = resolveAttachmentStorageKey(attachment);
  if (!storageKey) {
    res.status(404).json({ error: "File not found" });
    return false;
  }

  const opened = await openTicketUpload(storageKey);
  if (!opened) {
    res.status(404).json({ error: "File not found" });
    return false;
  }

  const displayName = normalizeDisplayFileName(attachment.fileName);
  const contentType = opened.contentType || contentTypeFromFileName(displayName);
  const disposition = options.download ? "attachment" : "inline";
  const safeAscii = displayName.replace(/[^\x20-\x7e]/g, "_");
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(displayName)}`,
  );
  if (opened.contentLength != null) {
    res.setHeader("Content-Length", String(opened.contentLength));
  }

  opened.stream.on("error", () => {
    if (!res.headersSent) res.status(500).end();
    else res.end();
  });
  opened.stream.pipe(res);
  return true;
}
