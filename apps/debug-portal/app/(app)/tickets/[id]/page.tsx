"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TicketDetailView } from "@/components/TicketDetailView";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  /** "Back" returns to the Tickets list only when opened from it; otherwise (board, new ticket) to the Board. */
  const [cameFromList, setCameFromList] = useState(false);
  useEffect(() => {
    setCameFromList(new URLSearchParams(window.location.search).get("from") === "list");
  }, []);

  return (
    <TicketDetailView
      id={id}
      backHref={cameFromList ? "/tickets" : "/board"}
      backLabel={cameFromList ? "All tickets" : "Board"}
      onDeleted={() => router.push(cameFromList ? "/tickets" : "/board")}
    />
  );
}
