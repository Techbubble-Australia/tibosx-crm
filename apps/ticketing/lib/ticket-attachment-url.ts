const MOJIBAKE_NARROW_NBSP = "â€¯";

export function formatDisplayFileName(fileName: string): string {
  return fileName
    .normalize("NFC")
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(new RegExp(MOJIBAKE_NARROW_NBSP, "g"), " ");
}

/** Authenticated stream through the portal API proxy (reliable previews). */
export function ticketAttachmentContentUrl(ticketId: string, attachmentId: string): string {
  return `/api/tickets/${ticketId}/attachments/${attachmentId}/file`;
}

export function ticketAttachmentDownloadUrl(ticketId: string, attachmentId: string): string {
  return `${ticketAttachmentContentUrl(ticketId, attachmentId)}?download=1`;
}
