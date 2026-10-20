import { prisma } from "@techbubble/database";

function addEmail(set: Set<string>, value: string | null | undefined, exclude: Set<string>) {
  const email = value?.trim();
  if (!email) return;
  const key = email.toLowerCase();
  if (exclude.has(key)) return;
  set.add(email);
}

/** PM, project members, and client contacts with portal access (tick = portalAccess). */
export async function resolveProjectTicketNotificationEmails(
  projectId: string,
  options?: { excludeEmails?: string[] },
): Promise<string[]> {
  const exclude = new Set((options?.excludeEmails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean));
  const emails = new Set<string>();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      projectManager: { select: { email: true, active: true } },
      members: {
        include: {
          adminUser: { select: { email: true, active: true } },
          profile: { select: { email: true } },
        },
      },
      clientContacts: {
        where: { portalAccess: true },
        include: {
          contact: { select: { email: true } },
          ticketingUser: { select: { email: true } },
        },
      },
    },
  });
  if (!project) return [];

  if (project.projectManager?.active) {
    addEmail(emails, project.projectManager.email, exclude);
  }

  for (const member of project.members) {
    if (member.adminUser?.active) {
      addEmail(emails, member.adminUser.email, exclude);
    } else {
      addEmail(emails, member.profile?.email, exclude);
    }
  }

  for (const link of project.clientContacts) {
    addEmail(emails, link.ticketingUser?.email ?? link.contact.email, exclude);
  }

  return [...emails];
}

export async function resolveTicketProjectIdForNotifications(ticketId: string): Promise<string | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      projectId: true,
      organization: { select: { projectId: true } },
    },
  });
  if (!ticket) return null;
  return ticket.projectId ?? ticket.organization?.projectId ?? null;
}
