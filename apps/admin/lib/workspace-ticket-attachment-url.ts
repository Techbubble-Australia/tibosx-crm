import {
  formatDisplayFileName,
  ticketAttachmentContentUrl as adminTicketingUrl,
} from "@/lib/ticket-attachment-url";

export { formatDisplayFileName };

export function workspaceTicketAttachmentContentUrl(ticketId: string, attachmentId: string): string {
  return `/api/admin/workspace/tickets/${ticketId}/attachments/${attachmentId}/file`;
}

export function workspaceTicketAttachmentDownloadUrl(ticketId: string, attachmentId: string): string {
  return `${workspaceTicketAttachmentContentUrl(ticketId, attachmentId)}?download=1`;
}

/** Admin back-office ticket attachments (unchanged). */
export function ticketAttachmentContentUrl(ticketId: string, attachmentId: string): string {
  return adminTicketingUrl(ticketId, attachmentId);
}

export function ticketAttachmentDownloadUrl(ticketId: string, attachmentId: string): string {
  return `${ticketAttachmentContentUrl(ticketId, attachmentId)}?download=1`;
}
