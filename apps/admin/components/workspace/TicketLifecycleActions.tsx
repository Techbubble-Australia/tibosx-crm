"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Props = {
  status: string;
  role: string;
  isCreator: boolean;
  disabled?: boolean;
  resolutionNotes?: string;
  onAction: (action: string, payload?: { resolutionNotes?: string }) => void | Promise<void>;
};

const LIFECYCLE_CONFIRM: Partial<Record<string, string>> = {
  close: "Do you want to close this ticket?",
  cancel: "Do you want to cancel this ticket?",
};

export function TicketLifecycleActions({
  status,
  role,
  isCreator,
  disabled,
  resolutionNotes = "",
  onAction,
}: Props) {
  const statusKey = normalizeTicketStatusKey(status);
  const isConsultant = role === "CONSULTANT";
  const isClient = role === "CLIENT";
  const canConsultantAct = isConsultant && !isCreator;
  const canStartWork = isConsultant && (statusKey === "OPEN" || statusKey === "DRAFT");

  const buttons: { action: string; label: string; show: boolean }[] = [
    { action: "reopen", label: "Re-open", show: isClient && statusKey === "RESOLVED" },
    {
      action: "start_work",
      label: "Start work",
      show: canStartWork,
    },
    {
      action: "client_info_needed",
      label: "Client info needed",
      show: canConsultantAct && statusKey === "IN_PROGRESS",
    },
    { action: "resolve", label: "Resolve", show: canConsultantAct && statusKey === "IN_PROGRESS" },
    { action: "close", label: "Close", show: isClient && statusKey === "RESOLVED" },
    {
      action: "cancel",
      label: "Cancel",
      show:
        isClient &&
        (statusKey === "DRAFT" ||
          statusKey === "OPEN" ||
          statusKey === "IN_PROGRESS" ||
          statusKey === "PENDING_CLIENT"),
    },
  ];

  const visible = buttons.filter((b) => b.show);

  if (!visible.length) return null;

  async function runAction(action: string) {
    if (action === "resolve") {
      const notes = resolutionNotes.trim();
      if (!notes) {
        appAlert("Resolution notes are mandatory before the ticket is resolved");
        return;
      }
      if (!(await appConfirm("Do you want to mark this ticket as resolved?"))) return;
      void onAction(action, { resolutionNotes: notes });
      return;
    }
    const message = LIFECYCLE_CONFIRM[action];
    if (message && !(await appConfirm(message))) return;
    void onAction(action);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((b) => (
        <button
          key={b.action}
          type="button"
          disabled={disabled}
          onClick={() => void runAction(b.action)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
