"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function HelpSupportDialog({ open, onClose }: Props) {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function reset() {
    setTopic("");
    setMessage("");
    setFiles([]);
    setSuccess(false);
  }

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !message.trim()) {
      alert("Please complete all required fields.");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("topic", topic.trim());
      formData.append("message", message.trim());
      for (const file of files) {
        formData.append("files", file);
      }
      const res = await adminFetch("/api/auth/help-support", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Failed to send");
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send your message");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Help and Support</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4 px-5 py-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Thank you for your message. A member of the TIBOSX support team will be in touch with you shortly.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                What do you need help with? *
              </label>
              <input
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter your message *
              </label>
              <textarea
                required
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Files</label>
              <input
                type="file"
                multiple
                className="w-full text-sm text-gray-600"
                onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              />
              {files.length > 0 ? (
                <p className="mt-1 text-xs text-gray-500">{files.length} file(s) selected</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
