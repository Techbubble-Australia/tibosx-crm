"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";

export function EmptyTickets() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-300" />
      <p className="font-medium text-slate-700 dark:text-gray-200">No tickets yet</p>
      <p className="mt-1 text-sm">Submit a request and our team will respond shortly.</p>
      <Link
        href="/workspace/tickets/new"
        className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        Create ticket
      </Link>
    </div>
  );
}
