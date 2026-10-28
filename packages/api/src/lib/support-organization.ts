import { prisma } from "@techbubble/database";

export function slugifySupportOrganizationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function allocateUniqueSlug(base: string): Promise<string> {
  let slug = base || "project";
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Create or return the support portal org for a TBOS delivery project. */
export async function ensureSupportOrganizationForProject(projectId: string) {
  const existing = await prisma.organization.findFirst({
    where: { projectId },
  });
  if (existing) {
    if (!existing.active) {
      await prisma.organization.update({
        where: { id: existing.id },
        data: { active: true },
      });
    }
    await syncConsultantAccessForOrganization(existing.id);
    return existing.active
      ? existing
      : await prisma.organization.findUniqueOrThrow({ where: { id: existing.id } });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      projectNumber: true,
      title: true,
      projectManagerId: true,
    },
  });
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  const name = `${project.projectNumber} — ${project.title}`;
  const baseSlug = slugifySupportOrganizationName(project.projectNumber) || "project";
  const slug = await allocateUniqueSlug(baseSlug);

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      active: true,
      projectId: project.id,
    },
  });

  await syncConsultantAccessForOrganization(org.id);
  return org;
}

/** Grant consultant portal access to PMs (and linked consultants) for this support org. */
export async function syncConsultantAccessForOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      project: { select: { projectManagerId: true } },
    },
  });
  if (!org?.project?.projectManagerId) return;

  const adminUserId = org.project.projectManagerId;
  const consultant = await prisma.ticketingUser.findFirst({
    where: {
      tbosAdminUserId: adminUserId,
      role: "CONSULTANT",
      consultantVerified: true,
      active: true,
    },
  });
  if (!consultant) return;

  await prisma.consultantOrganization.upsert({
    where: {
      consultantId_organizationId: {
        consultantId: consultant.id,
        organizationId: org.id,
      },
    },
    create: { consultantId: consultant.id, organizationId: org.id },
    update: {},
  });
}

/** After TBOS SSO, assign support orgs for projects this user manages. */
export async function syncConsultantOrganizationsForTbosUser(adminUserId: string) {
  const consultant = await prisma.ticketingUser.findFirst({
    where: {
      tbosAdminUserId: adminUserId,
      role: "CONSULTANT",
      consultantVerified: true,
      active: true,
    },
  });
  if (!consultant) return;

  const orgs = await prisma.organization.findMany({
    where: {
      active: true,
      project: { projectManagerId: adminUserId },
    },
    select: { id: true },
  });

  for (const org of orgs) {
    await prisma.consultantOrganization.upsert({
      where: {
        consultantId_organizationId: {
          consultantId: consultant.id,
          organizationId: org.id,
        },
      },
      create: { consultantId: consultant.id, organizationId: org.id },
      update: {},
    });
  }
}
