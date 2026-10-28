import { prisma, type Prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";

const TIMESHEET_APPROVER_ROLES = new Set(["admin", "project_manager", "client"]);
const PROJECT_MANAGER_ROLES = new Set(["admin", "project_manager"]);

export async function isValidProjectManagerUserId(userId: string): Promise<boolean> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, additionalRoles: true, active: true },
  });
  if (!user || user.active === false) return false;
  return effectiveRoleList(user.role, user.additionalRoles).some((r) => PROJECT_MANAGER_ROLES.has(r));
}

export async function isValidTimesheetApproverUserId(userId: string): Promise<boolean> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, additionalRoles: true, active: true },
  });
  if (!user || user.active === false) return false;
  return effectiveRoleList(user.role, user.additionalRoles).some((r) => TIMESHEET_APPROVER_ROLES.has(r));
}

export function canActAsTimesheetApprover(
  actorId: string,
  roles: string[] | string,
  project:
    | { timesheetApproverUserId: string | null; projectManagerId?: string | null }
    | null
    | undefined,
): boolean {
  if (!project) return false;
  const effective = Array.isArray(roles) ? roles : effectiveRoleList(roles, null);
  if (effective.includes("admin")) return true;
  if (project.timesheetApproverUserId === actorId) return true;
  if (project.projectManagerId === actorId) return true;
  return false;
}

/** Submitted timesheets awaiting PM approval that this TBOS user can act on. */
export function submittedTimesheetsPendingPmApprovalWhere(
  actorId: string,
  roles: string[],
): Prisma.TimesheetWhereInput {
  if (roles.includes("admin")) {
    return {
      status: "SUBMITTED",
      OR: [{ approverKind: "PM" }, { approverKind: null }],
    };
  }
  return {
    status: "SUBMITTED",
    AND: [
      { OR: [{ approverKind: "PM" }, { approverKind: null }] },
      {
        OR: [
          { project: { projectManagerId: actorId } },
          { project: { timesheetApproverUserId: actorId } },
        ],
      },
    ],
  };
}
