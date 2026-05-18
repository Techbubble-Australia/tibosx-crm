"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteContentPayloadEditor } from "@/components/site-content/SiteContentPayloadEditor";
import {
  SITE_CONTENT_FORM_KEYS,
  SITE_CONTENT_KEY_LABELS,
  normalizeSiteContentPayload,
  isVisualSiteContentKey,
  serializeSiteContentForPersist,
  type SiteContentFormKey,
} from "@/lib/site-content-normalize";
import { adminFetch } from "@/lib/admin-api";

const KEY_RE = /^[a-z][a-z0-9_]*$/;

export default function NewSitePageDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<SiteContentFormKey>("marketing_home");
  const [customKey, setCustomKey] = useState("");
  const [label, setLabel] = useState("");
  const [payload, setPayload] = useState<unknown>(() => normalizeSiteContentPayload("marketing_home", {}));

  const effectiveKey = customKey.trim() || selectedTemplate;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("template");
    if (q && isVisualSiteContentKey(q)) {
      setSelectedTemplate(q);
      setCustomKey("");
    }
  }, []);

  useEffect(() => {
    setPayload(normalizeSiteContentPayload(effectiveKey, {}));
  }, [effectiveKey]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setKeyError("");
    const keyRaw = customKey.trim() || selectedTemplate;

    if (!KEY_RE.test(keyRaw)) {
      setKeyError("Use lowercase letters, numbers, and underscores only (e.g. services_page).");
      return;
    }

    if (!isVisualSiteContentKey(keyRaw)) {
      setKeyError("Key must be one of the template ids with a visual editor.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/site-content/${encodeURIComponent(keyRaw)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || keyRaw,
          payload: serializeSiteContentForPersist(keyRaw, payload),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Save failed");
      }
      router.push("/pages");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/pages" className="rounded p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">New site document</h2>
          <p className="text-sm text-gray-500">Pick a template, edit defaults, then save.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Template / key</label>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value as SiteContentFormKey);
                  setCustomKey("");
                }}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SITE_CONTENT_FORM_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k} — {SITE_CONTENT_KEY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Human-readable title"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Override key (optional)</label>
            <input
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder={`Default: ${selectedTemplate}`}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {keyError ? <p className="mt-1 text-xs text-red-600">{keyError}</p> : null}
            <p className="mt-1 text-xs text-gray-500">
              Override must still be a supported template id (same list as the dropdown).
            </p>
          </div>
        </section>

        <SiteContentPayloadEditor siteKey={effectiveKey} payload={payload} onPayloadChange={setPayload} />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
          <Link
            href="/pages"
            className="inline-flex items-center rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
