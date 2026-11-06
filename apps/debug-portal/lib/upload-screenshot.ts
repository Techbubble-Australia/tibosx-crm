import { readUploadImageUrlFromJson } from "@/lib/upload-response";

export const MAX_TICKET_SCREENSHOTS = 20;
export const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

export async function uploadScreenshot(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/upload/image", { method: "POST", credentials: "include", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : `Upload failed for ${file.name}`);
  }
  const url = readUploadImageUrlFromJson(json);
  if (!url) throw new Error(`Upload failed for ${file.name}`);
  return url;
}

export async function uploadScreenshots(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadScreenshot(file));
  }
  return urls;
}
