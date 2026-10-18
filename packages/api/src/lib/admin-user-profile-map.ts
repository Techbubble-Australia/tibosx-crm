import { prisma, type Prisma } from "@techbubble/database";
import { effectiveRoleList, isAdminRole } from "./admin-roles";

export async function assertMappedProfileAvailable(
  profileId: string,
  excludeUserId?: string,
): Promise<string | null> {
  const profile = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!profile) return "Profile record not found";

  const taken = await prisma.adminUser.findFirst({
    where: {
      mappedProfileId: profileId,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true, email: true },
  });
  if (taken) {
    return `Another user (${taken.email}) is already mapped to this profile`;
  }
  return null;
}

export async function ensureProjectMemberRole(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const user = await tx.adminUser.findUnique({
    where: { id: userId },
    select: { role: true, additionalRoles: true },
  });
  if (!user) return;
  const effective = effectiveRoleList(user.role, user.additionalRoles);
  if (effective.includes("project_member")) return;

  const extra = Array.isArray(user.additionalRoles)
    ? user.additionalRoles.filter((r): r is string => typeof r === "string" && isAdminRole(r))
    : [];
  if (user.role !== "project_member" && !extra.includes("project_member")) {
    await tx.adminUser.update({
      where: { id: userId },
      data: { additionalRoles: [...extra, "project_member"] },
    });
  }
}

/** Apply profile mapping and link project members to this user. */
export async function applyMappedProfile(
  tx: Prisma.TransactionClient,
  userId: string,
  profileId: string | null,
): Promise<void> {
  if (profileId) {
    await tx.projectMember.updateMany({
      where: { profileId },
      data: { adminUserId: userId },
    });
    await ensureProjectMemberRole(tx, userId);
  }
}

function splitDisplayName(name: string | null | undefined, email: string): { firstName: string; lastName: string } {
  const base = (name || email.split("@")[0] || "User").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "User", lastName: "—" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "—" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

/** Ensure a recruitment profile exists and is linked (for project membership). */
export async function ensureCandidateProfileForAdminUser(
  tx: Prisma.TransactionClient,
  user: { id: string; email: string; name: string | null; phone: string | null },
): Promise<string> {
  const current = await tx.adminUser.findUnique({
    where: { id: user.id },
    select: { mappedProfileId: true },
  });
  if (current?.mappedProfileId) return current.mappedProfileId;

  const byEmail = await tx.candidateProfile.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (byEmail) {
    await tx.adminUser.update({
      where: { id: user.id },
      data: { mappedProfileId: byEmail.id },
    });
    await applyMappedProfile(tx, user.id, byEmail.id);
    return byEmail.id;
  }

  const { firstName, lastName } = splitDisplayName(user.name, user.email);
  const phone = user.phone?.trim() || "—";
  const profile = await tx.candidateProfile.create({
    data: {
      firstName,
      lastName,
      email: user.email.trim().toLowerCase(),
      phone,
      country: "Australia",
      category: "Consultant",
      technology: "General",
      expectedRate: 0,
      currency: "AUD",
      mode: "Contract",
      documentUrls: [],
    },
  });
  await tx.adminUser.update({
    where: { id: user.id },
    data: { mappedProfileId: profile.id },
  });
  await applyMappedProfile(tx, user.id, profile.id);
  return profile.id;
}
