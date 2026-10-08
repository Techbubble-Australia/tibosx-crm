import { ticketingPrisma } from "@techbubble/ticketing-database";

export async function nextTicketNumber(): Promise<string> {
  const count = await ticketingPrisma.ticket.count();
  const seq = count + 1;
  return `TKT-${String(seq).padStart(5, "0")}`;
}
