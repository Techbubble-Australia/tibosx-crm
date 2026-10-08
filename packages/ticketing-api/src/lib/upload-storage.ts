import { randomUUID } from "crypto";
import fsp from "fs/promises";
import path from "path";

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

export function uploadDir(): string {
  return process.env.TICKETING_UPLOAD_DIR || path.join(process.cwd(), "uploads", "tickets");
}

export function publicUploadBaseUrl(): string {
  const explicit = process.env.TICKETING_PUBLIC_URL?.replace(/\/$/, "");
  if (explicit) return `${explicit}/uploads/tickets`;
  const port = process.env.PORT || "3003";
  return `http://127.0.0.1:${port}/uploads/tickets`;
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
  const safeOriginal = file.originalname.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
  const stored = `${randomUUID()}-${safeOriginal}`;
  const dir = uploadDir();
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, stored), file.buffer!);
  return {
    fileName: file.originalname,
    fileUrl: `${publicUploadBaseUrl()}/${encodeURIComponent(stored)}`,
    fileSize: file.size,
  };
}
