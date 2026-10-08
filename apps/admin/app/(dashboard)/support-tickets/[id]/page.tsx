"use client";

import { useParams } from "next/navigation";
import { SupportTicketDetail } from "@/components/support-tickets/SupportTicketDetail";

export default function SupportTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  return <SupportTicketDetail ticketId={id} />;
}
