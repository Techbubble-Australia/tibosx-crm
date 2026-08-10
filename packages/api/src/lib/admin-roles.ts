import { prisma } from "@techbubble/database";

export const ADMIN_ROLES = ["admin", "editor", "viewer"] as const;

export const ADMIN_ROLES_LIST = ADMIN_ROLES;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function canMutateContent(role: string): boolean {
  return role === "admin" || role === "editor";
}

export function canManageUsers(role: string): boolean {
  return role === "admin";
}

export function canManageClients(role: string): boolean {
  return role === "admin";
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
