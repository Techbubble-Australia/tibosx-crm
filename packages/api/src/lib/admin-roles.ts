import { prisma } from "@techbubble/database";

export const ADMIN_ROLES = [
  "admin",
  "recruiter_admin",
  "recruiter",
  "sales",
  "website",
  "project_manager",
  "project_member",
  "customer_support",
  "client",
] as const;

export const ADMIN_ROLES_LIST = ADMIN_ROLES;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type TbModule = "recruitment" | "website" | "sales" | "users" | "project_management" | "workspace";

const MODULE_ROLE_MAP: Record<TbModule, readonly AdminRole[]> = {
  recruitment: ["admin", "recruiter_admin", "recruiter"],
  website: ["admin", "website"],
  sales: ["admin", "sales"],
  users: ["admin"],
  project_management: ["admin", "project_manager", "project_member"],
  workspace: ["admin", "customer_support", "client"],
};

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

export function isRecruitmentStaff(role: string): boolean {
  return role === "recruiter" || role === "recruiter_admin";
}

export function canDeleteProfiles(role: string): boolean {
  return role === "admin" || role === "recruiter_admin";
}

export function canManageProfileOwnership(role: string): boolean {
  return role === "admin" || role === "recruiter_admin";
}

export function parseAdditionalRoles(value: unknown): AdminRole[] {
  if (!Array.isArray(value)) return [];
  return value.filter((r): r is AdminRole => typeof r === "string" && isAdminRole(r));
}

export function effectiveRoleList(primary: string, additional?: unknown): string[] {
  const list: string[] = [];
  const add = (r: string) => {
    if (!list.includes(r)) list.push(r);
  };
  add(primary);
  for (const r of parseAdditionalRoles(additional)) add(r);
  return list;
}

export function canAccessModule(role: string, module: TbModule): boolean {
  if (!isAdminRole(role)) return false;
  return MODULE_ROLE_MAP[module].includes(role);
}

export function canAccessModuleForUser(primary: string, additional: unknown, module: TbModule): boolean {
  return effectiveRoleList(primary, additional).some((role) => canAccessModule(role, module));
}

export async function effectiveRolesForUser(userId: string, primary: string): Promise<string[]> {
  const row = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { additionalRoles: true },
  });
  return effectiveRoleList(primary, row?.additionalRoles);
}

export function hasEffectiveRole(roles: string[], role: string): boolean {
  return roles.includes(role);
}

/** Admins and PMs logging timesheets as project members are not required to complete contractor KYC/bank profile. */
export function isMemberConsultantProfileExempt(primary: string, additional?: unknown): boolean {
  const roles = effectiveRoleList(primary, additional);
  return roles.includes("admin") || roles.includes("project_manager");
}

export function canMutateContent(role: string): boolean {
  return isAdminRole(role);
}

export function canManageUsers(role: string): boolean {
  return canAccessModule(role, "users");
}

export function canManageClients(role: string): boolean {
  return canAccessModule(role, "sales");
}

export async function countActiveAdmins(): Promise<number> {
  return prisma.adminUser.count({ where: { role: "admin", active: true } });
}

export async function assertCanModifyAdminUser(
  actorId: string,
  targetId: string,
  patch: { role?: AdminRole; active?: boolean },
): Promise<string | null> {
  const target = await prisma.adminUser.findUnique({ where: { id: targetId } });
  if (!target) {
    return "Not found";
  }

  const isSelf = actorId === targetId;
  const demotingAdmin = target.role === "admin" && patch.role !== undefined && patch.role !== "admin";
  const deactivatingAdmin = target.role === "admin" && patch.active === false;
  const deactivatingSelf = isSelf && patch.active === false;

  if (deactivatingSelf) {
    return "Cannot deactivate your own account";
  }

  if (demotingAdmin || deactivatingAdmin) {
    const adminCount = await countActiveAdmins();
    if (adminCount <= 1) {
      return "Cannot remove or deactivate the last active administrator";
    }
  }

  if (isSelf && patch.role !== undefined && patch.role !== "admin") {
    const adminCount = await countActiveAdmins();
    if (target.role === "admin" && adminCount <= 1) {
      return "Cannot change your role while you are the only active administrator";
    }
  }

  return null;
}
