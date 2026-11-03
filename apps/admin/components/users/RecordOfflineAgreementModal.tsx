"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import type { AgreementRecordRow } from "@/components/users/UserAgreementsSection";

type TemplateOption = { id: string; name: string };

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (records: AgreementRecordRow[]) => void;
};

export function RecordOfflineAgreementModal({ userId, open, onClose, onSaved }: Props) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void adminFetch("/api/admin/credential-templates")
      .then((res) => res.json())
      .then((data) => {
        const rows = (data.data ?? []) as Array<{ id: string; name: string }>;
        setTemplates(rows.map((row) => ({ id: row.id, name: row.name })));
      })
      .catch(() => undefined);
  }, [open]);

  async function uploadDocument(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.ok
            ? "Upload failed"
            : "Document upload failed. If this persists, check API_URL and object storage on the server.",
        );
      }
      if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
      const url = readUploadImageUrlFromJson(json);
      if (!url) throw new Error("Upload failed");
      setDocumentUrl(url);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!templateId) {
      appAlert("Select an agreement template.");
      return;
    }
    if (!documentUrl) {
      appAlert("Upload the signed agreement document.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/agreements/offline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialTemplateId: templateId,
          documentUrl,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      const saveText = await res.text();
      let data: { data?: { agreementRecords?: AgreementRecordRow[] }; error?: string };
      try {
        data = JSON.parse(saveText) as typeof data;
      } catch {
        throw new Error("Failed to save agreement. The server returned an unexpected response.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved((data.data?.agreementRecords as AgreementRecordRow[]) ?? []);
      onClose();
    } catch (error) {
      appAlert(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Record offline agreement</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Add a signed contract that was completed outside TBOS (e.g. paper or email).
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Agreement template <span className="text-red-500">*</span></label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Select template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Signed document <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept=".pdf,image/*"
              disabled={uploading}
              onChange={(e) => void uploadDocument(e.target.files?.[0]).catch((err) => appAlert(err instanceof Error ? err.message : "Upload failed"))}
            />
            {uploading ? <p className="mt-1 text-xs text-gray-500">Uploading…</p> : null}
            {documentUrl ? <p className="mt-1 text-xs text-green-600">Document attached</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Start date</label>
              <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End date</label>
              <input type="date" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save agreement
          </button>
        </div>
      </div>
    </div>
  );
}
