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
  const [admin, customerById] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: tbosAdminUserId },
      select: { email: true, mappedClientContactId: true },
    }),
    prisma.customerUser.findUnique({
      where: { id: tbosAdminUserId },
      select: { email: true, mappedClientContactId: true },
    }),
  ]);

  const contactIds = new Set<string>();
  const contactEmails = new Set<string>();
  const adminEmail = admin?.email?.trim().toLowerCase() ?? null;

  if (admin?.mappedClientContactId) {
    contactIds.add(admin.mappedClientContactId);
  }
  if (customerById?.mappedClientContactId) {
    contactIds.add(customerById.mappedClientContactId);
  }
  if (adminEmail) {
    contactEmails.add(adminEmail);
  }
  if (customerById?.email?.trim()) {
    contactEmails.add(customerById.email.trim().toLowerCase());
  }

  const customer =
    customerById ??
    (adminEmail || admin?.mappedClientContactId
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
      : null);

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

/** TBOS login ids for the same person (customer user row + client admin user row). */
export async function resolveTbosClientUserIds(tbosUserId: string): Promise<string[]> {
  const ids = new Set<string>([tbosUserId]);

  const admin = await prisma.adminUser.findUnique({
    where: { id: tbosUserId },
    select: { email: true, mappedClientContactId: true },
  });
  const customer = admin
    ? null
    : await prisma.customerUser.findUnique({
        where: { id: tbosUserId },
        select: { email: true, mappedClientContactId: true },
      });

  const email = (admin?.email ?? customer?.email)?.trim().toLowerCase() ?? "";
  const mappedClientContactId = admin?.mappedClientContactId ?? customer?.mappedClientContactId ?? null;

  if (email) {
    const adminByEmail = await prisma.adminUser.findFirst({
      where: { active: true, role: "client", email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (adminByEmail) ids.add(adminByEmail.id);
    const customerByEmail = await prisma.customerUser.findFirst({
      where: { active: true, email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (customerByEmail) ids.add(customerByEmail.id);
  }

  if (mappedClientContactId) {
    const adminByContact = await prisma.adminUser.findFirst({
      where: { active: true, mappedClientContactId },
      select: { id: true },
    });
    if (adminByContact) ids.add(adminByContact.id);
    const customerByContact = await prisma.customerUser.findFirst({
      where: { active: true, mappedClientContactId },
      select: { id: true },
    });
    if (customerByContact) ids.add(customerByContact.id);
  }

  return [...ids];
}

/** Merge CRM contacts for a TBOS client session (handles customer-only and split admin/customer rows). */
export async function resolveLinkedTbosClientPortalIdentity(
  tbosUserId: string,
): Promise<TbosClientPortalIdentity> {
  const tbosIds = await resolveTbosClientUserIds(tbosUserId);
  const contactIds = new Set<string>();
  const contactEmails = new Set<string>();
  let adminEmail: string | null = null;

  for (const id of tbosIds) {
    const part = await resolveTbosClientPortalIdentity(id);
    if (!adminEmail && part.adminEmail) adminEmail = part.adminEmail;
    for (const cid of part.contactIds) contactIds.add(cid);
    for (const rowEmail of part.contactEmails) contactEmails.add(rowEmail);
  }

  return {
    adminEmail,
    contactIds: [...contactIds],
    contactEmails: [...contactEmails],
  };
}
