"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";
import { UserAvatar } from "@/components/UserAvatar";

type Props = {
  name: string | null;
  email: string;
  photoUrl: string | null;
  onChange: (url: string | null) => void;
};

export function UserPhotoField({ name, email, photoUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await adminFetch("/api/upload/image", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
      const url = readUploadImageUrlFromJson(json);
      if (!url) throw new Error("Upload failed");
      onChange(url);
    } catch (e) {
      appAlert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <UserAvatar name={name} email={email} photoUrl={photoUrl} size="md" className="!h-16 !w-16 !text-lg" />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Upload photo
        </button>
        {photoUrl ? (
          <button
            type="button"
            className="block text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={() => onChange(null)}
          >
            Remove photo
          </button>
        ) : (
          <p className="text-xs text-gray-500">Default avatar is used until you upload a photo.</p>
        )}
      </div>
    </div>
  );
}
