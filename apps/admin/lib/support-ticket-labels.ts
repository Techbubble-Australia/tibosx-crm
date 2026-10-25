export const TICKET_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PENDING_CLIENT: "Awaiting client info",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TICKET_TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Product/Technical issue",
  FINANCIAL_LOAN: "Financial / loan request",
  SERVICE_INTERNAL: "Internal service",
  SERVICE_EXTERNAL: "External service",
  BUG: "New bug",
  ENHANCEMENT: "New enhancement",
  OTHER: "Other",
};

export const TICKET_STATUSES = Object.keys(TICKET_STATUS_LABELS);

/** Statuses shown in list filters (tickets do not use Draft in the product). */
export const TICKET_STATUS_FILTER_ENTRIES = Object.entries(TICKET_STATUS_LABELS).filter(
  ([value]) => value !== "DRAFT",
);

const TERMINAL_TICKET_STATUSES = new Set(["CLOSED", "CANCELLED"]);

export function normalizeTicketStatusKey(status: string | null | undefined): string {
  const raw = (status ?? "").trim();
  if (!raw) return "";
  const key = raw.toUpperCase().replace(/\s+/g, "_");
  if (TICKET_STATUS_LABELS[key]) return key;
  const compact = key.replace(/_/g, "");
  const alias: Record<string, string> = {
    INPROGRESS: "IN_PROGRESS",
    PENDINGCLIENT: "PENDING_CLIENT",
  };
  return alias[compact] ?? key;
}

export function ticketStatusLabel(status: string | null | undefined): string {
  const key = normalizeTicketStatusKey(status);
  if (!key) return "—";
  if (TICKET_STATUS_LABELS[key]) return TICKET_STATUS_LABELS[key];
  const raw = (status ?? "").trim();
  if (!raw) return "—";
  return raw.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function isTerminalTicketStatus(status: string): boolean {
  return TERMINAL_TICKET_STATUSES.has(normalizeTicketStatusKey(status));
}

export function isOpenTicketStatus(status: string): boolean {
  const key = normalizeTicketStatusKey(status);
  return Boolean(key) && !TERMINAL_TICKET_STATUSES.has(key) && key !== "RESOLVED";
}

/** Assign-to-me is hidden once a ticket is resolved, closed, or cancelled. */
export function ticketAllowsAssignToMe(status: string): boolean {
  const key = normalizeTicketStatusKey(status);
  return Boolean(key) && key !== "RESOLVED" && key !== "CLOSED" && key !== "CANCELLED";
}
export const TICKET_PRIORITIES = Object.keys(TICKET_PRIORITY_LABELS);
export const TICKET_TYPES = Object.keys(TICKET_TYPE_LABELS);

export const CLIENT_REQUEST_TYPES = [
  { value: "TECHNICAL", label: "Product/Technical issue" },
  { value: "BUG", label: "New bug" },
  { value: "ENHANCEMENT", label: "New enhancement" },
  { value: "OTHER", label: "Other" },
] as const;
