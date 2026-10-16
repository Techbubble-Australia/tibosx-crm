import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@techbubble/database";
import { ensureSupportOrganizationForProject } from "./support-organization";
import { notifyAsync } from "./notifications";

export const PROJECT_KINDS = ["DELIVERY", "SUPPORT"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export async function ensureProjectSupportGroup(projectId: string) {
  return prisma.projectSupportGroup.upsert({
    where: { projectId },
    create: { projectId, name: "Support team" },
    update: {},
  });
}

export async function syncProjectClientContacts(
  projectId: string,
  rows: Array<{ contactId: string; portalAccess: boolean; canApproveTimesheets: boolean }>,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, kind: true, clientId: true, supportOrganization: { select: { id: true } } },
  });
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const contactIds = rows.map((r) => r.contactId);
  const validContacts = await prisma.clientContact.findMany({
    where: { id: { in: contactIds }, clientId: project.clientId },
    select: { id: true },
  });
  const validSet = new Set(validContacts.map((c) => c.id));

  const keepIds = rows.filter((r) => validSet.has(r.contactId)).map((r) => r.contactId);

  await prisma.$transaction(async (tx) => {
    await tx.projectClientContact.deleteMany({
      where: keepIds.length ? { projectId, contactId: { notIn: keepIds } } : { projectId },
    });
    for (const row of rows) {
      if (!validSet.has(row.contactId)) continue;
      await tx.projectClientContact.upsert({
        where: { projectId_contactId: { projectId, contactId: row.contactId } },
        create: {
          projectId,
          contactId: row.contactId,
          portalAccess: row.portalAccess,
          canApproveTimesheets: row.canApproveTimesheets,
        },
        update: {
          portalAccess: row.portalAccess,
          canApproveTimesheets: row.canApproveTimesheets,
        },
      });
    }
  });

  let orgId = project.supportOrganization?.id;
  if (!orgId) {
    const org = await ensureSupportOrganizationForProject(projectId);
    orgId = org.id;
  }

  const links = await prisma.projectClientContact.findMany({
    where: { projectId },
    include: { contact: true },
  });

  for (const link of links) {
    if (!link.portalAccess) continue;
    await provisionClientPortalUser(link.id, orgId);
  }
}

export async function provisionClientPortalUser(projectClientContactId: string, organizationId: string) {
  const link = await prisma.projectClientContact.findUnique({
    where: { id: projectClientContactId },
    include: { contact: true },
  });
  if (!link || !link.portalAccess) return;

  const email = link.contact.email.trim().toLowerCase();
  const name = link.contact.name.trim();
  const tempPassword = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const existing = await prisma.ticketingUser.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.ticketingUser.create({
      data: {
        email,
        name,
        passwordHash,
        role: "CLIENT",
        organizationId,
        active: true,
      },
    }));

  const updated =
    existing
      ? await prisma.ticketingUser.update({
          where: { id: existing.id },
          data: {
            name,
            role: "CLIENT",
            organizationId,
            active: true,
          },
        })
      : user;

  await prisma.projectClientContact.update({
    where: { id: link.id },
    data: { ticketingUserId: updated.id },
  });

  return { email, temporaryPassword: existing ? undefined : tempPassword };
}

export async function setProjectSupportGroupMembers(projectId: string, projectMemberIds: string[]) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, kind: true },
  });
  if (!project || project.kind !== "SUPPORT") {
    throw new Error("NOT_SUPPORT_PROJECT");
  }

  const group = await ensureProjectSupportGroup(projectId);
  const members = await prisma.projectMember.findMany({
    where: { projectId, id: { in: projectMemberIds } },
    select: { id: true },
  });
  const validIds = new Set(members.map((m) => m.id));

  const keepIds = projectMemberIds.filter((id) => validIds.has(id));

  await prisma.$transaction(async (tx) => {
    await tx.projectSupportGroupMember.deleteMany({
      where: keepIds.length
        ? { groupId: group.id, projectMemberId: { notIn: keepIds } }
        : { groupId: group.id },
    });
    for (const memberId of projectMemberIds) {
      if (!validIds.has(memberId)) continue;
      await tx.projectSupportGroupMember.upsert({
        where: { projectMemberId: memberId },
        create: { groupId: group.id, projectMemberId: memberId },
        update: { groupId: group.id },
      });
    }
  });
}

/** After TBOS credentials for a project member, link consultant portal access for support projects. */
export async function provisionSupportMemberConsultant(projectId: string, adminUserId: string, projectMemberId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { kind: true, supportOrganization: { select: { id: true } } },
  });
  if (!project || project.kind !== "SUPPORT") return;

  const orgId = project.supportOrganization?.id ?? (await ensureSupportOrganizationForProject(projectId)).id;
  const adminUser = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
  if (!adminUser) return;

  const email = adminUser.email.trim().toLowerCase();
  const name = adminUser.name?.trim() || email;
  const tempPassword = randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  let consultant = await prisma.ticketingUser.findFirst({
    where: { tbosAdminUserId: adminUserId },
  });
  if (!consultant) {
    consultant = await prisma.ticketingUser.findUnique({ where: { email } });
  }

  if (consultant) {
    consultant = await prisma.ticketingUser.update({
      where: { id: consultant.id },
      data: {
        email,
        name,
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: adminUserId,
        tbosRole: adminUser.role,
        active: true,
      },
    });
  } else {
    consultant = await prisma.ticketingUser.create({
      data: {
        email,
        passwordHash,
        name,
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: adminUserId,
        tbosRole: adminUser.role,
        active: true,
      },
    });
  }

  await prisma.consultantOrganization.upsert({
    where: {
      consultantId_organizationId: { consultantId: consultant.id, organizationId: orgId },
    },
    create: { consultantId: consultant.id, organizationId: orgId },
    update: {},
  });

  const group = await ensureProjectSupportGroup(projectId);
  await prisma.projectSupportGroupMember.upsert({
    where: { projectMemberId },
    create: {
      groupId: group.id,
      projectMemberId,
      adminUserId,
      ticketingUserId: consultant.id,
    },
    update: {
      adminUserId,
      ticketingUserId: consultant.id,
    },
  });
}

export async function assignTicketToSupportGroup(ticketId: string, projectId: string) {
  const group = await prisma.projectSupportGroup.findUnique({
    where: { projectId },
    include: {
      members: {
        where: { ticketingUserId: { not: null } },
        include: { ticketingUser: { select: { id: true, email: true, name: true } } },
      },
    },
  });
  if (!group?.members.length) return null;

  const counts = await prisma.ticket.groupBy({
    by: ["assignedToId"],
    where: {
      projectId,
      status: { in: ["OPEN", "IN_PROGRESS", "PENDING_CLIENT"] },
      assignedToId: { not: null },
    },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.assignedToId!, c._count._all]));

  const sorted = [...group.members].sort((a, b) => {
    const ca = countMap.get(a.ticketingUserId!) ?? 0;
    const cb = countMap.get(b.ticketingUserId!) ?? 0;
    return ca - cb;
  });
  const pick = sorted[0]?.ticketingUser;
  if (!pick) return null;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToId: pick.id, projectId },
  });
  return pick;
}

export async function notifySupportGroupOfTicket(ticketId: string) {
  notifyAsync("ticket.created", { ticketId });
}

export async function activateSupportProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { kind: true } });
  if (project?.kind !== "SUPPORT") return;
  await ensureSupportOrganizationForProject(projectId);
  await ensureProjectSupportGroup(projectId);
}
