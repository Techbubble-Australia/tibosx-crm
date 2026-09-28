export const CAREER_APPLICATION_STATUSES = [
  "INTERNAL_REVIEW",
  "CLIENT_REVIEW",
  "INTERVIEW_SCHEDULED",
  "AWAITING_FEEDBACK",
  "SELECTED",
  "REJECTED",
  "CANCELLED",
] as const;

export type CareerApplicationStatus = (typeof CAREER_APPLICATION_STATUSES)[number];

export const CAREER_APPLICATION_STATUS_LABELS: Record<CareerApplicationStatus, string> = {
  INTERNAL_REVIEW: "Internal Review",
  CLIENT_REVIEW: "Client Review",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  AWAITING_FEEDBACK: "Awaiting feedback",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const CAREER_APPLICATION_STATUS_COLORS: Record<
  CareerApplicationStatus,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  INTERNAL_REVIEW: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    darkBg: "dark:bg-gray-800",
    darkText: "dark:text-gray-300",
  },
  CLIENT_REVIEW: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    darkBg: "dark:bg-yellow-900/40",
    darkText: "dark:text-yellow-200",
  },
  INTERVIEW_SCHEDULED: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    darkBg: "dark:bg-amber-900/40",
    darkText: "dark:text-amber-200",
  },
  AWAITING_FEEDBACK: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    darkBg: "dark:bg-blue-900/40",
    darkText: "dark:text-blue-200",
  },
  SELECTED: {
    bg: "bg-green-100",
    text: "text-green-800",
    darkBg: "dark:bg-green-900/40",
    darkText: "dark:text-green-200",
  },
  REJECTED: {
    bg: "bg-red-600",
    text: "text-white",
    darkBg: "dark:bg-red-600",
    darkText: "dark:text-white",
  },
  CANCELLED: {
    bg: "bg-red-900",
    text: "text-white",
    darkBg: "dark:bg-red-900",
    darkText: "dark:text-white",
  },
};
