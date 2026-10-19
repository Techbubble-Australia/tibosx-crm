import type { Prisma } from "@techbubble/database";

type Tx = Prisma.TransactionClient;

export async function logAdminUserFieldChange(
  tx: Tx,
  adminUserId: string,
  performedById: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
) {
  if (oldValue === newValue) return;
  await tx.adminUserActivityLog.create({
    data: {
      adminUserId,
      action: "PROFILE_UPDATED",
      fieldName,
      oldValue,
      newValue,
      performedById,
    },
  });
}

export async function logAdminUserCreated(
  tx: Tx,
  adminUserId: string,
  performedById: string | null,
  detail?: string,
) {
  await tx.adminUserActivityLog.create({
    data: {
      adminUserId,
      action: "USER_CREATED",
      fieldName: null,
      oldValue: null,
      newValue: detail ?? null,
      performedById,
    },
  });
}
