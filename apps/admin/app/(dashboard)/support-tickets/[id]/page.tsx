"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";

type TicketDetail = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  organization?: { name: string };
  messages: { id: string; body: string; isInternal: boolean; createdAt: string; author: { name: string } }[];
  attachments: { id: string; fileName: string; fileUrl: string }[];
};

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);

  useEffect(() => {
    void adminFetch(`/api/admin/ticketing/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => setTicket(data.data as TicketDetail));
  }, [id]);

  if (!ticket) {
    return <p className="text-gray-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/support-tickets" className="text-sm text-blue-600 hover:underline">← All tickets</Link>
      <div>
        <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
        <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        {ticket.organization ? <p className="text-sm text-gray-500">{ticket.organization.name}</p> : null}
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
      </section>
      {ticket.attachments.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-2 font-semibold">Attachments</h2>
          <ul className="space-y-1 text-sm text-blue-600">
            {ticket.attachments.map((a) => (
              <li key={a.id}>
                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.fileName}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 font-semibold">Conversation</h2>
        <ul className="space-y-3">
          {ticket.messages.map((m) => (
            <li key={m.id} className={`rounded-lg p-3 text-sm ${m.isInternal ? "bg-amber-50 dark:bg-amber-950/30" : "bg-gray-50 dark:bg-gray-800"}`}>
              <p className="text-xs text-gray-500">{m.author.name} · {new Date(m.createdAt).toLocaleString()}{m.isInternal ? " · Internal" : ""}</p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
