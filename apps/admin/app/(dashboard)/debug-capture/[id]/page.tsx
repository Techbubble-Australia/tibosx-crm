"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { appAlert } from "@/lib/app-alert";
import { useIsDevelopmentAppEnv } from "@/lib/use-is-development-app-env";
import { JsonTreePreview } from "@/components/debug/JsonTreePreview";
import { resolveAdminMediaPreviewUrl } from "@/lib/public-media-url";

type Detail = {
  id: string;
  ticketId: string;
  type: string;
  reportedEnvironment: string;
  userDescription: string;
  screenshotUrl: string | null;
  fullPayload: unknown;
  createdAt: string;
};

export default function DebugCaptureDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const isDev = useIsDevelopmentAppEnv();
  const router = useRouter();
  const [row, setRow] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDev) {
      router.replace("/");
      return;
    }
    void adminFetch(`/api/admin/debug-capture-tickets/${id}`)
      .then((res) => res.json())
      .then((data) => setRow(data.data as Detail))
      .finally(() => setLoading(false));
  }, [id, isDev, router]);

  if (!isDev) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!row) return <p className="text-gray-500">Not found.</p>;

  const shot = row.screenshotUrl ? resolveAdminMediaPreviewUrl(row.screenshotUrl) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/debug-capture" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </Link>
      <div>
        <h2 className="text-xl font-semibold">{row.ticketId}</h2>
        <p className="text-sm text-gray-500">
          {row.type} · {row.reportedEnvironment} · {new Date(row.createdAt).toLocaleString("en-AU")}
        </p>
      </div>
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
        {row.userDescription}
      </p>
      {shot ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot} alt="Screenshot" className="max-w-full rounded border border-gray-200 dark:border-gray-700" />
      ) : null}
      <JsonTreePreview value={row.fullPayload} />
      <button
        type="button"
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-600"
        onClick={() => {
          void navigator.clipboard.writeText(JSON.stringify(row.fullPayload, null, 2)).then(() => {
            appAlert("JSON copied.");
          });
        }}
      >
        Copy JSON
      </button>
    </div>
  );
}
