"use client";

import { useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { resolveDocumentHref } from "@/lib/media-url";

export type UserFileRow = { name: string; url: string };

type Props = {
  files: UserFileRow[];
  pinnedFiles?: UserFileRow[];
  onChange: (files: UserFileRow[]) => void;
  allowUpload?: boolean;
  allowRemove?: boolean;
};

export function AdminUserFilesField({
  files,
  pinnedFiles = [],
  onChange,
  allowUpload = true,
  allowRemove = true,
}: Props) {
  const pinned = pinnedFiles.filter((f) => f.url.trim());
  const hasAny = pinned.length > 0 || files.length > 0;
  const [uploading, setUploading] = useState(false);

  async function onUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await adminFetch("/api/upload/document", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Upload failed");
      const url = readUploadImageUrlFromJson(data);
      if (!url) throw new Error("Upload did not return a file URL");
      onChange([...files, { name: file.name, url }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Files</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            ID, address, and other uploads. Contracts and start/expiry dates are under Agreements.
          </p>
        </div>
        {allowUpload ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload file
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      {!hasAny ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {pinned.map((file, index) => (
            <li key={`pinned-${file.url}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a
                href={resolveDocumentHref(file.url)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {file.name}
              </a>
            </li>
          ))}
          {files.map((file, index) => (
            <li key={`${file.url}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <a
                href={resolveDocumentHref(file.url)}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {file.name || `File ${index + 1}`}
              </a>
              {allowRemove ? (
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  aria-label="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
