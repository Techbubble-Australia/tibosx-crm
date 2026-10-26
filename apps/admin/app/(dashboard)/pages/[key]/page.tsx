"use client";
import { appAlert, appConfirm } from "@/lib/app-alert";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SiteContentPayloadEditor } from "@/components/site-content/SiteContentPayloadEditor";
import {
  normalizeSiteContentPayload,
  isVisualSiteContentKey,
  serializeSiteContentForPersist,
} from "@/lib/site-content-normalize";
import { adminFetch } from "@/lib/admin-api";

interface SiteContentRecord {
  id: string;
  key: string;
  label: string;
  payload: unknown;
  updatedAt: string;
}

export default function EditSitePageDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const keyParam = params.key as string;
  const decodedKey = decodeURIComponent(keyParam);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [record, setRecord] = useState<SiteContentRecord | null>(null);
  const [label, setLabel] = useState("");
  const [payload, setPayload] = useState<unknown>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch(`/api/admin/site-content/${encodeURIComponent(decodedKey)}`);
        if (!res.ok) {
          setRecord(null);
          return;
        }
        const data = await res.json();
        const row = data.data as SiteContentRecord;
        setRecord(row);
        setLabel(row.label);
        setPayload(normalizeSiteContentPayload(row.key, row.payload));
      } catch (error) {
        console.error("Error loading site content:", error);
        setRecord(null);
      } finally {
        setIsFetching(false);
      }
    }
    void load();
  }, [decodedKey]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!record || payload === null) return;

    setIsLoading(true);
    try {
      const res = await adminFetch(`/api/admin/site-content/${encodeURIComponent(record.key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || record.key,
          payload: serializeSiteContentForPersist(record.key, payload),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/pages");
    } catch (error) {
      console.error(error);
      appAlert("Failed to save");
    } finally {
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!record) return;
    if (
      !(await appConfirm(
        `Delete "${record.key}"? The marketing site may show errors or fall back to defaults until this is restored.`,
      ))
    )
      return;
    try {
      const res = await adminFetch(`/api/admin/site-content/${encodeURIComponent(record.key)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/pages");
    } catch (error) {
      console.error(error);
      appAlert("Failed to delete");
    }
  }

  if (isFetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!record || payload === null) {
    return (
      <div className="text-gray-500">
        Document not found.{" "}
        <Link href="/pages" className="font-medium text-black underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/pages" className="rounded p-1.5 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Edit document</h2>
          <p className="font-mono text-sm text-gray-500">{record.key}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <p className="text-xs text-gray-500">Last updated: {new Date(record.updatedAt).toLocaleString()}</p>
        </section>

        <SiteContentPayloadEditor siteKey={record.key} payload={payload} onPayloadChange={setPayload} />

        {!isVisualSiteContentKey(record.key) ? (
          <p className="text-sm text-gray-600">
            This key has no structured editor in the admin UI yet. Add support in{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">SiteContentPayloadEditor</code>.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
          <Link
            href="/pages"
            className="inline-flex items-center rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => void onDelete()}
            className="ml-auto inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-6 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
