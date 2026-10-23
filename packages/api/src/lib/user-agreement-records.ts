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
    templateName?: string;
    projectMemberId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
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
        ...(input.startDate && !pending.startDate ? { startDate: input.startDate } : {}),
        ...(input.endDate && !pending.endDate ? { endDate: input.endDate } : {}),
      },
    });
    return;
  }
  await tx.adminUserAgreementRecord.create({
    data: {
      adminUserId: input.adminUserId,
      credentialTemplateId: input.credentialTemplateId,
      templateName: input.templateName ?? "Agreement",
      projectMemberId: input.projectMemberId ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
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
      projectMemberId: true,
      startDate: true,
      endDate: true,
      assignedAt: true,
      createdAt: true,
      agreementSignedAt: true,
      agreementDocumentUrl: true,
      project: { select: { projectNumber: true, title: true } },
    },
  });
}

export function displayDatesFromCredentialData(data: unknown): {
  startDateDisplay: string | null;
  endDateDisplay: string | null;
} {
  if (!data || typeof data !== "object") {
    return { startDateDisplay: null, endDateDisplay: null };
  }
  const row = data as Record<string, unknown>;
  const start =
    (typeof row.startDate === "string" && row.startDate) ||
    (typeof row.start_date === "string" && row.start_date) ||
    (typeof row.Start_Date === "string" && row.Start_Date) ||
    null;
  const end =
    (typeof row.endDate === "string" && row.endDate) ||
    (typeof row.end_date === "string" && row.end_date) ||
    (typeof row.End_Date === "string" && row.End_Date) ||
    null;
  return { startDateDisplay: start, endDateDisplay: end };
}

export function parseAustralianDisplayDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function agreementDatesFromCredentialData(data: unknown): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const { startDateDisplay, endDateDisplay } = displayDatesFromCredentialData(data);
  return {
    startDate: parseAustralianDisplayDate(startDateDisplay),
    endDate: parseAustralianDisplayDate(endDateDisplay),
  };
}

export type SerializedAgreementRecord = {
  id: string;
  templateName: string;
  projectLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  startDateDisplay: string | null;
  endDateDisplay: string | null;
  assignedAt: string;
  createdAt: string;
  signedAt: string | null;
  documentUrl: string | null;
};

function serializeRow(
  row: {
    id: string;
    templateName: string;
    startDate: Date | null;
    endDate: Date | null;
    assignedAt: Date;
    createdAt: Date;
    agreementSignedAt: Date | null;
    agreementDocumentUrl: string | null;
    project?: { projectNumber: string; title: string } | null;
  },
  extras?: { startDateDisplay?: string | null; endDateDisplay?: string | null; documentUrl?: string | null },
): SerializedAgreementRecord {
  return {
    id: row.id,
    templateName: row.templateName,
    projectLabel: row.project ? `${row.project.projectNumber} — ${row.project.title}` : null,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    startDateDisplay: extras?.startDateDisplay ?? null,
    endDateDisplay: extras?.endDateDisplay ?? null,
    assignedAt: row.assignedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    signedAt: row.agreementSignedAt?.toISOString() ?? null,
    documentUrl: extras?.documentUrl ?? row.agreementDocumentUrl,
  };
}

/** Stored rows plus legacy fallbacks from credential assignments and project members. */
export async function buildAgreementRecordsForUser(adminUserId: string): Promise<SerializedAgreementRecord[]> {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { agreementDocumentUrl: true, mappedProfileId: true },
  });
  if (!user) return [];

  const stored = await listAgreementRecordsForUser(adminUserId);
  if (stored.length > 0) {
    const assignment = await prisma.adminUserCredentialAssignment.findUnique({
      where: { adminUserId },
      select: { credentialData: true },
    });
    const memberIds = stored.map((r) => r.projectMemberId).filter((id): id is string => Boolean(id));
    const membersById = memberIds.length
      ? new Map(
          (
            await prisma.projectMember.findMany({
              where: { id: { in: memberIds } },
              select: { id: true, credentialData: true },
            })
          ).map((m) => [m.id, m.credentialData]),
        )
      : new Map<string, unknown>();

    return stored.map((row) => {
      const fromCred = row.projectMemberId
        ? displayDatesFromCredentialData(membersById.get(row.projectMemberId))
        : displayDatesFromCredentialData(assignment?.credentialData);
      return serializeRow(row, {
        startDateDisplay: row.startDate ? null : fromCred.startDateDisplay,
        endDateDisplay: row.endDate ? null : fromCred.endDateDisplay,
        documentUrl:
          row.agreementDocumentUrl ??
          (row.agreementSignedAt ? user.agreementDocumentUrl : null),
      });
    });
  }

  const results: SerializedAgreementRecord[] = [];

  const assignment = await prisma.adminUserCredentialAssignment.findUnique({
    where: { adminUserId },
    include: { credentialTemplate: { select: { id: true, name: true } } },
  });
  if (assignment?.credentialTemplate) {
    const dates = displayDatesFromCredentialData(assignment.credentialData);
    results.push(
      serializeRow(
        {
          id: `assignment-${assignment.id}`,
          templateName: assignment.credentialTemplate.name,
          startDate: null,
          endDate: null,
          assignedAt: assignment.createdAt,
          createdAt: assignment.createdAt,
          agreementSignedAt: assignment.agreementSignedAt,
          agreementDocumentUrl: assignment.agreementSignedAt ? user.agreementDocumentUrl : null,
          project: null,
        },
        {
          ...dates,
          documentUrl: assignment.agreementSignedAt ? user.agreementDocumentUrl : null,
        },
      ),
    );
  }

  const memberWhere: { OR: Array<{ adminUserId: string } | { profileId: string }> } = {
    OR: [{ adminUserId }],
  };
  if (user.mappedProfileId) {
    memberWhere.OR.push({ profileId: user.mappedProfileId });
  }

  const members = await prisma.projectMember.findMany({
    where: {
      ...memberWhere,
      credentialTemplateId: { not: null },
    },
    include: {
      credentialTemplate: { select: { id: true, name: true } },
      project: { select: { projectNumber: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  for (const member of members) {
    if (!member.credentialTemplate) continue;
    const dates = displayDatesFromCredentialData(member.credentialData);
    const signedDoc = member.agreementSignedAt ? user.agreementDocumentUrl : null;
    results.push(
      serializeRow(
        {
          id: `member-${member.id}`,
          templateName: member.credentialTemplate.name,
          startDate: null,
          endDate: null,
          assignedAt: member.createdAt,
          createdAt: member.createdAt,
          agreementSignedAt: member.agreementSignedAt,
          agreementDocumentUrl: signedDoc,
          project: member.project,
        },
        { ...dates, documentUrl: signedDoc },
      ),
    );
  }

  return results;
}
