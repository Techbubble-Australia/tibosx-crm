"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { resolveAdminMediaPreviewUrl } from "@/lib/public-media-url";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  /** When set with {@link onValueChange}, the field is controlled (recommended for JSON submit). */
  value?: string;
  onValueChange?: (url: string) => void;
  className?: string;
  labelClassName?: string;
  helpText?: string;
};

export function AdminImageField({
  name,
  label,
  defaultValue = "",
  value: valueProp,
  onValueChange,
  className = "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black",
  labelClassName = "mb-2 block text-sm font-medium text-gray-900",
  helpText = "Paste a URL or choose a file to upload (JPEG, PNG, GIF, WebP).",
}: Props) {
  const isControlled = valueProp !== undefined;
  const [internalUrl, setInternalUrl] = useState(defaultValue);

  useEffect(() => {
    if (!isControlled) {
      setInternalUrl(defaultValue ?? "");
    }
  }, [defaultValue, isControlled]);

  const url = isControlled ? (valueProp ?? "") : internalUrl;

  function setUrl(next: string) {
    if (isControlled) {
      onValueChange?.(next);
    } else {
      setInternalUrl(next);
    }
  }

  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await adminFetch("/api/upload/image", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const err =
          json && typeof json === "object" && "error" in json
            ? String((json as { error?: unknown }).error)
            : "";
        alert(err || "Upload failed");
        return;
      }
      const next = readUploadImageUrlFromJson(json);
      if (next) setUrl(next);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className={labelClassName}>{label}</label>
      <p className="mb-2 text-xs text-gray-500">{helpText}</p>
      <input type="hidden" name={name} value={url} readOnly />
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className={className}
        placeholder="https://… or /uploads/…"
        aria-label={label}
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => void onFileChange(e)}
          className={
            "max-w-full text-sm text-gray-700 " +
            "file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-gray-300 " +
            "file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-900 " +
            "file:shadow-sm hover:file:bg-gray-50"
          }
        />
        {uploading ? <span className="text-xs text-gray-500">Uploading…</span> : null}
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URLs
        <img
          key={url}
          src={resolveAdminMediaPreviewUrl(url)}
          alt=""
          className="mt-3 h-28 max-w-full rounded-lg border border-gray-200 object-cover"
          onError={() => {
            console.warn("[AdminImageField] preview failed for", resolveAdminMediaPreviewUrl(url));
          }}
        />
      ) : null}
    </div>
  );
}
