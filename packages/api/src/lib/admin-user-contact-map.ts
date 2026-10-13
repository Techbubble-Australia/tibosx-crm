import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";

export function rolesIncludeClient(primary: string, additional?: unknown): boolean {
  return effectiveRoleList(primary, additional).includes("client");
}

export async function assertMappedContactAvailable(
  contactId: string,
  excludeUserId?: string,
): Promise<string | null> {
  const contact = await prisma.clientContact.findUnique({
    where: { id: contactId },
    include: { client: { select: { name: true } } },
  });
  if (!contact) return "Contact record not found";

  const taken = await prisma.adminUser.findFirst({
    where: {
      mappedClientContactId: contactId,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, email: true },
  });
  if (taken) {
    return `Another user (${taken.email}) is already mapped to this contact`;
  }
  return null;
}
