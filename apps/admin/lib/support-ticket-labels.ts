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
export const TICKET_PRIORITIES = Object.keys(TICKET_PRIORITY_LABELS);
export const TICKET_TYPES = Object.keys(TICKET_TYPE_LABELS);

export const CLIENT_REQUEST_TYPES = [
  { value: "TECHNICAL", label: "Product/Technical issue" },
  { value: "BUG", label: "New bug" },
  { value: "ENHANCEMENT", label: "New enhancement" },
  { value: "OTHER", label: "Other" },
] as const;
