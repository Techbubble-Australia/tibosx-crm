import { prisma } from "@techbubble/database";
import type { CandidateProfile } from "@techbubble/database";

type ProfileApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city?: string | null;
  expectedRate: number;
  currency: string;
  mode: string;
  documentUrls: unknown;
  isCitizen?: boolean;
  visaStatus?: string | null;
  relevantExperience?: number;
};

export async function createCareerApplicationForProfile(
  profileId: string,
  jobListingId: string,
  profile: ProfileApplicationInput,
): Promise<string> {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobListingId },
    select: { id: true, title: true },
  });
  if (!job) {
    throw new Error("Selected job listing was not found");
  }

  const duplicate = await prisma.careerApplication.findFirst({
    where: { profileId, jobListingId: job.id },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error("This profile is already linked to that job listing");
  }

  const docs = Array.isArray(profile.documentUrls)
    ? profile.documentUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];

  const application = await prisma.careerApplication.create({
    data: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      position: job.title,
      country: profile.country,
      city: profile.city ?? null,
      jobListingId: job.id,
      profileId,
      salaryCurrency: profile.currency,
      salaryRate: profile.expectedRate,
      salaryMode: profile.mode,
      documentUrls: docs,
      resumeUrl: docs[0] ?? null,
      message: null,
      isCitizen: profile.isCitizen ?? true,
      visaStatus: profile.isCitizen ? null : profile.visaStatus?.trim() ?? null,
      relevantExperience: profile.relevantExperience ?? null,
    },
  });

  const profileRow = await prisma.candidateProfile.findUnique({
    where: { id: profileId },
    select: { careerApplicationId: true },
  });
  if (!profileRow?.careerApplicationId) {
    await prisma.candidateProfile.update({
      where: { id: profileId },
      data: { careerApplicationId: application.id },
    });
  }

  return application.id;
}

export async function linkProfileToJobIfRequested(
  profile: CandidateProfile,
  jobListingId: string | null | undefined,
): Promise<void> {
  if (!jobListingId?.trim()) return;

  const existing = await prisma.careerApplication.findFirst({
    where: { profileId: profile.id, jobListingId: jobListingId.trim() },
    select: { id: true },
  });
  if (existing) return;

  await createCareerApplicationForProfile(profile.id, jobListingId.trim(), {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    city: profile.city,
    expectedRate: profile.expectedRate,
    currency: profile.currency,
    mode: profile.mode,
    documentUrls: profile.documentUrls,
    isCitizen: profile.isCitizen,
    visaStatus: profile.visaStatus,
    relevantExperience: profile.relevantExperience,
  });
}
