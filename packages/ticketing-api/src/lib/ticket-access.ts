import { ticketingPrisma } from "@techbubble/ticketing-database";
import type { TicketingAuthUser } from "../middleware/auth.js";

const TBOS_ADMIN_ROLES = new Set(["admin"]);

export function isTbosAdmin(user: TicketingAuthUser & { tbosRole?: string | null }): boolean {
  if (user.role !== "CONSULTANT" || !user.consultantVerified) return false;
  const role = (user.tbosRole || "").trim().toLowerCase();
  return TBOS_ADMIN_ROLES.has(role);
}

export async function assignedOrganizationIds(consultantUserId: string): Promise<string[]> {
  const rows = await ticketingPrisma.consultantOrganization.findMany({
    where: { consultantId: consultantUserId },
    select: { organizationId: true },
  });
  return rows.map((r) => r.organizationId);
}

export async function ticketOrganizationFilter(
  user: TicketingAuthUser & { tbosRole?: string | null },
): Promise<{ organizationId?: string | { in: string[] } } | "deny"> {
  if (user.role === "CLIENT") {
    if (!user.organizationId) return "deny";
    return { organizationId: user.organizationId };
  }
  if (user.role === "CONSULTANT" && user.consultantVerified) {
    if (isTbosAdmin(user)) return {};
    const orgIds = await assignedOrganizationIds(user.id);
    if (orgIds.length === 0) return { organizationId: { in: [] } };
    return { organizationId: { in: orgIds } };
  }
  return "deny";
}

export async function canAccessTicketOrganization(
  user: TicketingAuthUser & { tbosRole?: string | null },
  organizationId: string,
): Promise<boolean> {
  const filter = await ticketOrganizationFilter(user);
  if (filter === "deny") return false;
  if (!filter.organizationId) return true;
  if (typeof filter.organizationId === "string") return filter.organizationId === organizationId;
  return filter.organizationId.in.includes(organizationId);
}
