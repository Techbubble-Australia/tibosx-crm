"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { TICKET_STATUS_LABELS } from "@/lib/support-ticket-labels";

type TicketRow = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  updatedAt: string;
};

type Props = {
  projectId: string;
};

export function ProjectTicketsSection({ projectId }: Props) {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void adminFetch(`/api/admin/projects/${projectId}/tickets`)
      .then((r) => r.json())
      .then((data) => setRows((data.data as TicketRow[]) ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Tickets</h3>
      {loading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets have been raised for this project yet.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500 dark:border-gray-800">
              <th className="py-2 pr-4">Ticket</th>
              <th className="py-2 pr-4">Subject</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 dark:border-gray-800">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/support-tickets/${row.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                    {row.ticketNumber}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.subject}</td>
                <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">
                  {TICKET_STATUS_LABELS[row.status as keyof typeof TICKET_STATUS_LABELS] ?? row.status}
                </td>
                <td className="py-2 text-gray-500">
                  {new Date(row.updatedAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
