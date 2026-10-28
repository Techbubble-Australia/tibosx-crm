import { prisma } from "@techbubble/database";

export type TbosClientPortalIdentity = {
  adminEmail: string | null;
  contactIds: string[];
  contactEmails: string[];
};

/** Client contacts and emails tied to a TBOS client admin (admin + customer user + CRM contacts). */
export async function resolveTbosClientPortalIdentity(
  tbosAdminUserId: string,
): Promise<TbosClientPortalIdentity> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: tbosAdminUserId },
    select: { email: true, mappedClientContactId: true },
  });

  const contactIds = new Set<string>();
  const contactEmails = new Set<string>();
  const adminEmail = admin?.email?.trim().toLowerCase() ?? null;

  if (admin?.mappedClientContactId) {
    contactIds.add(admin.mappedClientContactId);
  }
  if (adminEmail) {
    contactEmails.add(adminEmail);
  }

  const customer =
    adminEmail || admin?.mappedClientContactId
      ? await prisma.customerUser.findFirst({
          where: {
            OR: [
              ...(admin?.mappedClientContactId
                ? [{ mappedClientContactId: admin.mappedClientContactId }]
                : []),
              ...(adminEmail
                ? [{ email: { equals: adminEmail, mode: "insensitive" as const } }]
                : []),
            ],
          },
          select: { mappedClientContactId: true, email: true },
        })
      : null;

  if (customer?.mappedClientContactId) {
    contactIds.add(customer.mappedClientContactId);
  }
  if (customer?.email?.trim()) {
    contactEmails.add(customer.email.trim().toLowerCase());
  }

  if (contactEmails.size > 0) {
    const contacts = await prisma.clientContact.findMany({
      where: {
        OR: [...contactEmails].map((email) => ({
          email: { equals: email, mode: "insensitive" as const },
        })),
      },
      select: { id: true, email: true },
    });
    for (const row of contacts) {
      contactIds.add(row.id);
      contactEmails.add(row.email.trim().toLowerCase());
    }
  }

  if (contactIds.size > 0) {
    const byId = await prisma.clientContact.findMany({
      where: { id: { in: [...contactIds] } },
      select: { id: true, email: true },
    });
    for (const row of byId) {
      contactEmails.add(row.email.trim().toLowerCase());
    }
  }

  return {
    adminEmail,
    contactIds: [...contactIds],
    contactEmails: [...contactEmails],
  };
}
