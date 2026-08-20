export const CAREER_APPLICATION_STATUSES = [
  "CLIENT_REVIEW",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "REJECTED",
  "CANCELLED",
] as const;

export type CareerApplicationStatus = (typeof CAREER_APPLICATION_STATUSES)[number];

export const CAREER_APPLICATION_STATUS_LABELS: Record<CareerApplicationStatus, string> = {
  CLIENT_REVIEW: "Client Review",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const CAREER_APPLICATION_STATUS_COLORS: Record<
  CareerApplicationStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  CLIENT_REVIEW: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
  INTERVIEW_SCHEDULED: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900/40",
    darkText: "dark:text-amber-200",
  },
  SELECTED: {
    bg: "bg-green-100",
    text: "text-green-800",
    darkBg: "dark:bg-green-900/40",
    darkText: "dark:text-green-200",
  },
  REJECTED: {
    bg: "bg-red-100",
    text: "text-red-800",
    darkBg: "dark:bg-red-900/40",
    darkText: "dark:text-red-200",
  },
  CANCELLED: {
    bg: "bg-red-950/10",
    text: "text-red-950",
    darkBg: "dark:bg-red-950/50",
    darkText: "dark:text-red-300",
  },
};

export function isCareerApplicationStatus(value: string): value is CareerApplicationStatus {
  return (CAREER_APPLICATION_STATUSES as readonly string[]).includes(value);
}
