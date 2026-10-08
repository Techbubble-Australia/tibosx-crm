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
