const UPLOAD_PATH = "/uploads/tickets/";

/** Load attachments same-origin (portal proxies to ticketing-api). Works with stored absolute or relative URLs. */
export function resolveTicketAttachmentUrl(fileUrl: string): string {
  const raw = fileUrl.trim();
  if (!raw) return raw;

  if (raw.startsWith(UPLOAD_PATH)) {
    return raw;
  }

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith(UPLOAD_PATH)) {
      return `${u.pathname}${u.search}`;
    }
  } catch {
    const idx = raw.indexOf(UPLOAD_PATH);
    if (idx >= 0) {
      return raw.slice(idx);
    }
  }

  return raw;
}
