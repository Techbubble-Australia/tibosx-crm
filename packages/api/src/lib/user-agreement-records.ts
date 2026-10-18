import { prisma, type Prisma } from "@techbubble/database";

export async function createUserAgreementRecord(
  tx: Prisma.TransactionClient,
  input: {
    adminUserId: string;
    credentialTemplateId: string;
    templateName: string;
    projectId?: string | null;
    projectMemberId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  },
) {
  await tx.adminUserAgreementRecord.create({
    data: {
      adminUserId: input.adminUserId,
      credentialTemplateId: input.credentialTemplateId,
      templateName: input.templateName,
      projectId: input.projectId ?? null,
      projectMemberId: input.projectMemberId ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
  });
}

export async function markLatestAgreementSigned(
  tx: Prisma.TransactionClient,
  input: {
    adminUserId: string;
    credentialTemplateId: string;
    projectMemberId?: string | null;
    agreementSignedAt: Date;
    agreementDocumentUrl: string;
  },
) {
  const pending = await tx.adminUserAgreementRecord.findFirst({
    where: {
      adminUserId: input.adminUserId,
      credentialTemplateId: input.credentialTemplateId,
      agreementSignedAt: null,
      ...(input.projectMemberId ? { projectMemberId: input.projectMemberId } : {}),
    },
    orderBy: { assignedAt: "desc" },
  });
  if (pending) {
    await tx.adminUserAgreementRecord.update({
      where: { id: pending.id },
      data: {
        agreementSignedAt: input.agreementSignedAt,
        agreementDocumentUrl: input.agreementDocumentUrl,
      },
    });
    return;
  }
  await tx.adminUserAgreementRecord.create({
    data: {
      adminUserId: input.adminUserId,
      credentialTemplateId: input.credentialTemplateId,
      templateName: "Agreement",
      projectMemberId: input.projectMemberId ?? null,
      agreementSignedAt: input.agreementSignedAt,
      agreementDocumentUrl: input.agreementDocumentUrl,
    },
  });
}

export async function listAgreementRecordsForUser(adminUserId: string) {
  return prisma.adminUserAgreementRecord.findMany({
    where: { adminUserId },
    orderBy: [{ agreementSignedAt: "desc" }, { assignedAt: "desc" }],
    select: {
      id: true,
      templateName: true,
      projectId: true,
      startDate: true,
      endDate: true,
      assignedAt: true,
      agreementSignedAt: true,
      agreementDocumentUrl: true,
      project: { select: { projectNumber: true, title: true } },
    },
  });
}
