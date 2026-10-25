"use client";

import { useState } from "react";

type Props = {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
};

export function TimesheetRejectDialog({ onCancel, onConfirm, saving }: Props) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) {
            alert("Reject reason is required.");
            return;
          }
          onConfirm(reason.trim());
        }}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reject timesheet</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please add a reason for rejection.</p>
        <textarea
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason"
          required
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </form>
    </div>
  );
}
