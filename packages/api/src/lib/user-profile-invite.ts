import { prisma } from "@techbubble/database";
import {
  addressComplete,
  bankDetailsComplete,
  emergencyContactsComplete,
} from "./member-profile";

export async function isAdminUserProfileFullyComplete(userId: string): Promise<boolean> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      addressLine1: true,
      city: true,
      state: true,
      postcode: true,
      country: true,
      bankDetails: true,
      idProofUrl: true,
      addressProofUrl: true,
      emergencyContacts: true,
      profileDetailsCompletedAt: true,
    },
  });
  if (!user) return false;
  if (user.profileDetailsCompletedAt) return true;
  return (
    addressComplete(user) &&
    bankDetailsComplete(user.bankDetails) &&
    emergencyContactsComplete(user.emergencyContacts) &&
    Boolean(user.idProofUrl?.trim()) &&
    Boolean(user.addressProofUrl?.trim())
  );
}

/** Bump invite counter; require profile onboarding modal only when profile was empty at invite time. */
export async function recordTbUserInvite(userId: string): Promise<void> {
  const complete = await isAdminUserProfileFullyComplete(userId);
  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      inviteCount: { increment: 1 },
      ...(complete
        ? { profileOnboardingRequiredAt: null }
        : { profileOnboardingRequiredAt: new Date() }),
    },
  });
}
