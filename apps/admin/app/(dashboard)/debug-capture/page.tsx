"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { useIsDebugToolsAppEnv } from "@/lib/use-is-debug-tools-app-env";
import { useRouter } from "next/navigation";
import { TablePagination } from "@/components/ui/TablePagination";
import { useListView } from "@/hooks/useListView";
import { buildSearchHaystack } from "@/lib/search-text";

type Row = {
  id: string;
  ticketId: string;
  type: string;
  reportedEnvironment: string;
  title?: string | null;
  userDescription: string;
  reporterEmail: string;
  currentUrl: string;
  createdAt: string;
};

export default function DebugCaptureListPage() {
  const isDebugTools = useIsDebugToolsAppEnv();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDebugTools) {
      router.replace("/");
      return;
    }
    void adminFetch("/api/admin/debug-capture-tickets?limit=100")
      .then((res) => res.json())
      .then((data) => setRows((data.data as Row[]) ?? []))
      .finally(() => setLoading(false));
  }, [isDebugTools, router]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    totalItems,
  } = useListView(
    rows,
    (row) =>
      buildSearchHaystack([row.ticketId, row.type, row.reportedEnvironment, row.reporterEmail, row.currentUrl, row.title]),
    { initialPageSize: 25, pageSizeOptions: [10, 25, 50, 100] },
  );

  if (!isDebugTools) return null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Debug captures</h2>
        <p className="text-sm text-gray-500">Tickets saved from debug mode (development only).</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-950/60">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Env</th>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">URL</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-3">
                  <Link href={`/debug-capture/${row.id}`} className="font-medium text-sky-600 hover:underline">
                    {row.ticketId}
                  </Link>
                  {row.title ? <p className="mt-0.5 max-w-xs truncate text-xs text-gray-600 dark:text-gray-400">{row.title}</p> : null}
                </td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.reportedEnvironment}</td>
                <td className="px-4 py-3">{row.reporterEmail}</td>
                <td className="max-w-xs truncate px-4 py-3" title={row.currentUrl}>
                  {row.currentUrl}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString("en-AU")}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No debug captures yet. Enable debug mode and click an element to create one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
}
