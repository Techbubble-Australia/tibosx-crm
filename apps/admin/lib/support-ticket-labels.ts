export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  PENDING_CLIENT: "Pending client",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
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
