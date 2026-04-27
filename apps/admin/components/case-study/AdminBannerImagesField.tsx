"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass = "mb-2 block text-sm font-medium text-gray-900 dark:text-neutral-100";

type Props = {
  formKey: string;
  initialUrls: string[];
};

export function AdminBannerImagesField({ formKey, initialUrls }: Props) {
  const [urls, setUrls] = useState<string[]>(() => (initialUrls.length > 0 ? [...initialUrls] : [""]));

  function setAt(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function addRow() {
    setUrls((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  async function onFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await adminFetch("/api/upload/image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; data?: { url?: string } };
      if (!res.ok) {
        alert(json.error || "Upload failed");
        return;
      }
      const next = json.data?.url;
      if (next) setAt(index, next);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="col-span-2 space-y-4">
      <div>
        <p className={labelClass}>Banner images (detail page)</p>
        <p className="mb-3 text-xs text-gray-500 dark:text-neutral-400">
          First image is shown large; additional images appear as thumbnails below. If all are empty, the featured image is
          used. Paste URLs or upload files (JPEG, PNG, GIF, WebP).
        </p>
      </div>
      {urls.map((url, index) => (
        <div
          key={`${formKey}-banner-${index}`}
          className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/50"
        >
          <input type="hidden" name="bannerImages" value={url} readOnly />
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
              {index === 0 ? "Primary (large)" : `Thumbnail ${index}`}
            </span>
            {urls.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="inline-flex items-center gap-1 rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setAt(index, e.target.value)}
            className={inputClass}
            placeholder="https://…"
            aria-label={`Banner image ${index + 1}`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => void onFileChange(index, e)}
              className={
                "max-w-full text-sm text-gray-700 dark:text-neutral-300 " +
                "file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-gray-300 " +
                "file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-900 " +
                "file:shadow-sm hover:file:bg-gray-50 dark:file:border-neutral-600 dark:file:bg-neutral-800 dark:file:text-neutral-100"
              }
            />
          </div>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={url} alt="" className="mt-3 h-24 max-w-full rounded-lg border border-gray-200 object-cover dark:border-neutral-700" />
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
      >
        <Plus className="h-4 w-4" />
        Add another banner image
      </button>
    </div>
  );
}
