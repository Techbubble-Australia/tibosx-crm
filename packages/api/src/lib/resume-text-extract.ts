import path from "path";
import { promises as fsp } from "fs";
import mammoth from "mammoth";

async function parsePdfText(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const parser =
    (mod as { default?: (input: Buffer) => Promise<{ text?: string }> }).default ??
    (mod as unknown as (input: Buffer) => Promise<{ text?: string }>);
  if (typeof parser !== "function") {
    return "";
  }
  const data = await parser(buffer);
  return (data.text ?? "").trim();
}

export async function extractTextFromDocument(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") {
    return await parsePdfText(buffer);
  }
  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? "").trim();
  }
  if (ext === "txt") {
    return buffer.toString("utf8").trim();
  }
  return "";
}

export function appendResumeText(existing: string | null | undefined, newText: string): string {
  const chunks = [existing?.trim(), newText.trim()].filter(Boolean);
  return chunks.join("\n\n");
}

function uploadFilenameFromUrl(fileUrl: string): string | null {
  const normalized = fileUrl.trim();
  if (!normalized) return null;
  const marker = "/uploads/";
  const index = normalized.indexOf(marker);
  if (index === -1) return null;
  const filename = normalized.slice(index + marker.length);
  return filename && !filename.includes("..") ? filename : null;
}

export async function extractTextFromUploadUrl(fileUrl: string): Promise<string> {
  const filename = uploadFilenameFromUrl(fileUrl);
  if (!filename) return "";
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  try {
    const buffer = await fsp.readFile(path.join(uploadDir, filename));
    return await extractTextFromDocument(buffer, filename);
  } catch {
    return "";
  }
}

export async function extractTextFromUploadUrls(fileUrls: string[]): Promise<string> {
  const chunks: string[] = [];
  for (const fileUrl of fileUrls) {
    const text = await extractTextFromUploadUrl(fileUrl);
    if (text) chunks.push(text);
  }
  return chunks.join("\n\n");
}
