import { prisma } from "@techbubble/database";
import { ADMIN_ROLES, type AdminRole, effectiveRoleList, isAdminRole } from "../admin-roles";

/** Roles shown as columns in Settings → Email notifications. */
export const NOTIFICATION_SETTING_ROLES: AdminRole[] = ADMIN_ROLES.filter((r) => r !== "client");

export async function getNotificationPreferenceMatrix(): Promise<
  Record<string, Record<string, boolean>>
> {
  const rows = await prisma.emailNotificationPreference.findMany();
  const matrix: Record<string, Record<string, boolean>> = {};
  for (const row of rows) {
    const bucket = matrix[row.notificationId] ?? {};
    bucket[row.role] = row.enabled;
    matrix[row.notificationId] = bucket;
  }
  return matrix;
}

export function preferenceEnabled(
  matrix: Record<string, Record<string, boolean>>,
  notificationId: string,
  role: string,
): boolean {
  const row = matrix[notificationId];
  if (!row) return true;
  if (row[role] === undefined) return true;
  return row[role];
}

export async function isNotificationEnabledForEmail(
  notificationId: string,
  email: string,
): Promise<boolean> {
  const user = await prisma.adminUser.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    select: { role: true, additionalRoles: true },
  });
  if (!user) return true;

  const roles = effectiveRoleList(user.role, user.additionalRoles).filter(isAdminRole);
  const matrix = await getNotificationPreferenceMatrix();
  if (!roles.length) return true;
  return roles.some((role) => preferenceEnabled(matrix, notificationId, role));
}

export async function saveNotificationPreferences(
  updates: Array<{ notificationId: string; role: string; enabled: boolean }>,
): Promise<void> {
  await prisma.$transaction(
    updates.map((row) =>
      prisma.emailNotificationPreference.upsert({
        where: {
          notificationId_role: {
            notificationId: row.notificationId,
            role: row.role,
          },
        },
        create: {
          notificationId: row.notificationId,
          role: row.role,
          enabled: row.enabled,
        },
        update: { enabled: row.enabled },
      }),
    ),
  );
}
