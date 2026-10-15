import { prisma, Prisma } from "@techbubble/database";

const jsonNull = Prisma.DbNull;

export async function deleteAdminUserCompletely(userId: string): Promise<void> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, mappedProfileId: true },
  });
  if (!user) {
    throw new Error("NOT_FOUND");
  }

  const managedProjects = await prisma.project.count({
    where: { projectManagerId: userId },
  });
  if (managedProjects > 0) {
    throw new Error("PROJECT_MANAGER");
  }

  const approverProjects = await prisma.project.count({
    where: { timesheetApproverUserId: userId },
  });
  if (approverProjects > 0) {
    throw new Error("TIMESHEET_APPROVER");
  }

  await prisma.$transaction(async (tx) => {
    await tx.timesheetActivityLog.deleteMany({ where: { performedById: userId } });
    await tx.timesheet.deleteMany({ where: { memberUserId: userId } });

    await tx.projectMember.updateMany({
      where: { adminUserId: userId },
      data: {
        adminUserId: null,
        credentialTemplateId: null,
        credentialData: jsonNull,
        agreementSignedAt: null,
      },
    });

    if (user.mappedProfileId) {
      await tx.projectMember.updateMany({
        where: { profileId: user.mappedProfileId, adminUserId: userId },
        data: {
          adminUserId: null,
          credentialTemplateId: null,
          credentialData: jsonNull,
          agreementSignedAt: null,
        },
      });
    }

    await tx.projectSupportGroupMember.updateMany({
      where: { adminUserId: userId },
      data: { adminUserId: null },
    });

    await tx.ticketingUser.updateMany({
      where: { tbosAdminUserId: userId },
      data: { tbosAdminUserId: null },
    });

    await tx.candidateProfile.updateMany({
      where: { sourcedById: userId },
      data: { sourcedById: null },
    });

    await tx.adminUser.update({
      where: { id: userId },
      data: {
        mappedClientContactId: null,
        mappedProfileId: null,
        agreementDocumentUrl: null,
        profilePhotoUrl: null,
        idProofUrl: null,
        addressProofUrl: null,
        userFiles: jsonNull,
        bankDetails: jsonNull,
        emergencyContacts: jsonNull,
      },
    });

    await tx.adminUser.delete({ where: { id: userId } });
  });
}
