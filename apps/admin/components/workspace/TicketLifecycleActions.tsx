"use client";

import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Props = {
  status: string;
  role: string;
  isCreator: boolean;
  disabled?: boolean;
  resolutionNotes?: string;
  onResolutionNotesChange?: (value: string) => void;
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
  onResolutionNotesChange,
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
  const showResolutionField = canConsultantAct && statusKey === "IN_PROGRESS";

  if (!visible.length && !showResolutionField) return null;

  function runAction(action: string) {
    if (action === "resolve") {
      const notes = resolutionNotes.trim();
      if (!notes) {
        alert("Resolution notes are mandatory before the ticket is resolved");
        return;
      }
      if (!window.confirm("Do you want to mark this ticket as resolved?")) return;
      void onAction(action, { resolutionNotes: notes });
      return;
    }
    const message = LIFECYCLE_CONFIRM[action];
    if (message && !window.confirm(message)) return;
    void onAction(action);
  }

  return (
    <div className="space-y-3">
      {showResolutionField ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Resolution notes</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Describe how this ticket was resolved…"
            value={resolutionNotes}
            disabled={disabled}
            onChange={(e) => onResolutionNotesChange?.(e.target.value)}
          />
        </div>
      ) : null}
      {visible.length ? (
        <div className="flex flex-wrap gap-2">
          {visible.map((b) => (
            <button
              key={b.action}
              type="button"
              disabled={disabled}
              onClick={() => runAction(b.action)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
