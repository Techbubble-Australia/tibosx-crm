import { readUploadImageUrlFromJson } from "@/lib/upload-response";

export const MAX_TICKET_SCREENSHOTS = 20;
export const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
/** Ticket attachments: screenshots plus PDF documents. */
export const TICKET_ATTACHMENT_ACCEPT = `${SCREENSHOT_ACCEPT},application/pdf`;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** True when a file can be attached to a ticket (by MIME and/or extension). */
export function isAcceptedTicketAttachment(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/jpg" || mime === "image/jpeg" || mime === "image/png" || mime === "image/gif" || mime === "image/webp") {
    return true;
  }
  if (TICKET_ATTACHMENT_ACCEPT.split(",").includes(file.type)) return true;
  if (isPdfFile(file)) return true;
  const name = file.name.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|pdf)$/.test(name)) return true;
  // Clipboard pastes sometimes omit MIME/type but are still images.
  if (!mime && (name.startsWith("pasted-") || name === "image.png" || name === "image.jpg")) return true;
  return false;
}

/** Collect files from a paste event (clipboard `files` and `items`). */
export function filesFromClipboard(data: DataTransfer | null | undefined): File[] {
  if (!data) return [];
  const fromFiles = Array.from(data.files ?? []);
  if (fromFiles.length) return fromFiles;
  const fromItems: File[] = [];
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(?:$|[?#])/i.test(url);
}

/** File name shown for an uploaded document (uploads keep the extension but not the original name). */
export function attachmentLabel(url: string): string {
  const last = url.split(/[?#]/)[0]?.split("/").pop() ?? "";
  return last || "Document";
}

async function uploadPdf(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES) throw new Error(`${file.name} is larger than 10 MB`);
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/attachment", { method: "POST", credentials: "include", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof json.error === "string" ? json.error : `Upload failed for ${file.name}`);
  }
  const url = readUploadImageUrlFromJson(json);
  if (!url) throw new Error(`Upload failed for ${file.name}`);
  return url;
}

export async function uploadScreenshot(file: File): Promise<string> {
  if (isPdfFile(file)) return uploadPdf(file);
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
