import mammoth from "mammoth";

export async function convertDocxBufferToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value.trim();
}

export function readTextOrHtmlBuffer(buffer: Buffer, filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "html" || ext === "htm") {
    return buffer.toString("utf8");
  }
  return buffer.toString("utf8");
}

export async function importDocumentToHtml(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "docx") {
    return convertDocxBufferToHtml(buffer);
  }
  if (ext === "html" || ext === "htm" || ext === "txt") {
    return readTextOrHtmlBuffer(buffer, filename);
  }
  throw new Error("Unsupported file type. Use .docx, .html, .htm, or .txt");
}
