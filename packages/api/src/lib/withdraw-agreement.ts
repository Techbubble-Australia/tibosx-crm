import { prisma, Prisma } from "@techbubble/database";
import { agreementDatesFromCredentialData } from "./user-agreement-records";

type Tx = Prisma.TransactionClient;

export type WithdrawAgreementResult =
  | { error: string; status: number }
  | { templateName: string; wasSigned: boolean };

/**
 * Users created before agreement records existed only have rows derived from their credential
 * assignment / project memberships (ids "assignment-…" and "member-…"). Store them as real records
 * so one of them can be withdrawn without losing the others from the history.
 */
async function materializeLegacyAgreementRecords(tx: Tx, adminUserId: string): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  if ((await tx.adminUserAgreementRecord.count({ where: { adminUserId } })) > 0) return ids;

  const user = await tx.adminUser.findUnique({
    where: { id: adminUserId },
    select: { agreementDocumentUrl: true, mappedProfileId: true },
  });
  if (!user) return ids;

  const assignment = await tx.adminUserCredentialAssignment.findUnique({
    where: { adminUserId },
    include: { credentialTemplate: { select: { id: true, name: true } } },
  });
  if (assignment?.credentialTemplate) {
    const dates = agreementDatesFromCredentialData(assignment.credentialData);
    const created = await tx.adminUserAgreementRecord.create({
      data: {
        adminUserId,
        credentialTemplateId: assignment.credentialTemplate.id,
        templateName: assignment.credentialTemplate.name,
        startDate: dates.startDate,
        endDate: dates.endDate,
        assignedAt: assignment.createdAt,
        agreementSignedAt: assignment.agreementSignedAt,
        agreementDocumentUrl: assignment.agreementSignedAt ? user.agreementDocumentUrl : null,
      },
    });
    ids.set(`assignment-${assignment.id}`, created.id);
  }

  const members = await tx.projectMember.findMany({
    where: {
      OR: [{ adminUserId }, ...(user.mappedProfileId ? [{ profileId: user.mappedProfileId }] : [])],
      credentialTemplateId: { not: null },
    },
    include: { credentialTemplate: { select: { id: true, name: true } } },
  });
  for (const member of members) {
    if (!member.credentialTemplate) continue;
    const dates = agreementDatesFromCredentialData(member.credentialData);
    const created = await tx.adminUserAgreementRecord.create({
      data: {
        adminUserId,
        credentialTemplateId: member.credentialTemplate.id,
        templateName: member.credentialTemplate.name,
        projectId: member.projectId,
        projectMemberId: member.id,
        startDate: dates.startDate,
        endDate: dates.endDate,
        assignedAt: member.createdAt,
        agreementSignedAt: member.agreementSignedAt,
        agreementDocumentUrl: member.agreementSignedAt ? user.agreementDocumentUrl : null,
      },
    });
    ids.set(`member-${member.id}`, created.id);
  }
  return ids;
}

/**
 * Takes back an agreement that was sent to a user so an updated template can be sent instead.
 * - Not signed yet: the request is removed and the user is no longer asked to sign it.
 * - Already signed: the signed copy stays in history (marked withdrawn / replaced), and the
 *   assignment is cleared so a new template can be assigned and signed.
 */
export async function withdrawAgreement(
  adminUserId: string,
  recordId: string,
  performedById: string | null,
): Promise<WithdrawAgreementResult> {
  return prisma.$transaction(async (tx) => {
    let id = recordId;
    if (recordId.startsWith("assignment-") || recordId.startsWith("member-")) {
      const mapped = (await materializeLegacyAgreementRecords(tx, adminUserId)).get(recordId);
      if (!mapped) return { error: "Agreement record not found", status: 404 };
      id = mapped;
    }

    const record = await tx.adminUserAgreementRecord.findFirst({ where: { id, adminUserId } });
    if (!record) return { error: "Agreement record not found", status: 404 };
    if (record.withdrawnAt) return { error: "This agreement has already been withdrawn", status: 400 };

    const cleared = {
      credentialTemplateId: null,
      credentialData: Prisma.DbNull,
      agreementSignedAt: null,
      signatureDataUrl: null,
    };
    if (record.projectMemberId) {
      await tx.projectMember.updateMany({
        where: { id: record.projectMemberId, credentialTemplateId: record.credentialTemplateId },
        data: cleared,
      });
    } else {
      await tx.adminUserCredentialAssignment.deleteMany({
        where: { adminUserId, credentialTemplateId: record.credentialTemplateId },
      });
    }

    // Unsigned copies of the same agreement (including earlier re-sends) would otherwise still be
    // offered to the user for signing.
    await tx.adminUserAgreementRecord.deleteMany({
      where: {
        adminUserId,
        credentialTemplateId: record.credentialTemplateId,
        projectMemberId: record.projectMemberId,
        agreementSignedAt: null,
        withdrawnAt: null,
      },
    });

    const wasSigned = Boolean(record.agreementSignedAt);
    if (wasSigned) {
      await tx.adminUserAgreementRecord.update({ where: { id: record.id }, data: { withdrawnAt: new Date() } });
    }

    await tx.adminUserActivityLog.create({
      data: {
        adminUserId,
        action: "AGREEMENT_WITHDRAWN",
        fieldName: null,
        oldValue: wasSigned ? "signed" : "awaiting signature",
        newValue: record.templateName,
        performedById,
      },
    });

    return { templateName: record.templateName, wasSigned };
  });
}
