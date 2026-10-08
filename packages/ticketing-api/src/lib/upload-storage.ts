import { randomUUID } from "crypto";
import fsp from "fs/promises";
import path from "path";
import { objectStorageConfigured, putUploadObject, TICKET_UPLOAD_OBJECT_PREFIX } from "./object-storage.js";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Local disk directory for ticket files (same pattern as TBOS `UPLOAD_DIR`, with a `tickets` subfolder). */
export function uploadDir(): string {
  const base = process.env.TICKETING_UPLOAD_DIR || process.env.UPLOAD_DIR || "./uploads";
  return path.resolve(base, "tickets");
}

export function publicUploadBaseUrl(): string {
  const explicit = process.env.TICKETING_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit) return `${explicit}/uploads/tickets`;
  const port = process.env.PORT || "3003";
  return `http://127.0.0.1:${port}/uploads/tickets`;
}

function normalizeDisplayFileName(name: string): string {
  return name.normalize("NFC").replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function ticketUploadPath(stored: string): string {
  return `/uploads/tickets/${encodeURIComponent(stored)}`;
}

export function validateUpload(file: Express.Multer.File): string | null {
  if (!file.buffer?.length) return "Empty file";
  if (file.size > MAX_BYTES) return "File exceeds 10MB limit";
  if (file.mimetype && !ALLOWED.has(file.mimetype)) return "File type not allowed";
  return null;
}

export async function saveTicketUpload(file: Express.Multer.File): Promise<{ fileName: string; fileUrl: string; fileSize: number }> {
  const err = validateUpload(file);
  if (err) throw new Error(err);
  const displayName = normalizeDisplayFileName(file.originalname);
  const safeOriginal = displayName.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const stored = `${randomUUID()}-${safeOriginal}`;
  const objectKey = `${TICKET_UPLOAD_OBJECT_PREFIX}/${stored}`;

  if (objectStorageConfigured()) {
    await putUploadObject({
      key: objectKey,
      body: file.buffer!,
      contentType: file.mimetype || "application/octet-stream",
    });
  } else {
    const dir = uploadDir();
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(path.join(dir, stored), file.buffer!);
  }

  const relativeUrl = ticketUploadPath(stored);
  const publicBase = process.env.TICKETING_PUBLIC_URL?.replace(/\/$/, "");
  return {
    fileName: displayName,
    fileUrl: publicBase ? `${publicBase}${relativeUrl}` : relativeUrl,
    fileSize: file.size,
  };
}
