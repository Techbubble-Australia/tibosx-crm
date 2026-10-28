import { prisma } from "@techbubble/database";
import { ensureSupportOrganizationForProject } from "../../lib/support-organization.js";
import { provisionClientPortalUser } from "../../lib/support-project.js";

const portalAccessOr = [{ portalAccess: true }, { canApproveTimesheets: true }];

/** Link portal / approver client contacts to this ticketing user when CRM email matches. */
export async function ensureClientPortalContactLinks(
  ticketingUserId: string,
  emails: string[],
): Promise<void> {
  const normalized = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (!normalized.length) return;

  const pending = await prisma.projectClientContact.findMany({
    where: {
      OR: portalAccessOr,
      project: { status: "ACTIVE" },
      contact: {
        OR: normalized.map((email) => ({
          email: { equals: email, mode: "insensitive" as const },
        })),
      },
      NOT: { ticketingUserId },
    },
    include: {
      project: { select: { id: true, supportOrganization: { select: { id: true } } } },
    },
  });

  for (const row of pending) {
    const orgId =
      row.project.supportOrganization?.id ??
      (await ensureSupportOrganizationForProject(row.project.id)).id;
    await provisionClientPortalUser(row.id, orgId);
  }
}

/** Link approver-only client contacts to this ticketing user by email when missing. */
export async function ensureClientApproverContactLinks(
  ticketingUserId: string,
  email: string,
): Promise<Array<{ id: string }>> {
  await ensureClientPortalContactLinks(ticketingUserId, [email]);

  return prisma.projectClientContact.findMany({
    where: { ticketingUserId, canApproveTimesheets: true },
    select: { id: true },
  });
}

/** Project IDs a portal client can view timesheets for (org link + project client contacts). */
export async function resolveClientTimesheetProjectIds(
  ticketingUserId: string,
  organizationId: string | null,
): Promise<string[]> {
  const ids = new Set<string>();

  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { projectId: true },
    });
    if (org?.projectId) ids.add(org.projectId);
  }

  const links = await prisma.projectClientContact.findMany({
    where: { ticketingUserId },
    select: { projectId: true },
  });
  for (const link of links) {
    ids.add(link.projectId);
  }

  return [...ids];
}
