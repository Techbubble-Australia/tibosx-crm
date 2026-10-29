import { prisma } from "@techbubble/database";

const FALLBACK_PREFIX = "TKT";
const FALLBACK_DIGITS = 5;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTicketNumber(prefix: string, seq: number, digits: number): string {
  return `${prefix}-${String(seq).padStart(digits, "0")}`;
}

function maxSequenceForPrefix(ticketNumbers: string[], prefix: string): number {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`, "i");
  let max = 0;
  for (const ticketNumber of ticketNumbers) {
    const match = ticketNumber.match(pattern);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return max;
}

export async function nextTicketNumberForProject(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ticketPrefix: true, ticketNumberDigits: true },
  });
  const prefix = (project?.ticketPrefix?.trim() || FALLBACK_PREFIX).toUpperCase();
  const digits = project?.ticketNumberDigits ?? FALLBACK_DIGITS;
  if (digits < 1 || digits > 10) {
    throw new Error("INVALID_TICKET_NUMBER_DIGITS");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const tickets = await prisma.ticket.findMany({
      where: { projectId },
      select: { ticketNumber: true },
    });
    const nextSeq = maxSequenceForPrefix(
      tickets.map((row) => row.ticketNumber),
      prefix,
    ) + 1;
    const ticketNumber = formatTicketNumber(prefix, nextSeq, digits);
    const clash = await prisma.ticket.findFirst({
      where: { projectId, ticketNumber },
      select: { id: true },
    });
    if (!clash) return ticketNumber;
  }

  throw new Error("TICKET_NUMBER_ALLOCATION_FAILED");
}

/** Legacy global allocator when no project is linked (should be rare). */
export async function nextTicketNumber(): Promise<string> {
  const prefix = FALLBACK_PREFIX;
  const digits = FALLBACK_DIGITS;
  const tickets = await prisma.ticket.findMany({
    where: { projectId: null },
    select: { ticketNumber: true },
  });
  const nextSeq =
    maxSequenceForPrefix(
      tickets.map((row) => row.ticketNumber),
      prefix,
    ) + 1;
  return formatTicketNumber(prefix, nextSeq, digits);
}

export async function allocateTicketNumber(projectId: string | null | undefined): Promise<string> {
  if (projectId) return nextTicketNumberForProject(projectId);
  return nextTicketNumber();
}
