"use client";

import { normalizeTicketStatusKey } from "@/lib/support-ticket-labels";

type Props = {
  notes: string;
  status: string;
  canEdit: boolean;
  disabled?: boolean;
  onNotesChange?: (value: string) => void;
  onSaveDraft?: () => void | Promise<void>;
  showSaveDraft?: boolean;
};

export function TicketResolutionNotesSection({
  notes,
  status,
  canEdit,
  disabled,
  onNotesChange,
  onSaveDraft,
  showSaveDraft,
}: Props) {
  const statusKey = normalizeTicketStatusKey(status);
  const showEmptyHint =
    !notes.trim() &&
    (statusKey === "RESOLVED" || statusKey === "CLOSED" || statusKey === "IN_PROGRESS");

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-2 font-semibold">Resolution notes</h2>
      {canEdit ? (
        <div className="space-y-2">
          <textarea
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Describe how this ticket was resolved…"
            value={notes}
            disabled={disabled}
            onChange={(e) => onNotesChange?.(e.target.value)}
          />
          {showSaveDraft ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void onSaveDraft?.()}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600"
            >
              Save resolution notes
            </button>
          ) : null}
        </div>
      ) : notes.trim() ? (
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{notes}</p>
      ) : showEmptyHint ? (
        <p className="text-sm text-gray-500">No resolution notes yet.</p>
      ) : (
        <p className="text-sm text-gray-500">—</p>
      )}
    </section>
  );
}
