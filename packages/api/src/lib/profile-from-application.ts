import { prisma } from "@techbubble/database";

function inferFromTitle(title: string): { category: string; technology: string } {
  const t = title.toLowerCase();
  if (t.includes("servicenow")) return { category: "ServiceNow", technology: "ServiceNow" };
  if (t.includes("salesforce")) return { category: "Salesforce", technology: "Salesforce" };
  if (t.includes("azure")) return { category: "Microsoft", technology: "Azure" };
  if (t.includes("microsoft")) return { category: "Microsoft", technology: "Microsoft" };
  if (t.includes("ai") || t.includes("ml")) return { category: "Engineering", technology: "AI/ML" };
  if (t.includes("react")) return { category: "Engineering", technology: "AI/ML" };
  return { category: "Engineering", technology: "ServiceNow" };
}

export async function inferCategoryTechnologyFromPosition(position: string): Promise<{
  category: string;
  technology: string;
}> {
  const normalized = position.trim();
  if (!normalized) {
    return inferFromTitle("");
  }

  const job = await prisma.jobListing.findFirst({
    where: { title: { equals: normalized, mode: "insensitive" } },
    select: { category: true, technology: true },
    orderBy: { updatedAt: "desc" },
  });

  if (job?.category && job.technology) {
    return { category: job.category, technology: job.technology };
  }

  return inferFromTitle(normalized);
}

type ApplicationRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  country: string | null;
  city: string | null;
  jobListingId: string | null;
  visaStatus: string | null;
  salaryCurrency: string | null;
  salaryRate: number | null;
  salaryMode: string | null;
  resumeUrl: string | null;
  documentUrls: unknown;
  message: string | null;
  isCitizen?: boolean;
};

function documentUrlsFromApplication(application: ApplicationRow): string[] {
  if (Array.isArray(application.documentUrls)) {
    return application.documentUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  }
  return application.resumeUrl ? [application.resumeUrl] : [];
}

export async function createProfileFromCareerApplication(application: ApplicationRow): Promise<void> {
  const existing = await prisma.candidateProfile.findUnique({
    where: { careerApplicationId: application.id },
  });
  if (existing) {
    return;
  }

  const documentUrls = documentUrlsFromApplication(application);
  if (documentUrls.length === 0) {
    return;
  }

  const phone = application.phone?.trim() ?? "";
  const expectedRate = application.salaryRate ?? 0;
  const currency = application.salaryCurrency?.trim() ?? "";
  const mode = application.salaryMode?.trim() ?? "";

  if (!phone || expectedRate <= 0 || !currency || !mode) {
    return;
  }

  const { category, technology } = await inferCategoryTechnologyFromPosition(application.position);

  let country = application.country?.trim() ?? "";
  let city = application.city?.trim() || null;

  if (application.jobListingId) {
    const job = await prisma.jobListing.findUnique({
      where: { id: application.jobListingId },
      select: { country: true, locations: true },
    });
    if (job && !country) {
      country = job.country?.trim() ?? "";
    }
  }

  if (!country) {
    return;
  }

  await prisma.candidateProfile.create({
    data: {
      firstName: application.firstName.trim(),
      lastName: application.lastName.trim(),
      email: application.email.trim(),
      phone,
      country,
      city,
      category,
      technology,
      expectedRate,
      currency,
      mode,
      documentUrls,
      comments: application.message?.trim() || null,
      isCitizen: application.isCitizen ?? true,
      visaStatus: application.isCitizen ? null : application.visaStatus?.trim() ?? null,
      careerApplicationId: application.id,
    },
  });
}
