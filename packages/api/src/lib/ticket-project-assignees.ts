import { prisma } from "@techbubble/database";
import { ensureProjectSupportGroup, provisionSupportMemberConsultant } from "./support-project.js";

export type TicketAssignee = { id: string; name: string; email: string };

/** When support is enabled but no group members were configured, include all project members. */
async function ensureSupportGroupHasProjectMembers(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { kind: true },
  });
  if (project?.kind !== "SUPPORT") return;

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

export async function listProjectTicketAssignees(projectId: string | null | undefined): Promise<TicketAssignee[]> {
  if (!projectId) return [];

  await ensureSupportGroupHasProjectMembers(projectId);

  const group = await prisma.projectSupportGroup.findUnique({
    where: { projectId },
    include: {
      members: {
        include: {
          ticketingUser: {
            select: { id: true, name: true, email: true, active: true, role: true, consultantVerified: true },
          },
          projectMember: { select: { id: true, adminUserId: true } },
        },
      },
    },
  });
  if (!group?.members.length) return [];

  const assignees: TicketAssignee[] = [];
  for (const member of group.members) {
    let tu = member.ticketingUser;
    if (
      (!tu || !tu.active || tu.role !== "CONSULTANT" || !tu.consultantVerified) &&
      member.projectMember?.adminUserId
    ) {
      await provisionSupportMemberConsultant(projectId, member.projectMember.adminUserId, member.projectMember.id);
      const refreshed = await prisma.projectSupportGroupMember.findUnique({
        where: { id: member.id },
        include: {
          ticketingUser: {
            select: { id: true, name: true, email: true, active: true, role: true, consultantVerified: true },
          },
        },
      });
      tu = refreshed?.ticketingUser ?? null;
    }
    if (tu?.active && tu.role === "CONSULTANT" && tu.consultantVerified) {
      assignees.push({ id: tu.id, name: tu.name || tu.email, email: tu.email });
    }
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
