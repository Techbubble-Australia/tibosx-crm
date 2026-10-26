"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useState } from "react";
import { Pencil } from "lucide-react";

type Props = {
  subject: string;
  disabled?: boolean;
  onSave: (subject: string) => void | Promise<void>;
};

export function TicketEditableSubject({ subject, disabled, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subject);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    if (disabled) return;
    setDraft(subject);
    setEditing(true);
  }

  async function commit() {
    const next = draft.trim();
    if (!next) {
      appAlert("Subject is required.");
      return;
    }
    if (next === subject) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(subject);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={draft}
          maxLength={300}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-lg font-semibold dark:border-gray-600 dark:bg-gray-800"
          autoFocus
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => void commit()}
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
        >
          Save
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={cancel}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{subject}</h1>
      {!disabled ? (
        <button
          type="button"
          onClick={startEdit}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800"
          aria-label="Edit subject"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
