import path from "path";
import { promises as fsp } from "fs";
import { objectStorageConfigured, putUploadObject } from "./object-storage.js";

export async function persistUploadedBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<void> {
  const key = `uploads/${filename}`;
  if (objectStorageConfigured()) {
    await putUploadObject({ key, body: buffer, contentType });
    return;
  }
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  await fsp.mkdir(uploadDir, { recursive: true });
  await fsp.writeFile(path.join(uploadDir, filename), buffer);
}
