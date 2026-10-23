import { prisma } from "@techbubble/database";
import { ensureProjectSupportGroup, provisionSupportMemberConsultant } from "./support-project.js";

export type TicketAssignee = { id: string; name: string; email: string };

export async function resolveTicketProjectId(ticket: {
  projectId: string | null;
  organizationId: string;
}): Promise<string | null> {
  if (ticket.projectId) return ticket.projectId;
  const org = await prisma.organization.findUnique({
    where: { id: ticket.organizationId },
    select: { projectId: true },
  });
  return org?.projectId ?? null;
}

function isEligibleAssignee(tu: {
  active: boolean;
  role: string;
  consultantVerified: boolean;
  tbosAdminUserId: string | null;
  tbosRole: string | null;
}): boolean {
  if (!tu.active || tu.role !== "CONSULTANT") return false;
  if (tu.consultantVerified) return true;
  if (tu.tbosAdminUserId) return true;
  const role = (tu.tbosRole ?? "").toLowerCase();
  return (
    role === "admin" ||
    role === "customer_support" ||
    role === "project_manager" ||
    role === "project_member"
  );
}

/** When support group is empty, seed it from all project members with TBOS accounts. */
async function ensureSupportGroupHasProjectMembers(projectId: string) {
  const group = await ensureProjectSupportGroup(projectId);
  const existing = await prisma.projectSupportGroupMember.count({ where: { groupId: group.id } });
  if (existing > 0) return;

  const members = await prisma.projectMember.findMany({
    where: { projectId, adminUserId: { not: null } },
    select: { id: true, adminUserId: true },
  });
  for (const member of members) {
    if (!member.adminUserId) continue;
    await prisma.projectSupportGroupMember.upsert({
      where: { projectMemberId: member.id },
      create: {
        groupId: group.id,
        projectMemberId: member.id,
        adminUserId: member.adminUserId,
      },
      update: { groupId: group.id, adminUserId: member.adminUserId },
    });
  }
}

async function listFallbackProjectMemberAssignees(projectId: string): Promise<TicketAssignee[]> {
  const members = await prisma.projectMember.findMany({
    where: { projectId, adminUserId: { not: null } },
    select: { id: true, adminUserId: true },
  });
  const out: TicketAssignee[] = [];
  for (const member of members) {
    if (!member.adminUserId) continue;
    try {
      await provisionSupportMemberConsultant(projectId, member.adminUserId, member.id);
    } catch {
      // continue — member may still have a ticketing user
    }
    const tu = await prisma.ticketingUser.findFirst({
      where: { tbosAdminUserId: member.adminUserId, active: true },
      select: { id: true, name: true, email: true, role: true, consultantVerified: true, tbosAdminUserId: true, tbosRole: true, active: true },
    });
    if (tu && isEligibleAssignee(tu)) {
      out.push({ id: tu.id, name: tu.name || tu.email, email: tu.email });
    }
  }
  return out;
}

export async function listGlobalTicketAssignees(): Promise<TicketAssignee[]> {
  const rows = await prisma.ticketingUser.findMany({
    where: {
      active: true,
      role: "CONSULTANT",
      OR: [
        { consultantVerified: true },
        { tbosAdminUserId: { not: null } },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, consultantVerified: true, tbosAdminUserId: true, tbosRole: true, active: true },
  });
  return rows
    .filter((tu) => isEligibleAssignee(tu))
    .map((tu) => ({ id: tu.id, name: tu.name || tu.email, email: tu.email }));
}

export async function listProjectTicketAssignees(projectId: string | null | undefined): Promise<TicketAssignee[]> {
  if (!projectId) {
    return listGlobalTicketAssignees();
  }

  await ensureSupportGroupHasProjectMembers(projectId);

  const group = await prisma.projectSupportGroup.findUnique({
    where: { projectId },
    include: {
      members: {
        include: {
          ticketingUser: {
            select: { id: true, name: true, email: true, active: true, role: true, consultantVerified: true, tbosAdminUserId: true, tbosRole: true },
          },
          projectMember: { select: { id: true, adminUserId: true } },
        },
      },
    },
  });

  const assignees: TicketAssignee[] = [];
  const seen = new Set<string>();

  if (group?.members.length) {
    for (const member of group.members) {
      let tu = member.ticketingUser;
      if (
        (!tu || !isEligibleAssignee({ ...tu, tbosAdminUserId: tu.tbosAdminUserId ?? null, tbosRole: tu.tbosRole ?? null })) &&
        member.projectMember?.adminUserId
      ) {
        await provisionSupportMemberConsultant(projectId, member.projectMember.adminUserId, member.projectMember.id);
        const refreshed = await prisma.projectSupportGroupMember.findUnique({
          where: { id: member.id },
          include: {
            ticketingUser: {
              select: { id: true, name: true, email: true, active: true, role: true, consultantVerified: true, tbosAdminUserId: true, tbosRole: true },
            },
          },
        });
        tu = refreshed?.ticketingUser ?? null;
      }
      if (tu && isEligibleAssignee({ ...tu, tbosAdminUserId: tu.tbosAdminUserId ?? null, tbosRole: tu.tbosRole ?? null }) && !seen.has(tu.id)) {
        seen.add(tu.id);
        assignees.push({ id: tu.id, name: tu.name || tu.email, email: tu.email });
      }
    }
  }

  if (!assignees.length) {
    const fallback = await listFallbackProjectMemberAssignees(projectId);
    for (const row of fallback) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        assignees.push(row);
      }
    }
  }

  if (!assignees.length) {
    return listGlobalTicketAssignees();
  }

  return assignees.sort((a, b) => a.name.localeCompare(b.name));
}

export async function isValidProjectTicketAssignee(
  projectId: string | null | undefined,
  assignedToId: string | null | undefined,
): Promise<boolean> {
  if (!assignedToId) return true;
  const assignees = await listProjectTicketAssignees(projectId);
  return assignees.some((row) => row.id === assignedToId);
}

export async function autoAssignTicketToProjectSupport(ticketId: string, projectId: string): Promise<TicketAssignee | null> {
  const assignees = await listProjectTicketAssignees(projectId);
  if (assignees.length === 1) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedToId: assignees[0]!.id, projectId },
    });
    return assignees[0]!;
  }
  const { assignTicketToSupportGroup } = await import("./support-project.js");
  const pick = await assignTicketToSupportGroup(ticketId, projectId);
  if (!pick) return null;
  return { id: pick.id, name: pick.name || pick.email, email: pick.email };
}
