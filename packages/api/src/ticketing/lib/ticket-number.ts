import { prisma } from "@techbubble/database";

export async function nextTicketNumber(): Promise<string> {
  const count = await prisma.ticket.count();
  const seq = count + 1;
  return `TKT-${String(seq).padStart(5, "0")}`;
}
