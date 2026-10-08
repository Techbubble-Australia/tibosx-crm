import { createReadStream } from "fs";
import fsp from "fs/promises";
import path from "path";
import type { Readable } from "stream";
import {
  getUploadObjectForResponse,
  objectStorageConfigured,
  TICKET_UPLOAD_OBJECT_PREFIX,
} from "./object-storage.js";
import { uploadDir } from "./upload-storage.js";

const MOJIBAKE_NARROW_NBSP = "â€¯";

/** Multer often provides `originalname` as latin1; macOS screenshot names need UTF-8. */
export function decodeMulterOriginalName(name: string): string {
  if (!name) return name;
  if (!/[\u0080-\u00ff]/.test(name)) return name;
  try {
    const asUtf8 = Buffer.from(name, "latin1").toString("utf8");
    if (asUtf8.includes("\uFFFD")) return name;
    return asUtf8;
  } catch {
    return name;
  }
}

export function normalizeDisplayFileName(name: string): string {
  return decodeMulterOriginalName(name)
    .normalize("NFC")
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(new RegExp(MOJIBAKE_NARROW_NBSP, "g"), " ");
}

export function storageKeyFromFileUrl(fileUrl: string): string | null {
  const marker = "/uploads/tickets/";
  let pathname = fileUrl.trim();
  try {
    if (pathname.includes("://")) {
      pathname = new URL(pathname).pathname;
    }
  } catch {
    /* keep raw */
  }
  const idx = pathname.indexOf(marker);
  if (idx < 0) return null;
  const encoded = pathname.slice(idx + marker.length).split("?")[0]?.split("#")[0] ?? "";
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export function resolveAttachmentStorageKey(attachment: {
  storageKey?: string | null;
  fileUrl: string;
}): string | null {
  if (attachment.storageKey?.trim()) return attachment.storageKey.trim();
  return storageKeyFromFileUrl(attachment.fileUrl);
}

function storageKeyCandidates(storageKey: string): string[] {
  const keys = new Set<string>();
  keys.add(storageKey);
  keys.add(storageKey.replace(/\u202f/g, "_"));
  keys.add(storageKey.replace(/\u202f/g, " "));
  keys.add(storageKey.replace(new RegExp(MOJIBAKE_NARROW_NBSP, "g"), "_"));
  keys.add(storageKey.replace(new RegExp(MOJIBAKE_NARROW_NBSP, "g"), " "));
  return [...keys];
}

export function contentTypeFromFileName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".bmp":
      return "image/bmp";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

export async function openTicketUpload(
  storageKey: string,
): Promise<{ stream: Readable; contentType: string; contentLength?: number } | null> {
  for (const key of storageKeyCandidates(storageKey)) {
    const opened = await tryOpenTicketUpload(key);
    if (opened) return opened;
  }
  return null;
}

async function tryOpenTicketUpload(
  storageKey: string,
): Promise<{ stream: Readable; contentType: string; contentLength?: number } | null> {
  if (!storageKey || storageKey.includes("..") || storageKey.includes("/") || storageKey.includes("\\")) {
    return null;
  }

  const objectKey = `${TICKET_UPLOAD_OBJECT_PREFIX}/${storageKey}`;

  if (objectStorageConfigured()) {
    const obj = await getUploadObjectForResponse(objectKey);
    if (!obj) return null;
    return {
      stream: obj.stream,
      contentType: obj.contentType,
      contentLength: obj.contentLength,
    };
  }

  const filePath = path.join(uploadDir(), storageKey);
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) return null;
    const stream = createReadStream(filePath);
    return {
      stream,
      contentType: contentTypeFromFileName(storageKey),
      contentLength: stat.size,
    };
  } catch {
    return null;
  }
}
