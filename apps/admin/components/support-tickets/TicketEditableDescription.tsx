"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { appAlert } from "@/lib/app-alert";

type Props = {
  description: string;
  disabled?: boolean;
  onSave: (description: string) => void | Promise<void>;
};

export function TicketEditableDescription({ description, disabled, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    if (disabled) return;
    setDraft(description);
    setEditing(true);
  }

  async function commit() {
    const next = draft.trim();
    if (!next) {
      appAlert("Description is required.");
      return;
    }
    if (next === description) {
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
    setDraft(description);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          maxLength={20000}
          disabled={saving}
          rows={8}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
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
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{description}</p>
      {!disabled ? (
        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800"
        >
          <Pencil className="h-4 w-4" />
          Edit description
        </button>
      ) : null}
    </div>
  );
}
