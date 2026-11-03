import { prisma } from "@techbubble/database";
import { ensureSupportOrganizationForProject } from "./support-organization";
import { addContractProfilesAsProjectMembers } from "./project-members-from-contract";

async function allocateProjectNumber(): Promise<string> {
  const rows = await prisma.project.findMany({ select: { projectNumber: true } });
  let max = 0;
  for (const row of rows) {
    const match = row.projectNumber.match(/^PRJ(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return `PRJ${String(max + 1).padStart(3, "0")}`;
}

export async function createProjectFromContract(
  contractId: string,
  projectManagerId: string,
  variationId?: string | null,
) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { variations: true },
  });
  if (!contract) throw new Error("NOT_FOUND");
  if (contract.status !== "ACTIVE") throw new Error("NOT_ACTIVE");

  const variation = variationId
    ? contract.variations.find((row) => row.id === variationId)
    : null;
  if (variationId && !variation) throw new Error("VARIATION_NOT_FOUND");

  const existing = await prisma.project.findFirst({
    where: {
      contractId,
      contractVariationId: variationId ?? null,
    },
  });
  if (existing) throw new Error("PROJECT_EXISTS");

  const budget = variation ? variation.variationValue : contract.contractValue;

  const startDate = variation?.variationDate ?? contract.startDate;
  const endDate =
    variation?.variationEndDate ??
    contract.endDate ??
    contract.startDate;

  const projectNumber = await allocateProjectNumber();

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        projectNumber,
        title: contract.title,
        description: contract.comments?.trim() || `Project for contract ${contract.contractNumber}`,
        clientId: contract.clientId,
        status: "DRAFT",
        projectManagerId,
        timesheetApproverUserId: projectManagerId,
        contractId,
        contractVariationId: variationId ?? null,
        startDate,
        endDate,
        budget,
        budgetCurrency: contract.currency,
        fileUrls: Array.isArray(contract.fileUrls)
          ? (contract.fileUrls as string[]).filter((url) => typeof url === "string")
          : [],
      },
    });

    await tx.projectActivityLog.create({
      data: {
        projectId: created.id,
        action: "CREATED",
        performedById: projectManagerId,
        newValue: contract.contractNumber,
      },
    });

    await addContractProfilesAsProjectMembers(tx, created.id, contractId);

    return created;
  });

  try {
    await ensureSupportOrganizationForProject(project.id);
  } catch (error) {
    console.error("Failed to create support organization for project:", error);
  }
  return project;
}
