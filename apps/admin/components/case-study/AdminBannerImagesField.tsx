"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Info, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { resolveAdminMediaPreviewUrl } from "@/lib/public-media-url";
import { readUploadImageUrlFromJson } from "@/lib/upload-response";

type Props = {
  formKey: string;
  initialUrls: string[];
};

export function AdminBannerImagesField({ formKey, initialUrls }: Props) {
  const [urls, setUrls] = useState<string[]>(() => (initialUrls.length > 0 ? [...initialUrls] : [""]));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const initialSig = initialUrls.join("\0");
  useEffect(() => {
    setUrls(initialUrls.length > 0 ? [...initialUrls] : [""]);
  }, [formKey, initialSig]);

  const primary = urls[0] ?? "";
  const thumbnails = urls.slice(1);

  function setAt(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function addThumbnail() {
    setUrls((prev) => [...prev, ""]);
  }

  function removeAt(index: number) {
    setUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  async function onFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIndex(index);
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
      if (next) setAt(index, next);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingIndex(null);
      e.target.value = "";
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10";

  const fileInputClass = "sr-only";

  return (
    <div className="col-span-2 space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-gradient-to-b from-neutral-50/80 to-white p-5 shadow-sm">
        <div className="mb-4 flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <ImagePlus className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-neutral-900">Detail page banner</h4>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Same layout as the live site: one wide image up top, then optional smaller thumbnails. Leave everything
              empty to fall back to the <span className="font-medium text-neutral-800">featured</span> image.
            </p>
          </div>
        </div>

        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs text-blue-900"
          role="note"
        >
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          <span>JPEG, PNG, GIF, or WebP. You can paste a URL or use Upload — the preview updates as you go.</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 bg-neutral-50/90 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Primary — full width on the site
            </span>
          </div>
          <div className="p-4">
            <input type="hidden" name="bannerImages" value={primary} readOnly />

            <div
              className={
                "relative mb-4 overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 " +
                (primary ? "border-solid border-neutral-200" : "")
              }
              style={{ aspectRatio: "1136 / 307", maxHeight: "200px" }}
            >
              {primary ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview
                <img
                  key={primary}
                  src={resolveAdminMediaPreviewUrl(primary)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => {
                    console.warn("[AdminBannerImagesField] preview failed for", resolveAdminMediaPreviewUrl(primary));
                  }}
                />
              ) : (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-4 text-center text-neutral-500">
                  <LayoutPlaceholder />
                  <span className="text-xs">Preview appears after you add an image</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 overflow-x-auto">
                <label className="mb-1.5 block text-xs font-medium text-neutral-700">Image URL</label>
                <input
                  type="text"
                  value={primary}
                  onChange={(e) => setAt(0, e.target.value)}
                  className={`${inputClass} min-w-[min(100%,24rem)] font-mono text-xs`}
                  placeholder="https://… or /uploads/…"
                  spellCheck={false}
                  aria-label="Primary banner image URL"
                />
              </div>
              <div className="flex shrink-0 gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50">
                  {uploadingIndex === 0 ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden />
                  )}
                  {uploadingIndex === 0 ? "Uploading…" : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className={fileInputClass}
                    onChange={(e) => void onFileChange(0, e)}
                  />
                </label>
                {primary ? (
                  <button
                    type="button"
                    onClick={() => setAt(0, "")}
                    className="rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Extra images — thumbnail row on the site
              </span>
              <p className="mt-0.5 text-xs text-neutral-500">
                Optional. Visitors tap a thumbnail to swap the large image.
              </p>
            </div>
            <button
              type="button"
              onClick={addThumbnail}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add thumbnail
            </button>
          </div>

          {thumbnails.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 bg-white/60 px-4 py-6 text-center text-xs text-neutral-500">
              No extra images yet. Use &ldquo;Add thumbnail&rdquo; when you want a gallery below the main banner.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {thumbnails.map((url, tIdx) => {
                const index = tIdx + 1;
                return (
                  <li
                    key={`${formKey}-banner-thumb-${index}`}
                    className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
                  >
                    <input type="hidden" name="bannerImages" value={url} readOnly />
                    <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                      <span className="text-xs font-medium text-neutral-600">Thumbnail {tIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Remove thumbnail"
                        aria-label={`Remove thumbnail ${tIdx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-md bg-neutral-100">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin preview
                          <img
                            key={url}
                            src={resolveAdminMediaPreviewUrl(url)}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={() => {
                              console.warn(
                                "[AdminBannerImagesField] thumbnail preview failed for",
                                resolveAdminMediaPreviewUrl(url),
                              );
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setAt(index, e.target.value)}
                          className={`${inputClass} min-w-[min(100%,18rem)] font-mono text-xs`}
                          placeholder="Image URL or /uploads/…"
                          spellCheck={false}
                          aria-label={`Thumbnail ${tIdx + 1} URL`}
                        />
                      </div>
                      <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                        {uploadingIndex === index ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Upload className="h-3.5 w-3.5" aria-hidden />
                        )}
                        {uploadingIndex === index ? "Uploading…" : "Upload file"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          className={fileInputClass}
                          onChange={(e) => void onFileChange(index, e)}
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function LayoutPlaceholder() {
  return (
    <svg
      className="h-10 w-14 text-neutral-300"
      viewBox="0 0 56 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="1" y="1" width="54" height="38" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <path
        d="M16 26l6-8 5 6 5-7 8 11H16z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      <circle cx="22" cy="14" r="2.5" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
