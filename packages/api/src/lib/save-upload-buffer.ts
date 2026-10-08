import path from "path";
import { promises as fsp } from "fs";
import { objectStorageConfigured, putUploadObject } from "./object-storage";

export async function saveUploadBuffer(
  buffer: Buffer,
  originalname: string,
  contentType: string,
): Promise<string> {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname) || "";
  const filename = `document-${uniqueSuffix}${ext}`;
  const key = `uploads/${filename}`;

  if (objectStorageConfigured()) {
    await putUploadObject({ key, body: buffer, contentType });
  } else {
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    await fsp.mkdir(uploadDir, { recursive: true });
    await fsp.writeFile(path.join(uploadDir, filename), buffer);
  }

  return `/uploads/${filename}`;
}
