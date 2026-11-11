import { prisma } from "@techbubble/database";
import type { CredentialTemplate } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";
import { ensureProjectMemberRole } from "./admin-user-profile-map";

const credentialMemberInclude = {
  project: { select: { id: true, title: true, projectNumber: true } },
  credentialTemplate: true,
} as const;

export function hasEffectiveProjectMemberRole(primary: string, additional?: unknown): boolean {
  return effectiveRoleList(primary, additional).includes("project_member");
}

export async function userHasProjectMembership(userId: string): Promise<boolean> {
  const row = await prisma.projectMember.findFirst({
    where: { adminUserId: userId },
    select: { id: true },
  });
  return Boolean(row);
}

export async function userQualifiesForMemberOnboarding(
  userId: string,
  primary: string,
  additional?: unknown,
): Promise<boolean> {
  if (hasEffectiveProjectMemberRole(primary, additional)) return true;
  if (await userHasProjectMembership(userId)) return true;
  const member = await findCredentialProjectMemberForUser(userId);
  if (member?.credentialTemplateId) return true;
  const assignment = await prisma.adminUserCredentialAssignment.findUnique({
    where: { adminUserId: userId },
    select: { credentialTemplateId: true },
  });
  return Boolean(assignment?.credentialTemplateId);
}

/** Link project member + ensure project_member role before onboarding checks (e.g. first login). */
export async function prepareMemberOnboardingForUser(userId: string): Promise<void> {
  const member = await findCredentialProjectMemberForUser(userId);
  if (!member?.credentialTemplateId) return;
  await prisma.$transaction(async (tx) => {
    await ensureProjectMemberRole(tx, userId);
  });
}

/** Project member row with agreement template, linked by admin user or mapped profile. */
export async function findCredentialProjectMemberForUser(userId: string) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { mappedProfileId: true },
  });

  let member = await prisma.projectMember.findFirst({
    where: { adminUserId: userId, credentialTemplateId: { not: null } },
    orderBy: { updatedAt: "desc" },
    include: credentialMemberInclude,
  });

  if (!member && user?.mappedProfileId) {
    member = await prisma.projectMember.findFirst({
      where: { profileId: user.mappedProfileId, credentialTemplateId: { not: null } },
      orderBy: { updatedAt: "desc" },
      include: credentialMemberInclude,
    });
    if (member && !member.adminUserId) {
      await prisma.projectMember.update({
        where: { id: member.id },
        data: { adminUserId: userId },
      });
    }
  }

  return member;
}

export type UserCredentialAgreement =
  | {
      source: "project_member";
      memberId: string;
      projectId: string;
      projectTitle: string;
      projectNumber: string;
      credentialTemplate: CredentialTemplate;
      credentialData: unknown;
      agreementSignedAt: Date | null;
      signatureDataUrl: string | null;
    }
  | {
      source: "admin_user";
      adminUserId: string;
      credentialTemplate: CredentialTemplate;
      credentialData: unknown;
      agreementSignedAt: Date | null;
      signatureDataUrl: string | null;
    };

export async function findUserCredentialAgreement(userId: string): Promise<UserCredentialAgreement | null> {
  const member = await findCredentialProjectMemberForUser(userId);
  if (member?.credentialTemplate) {
    return {
      source: "project_member",
      memberId: member.id,
      projectId: member.projectId,
      projectTitle: member.project.title,
      projectNumber: member.project.projectNumber,
      credentialTemplate: member.credentialTemplate,
      credentialData: member.credentialData,
      agreementSignedAt: member.agreementSignedAt,
      signatureDataUrl: member.signatureDataUrl,
    };
  }

  const assignment = await prisma.adminUserCredentialAssignment.findUnique({
    where: { adminUserId: userId },
    include: { credentialTemplate: true },
  });
  if (!assignment?.credentialTemplate) {
    const pendingRecord = await prisma.adminUserAgreementRecord.findFirst({
      where: { adminUserId: userId, agreementSignedAt: null, withdrawnAt: null },
      orderBy: { assignedAt: "desc" },
      include: { credentialTemplate: true },
    });
    if (pendingRecord?.credentialTemplate) {
      return {
        source: "admin_user",
        adminUserId: userId,
        credentialTemplate: pendingRecord.credentialTemplate,
        credentialData: {},
        agreementSignedAt: null,
        signatureDataUrl: null,
      };
    }
    return null;
  }

  return {
    source: "admin_user",
    adminUserId: userId,
    credentialTemplate: assignment.credentialTemplate,
    credentialData: assignment.credentialData,
    agreementSignedAt: assignment.agreementSignedAt,
    signatureDataUrl: assignment.signatureDataUrl,
  };
}
