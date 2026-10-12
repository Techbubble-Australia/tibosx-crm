import path from "path";
import { promises as fsp } from "fs";
import type { Readable } from "stream";
import { getUploadObjectForResponse, objectStorageConfigured } from "./object-storage";

async function readableToUtf8(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readUploadTextByUrl(uploadUrl: string): Promise<string | null> {
  if (!uploadUrl.startsWith("/uploads/")) return null;
  const filename = uploadUrl.replace(/^\/uploads\//, "");
  if (!filename || filename.includes("..")) return null;
  const key = `uploads/${filename}`;

  if (objectStorageConfigured()) {
    const obj = await getUploadObjectForResponse(key);
    if (!obj?.stream) return null;
    return readableToUtf8(obj.stream);
  }

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  try {
    return await fsp.readFile(path.join(uploadDir, filename), "utf8");
  } catch {
    return null;
  }
}
