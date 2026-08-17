import { prisma } from "@techbubble/database";
import { normalizeProfileEmail, normalizeProfilePhone } from "./profile-duplicates";

export async function findDuplicateCareerApplication(params: {
  jobListingId: string | null | undefined;
  position: string;
  email: string;
  phone: string;
}): Promise<boolean> {
  const email = normalizeProfileEmail(params.email);
  const phoneDigits = normalizeProfilePhone(params.phone);

  const whereBase = params.jobListingId
    ? { jobListingId: params.jobListingId }
    : {
        jobListingId: null,
        position: { equals: params.position.trim(), mode: "insensitive" as const },
      };

  const candidates = await prisma.careerApplication.findMany({
    where: whereBase,
    select: { email: true, phone: true },
  });

  return candidates.some((row) => {
    if (normalizeProfileEmail(row.email) === email) {
      return true;
    }
    if (phoneDigits.length >= 8 && normalizeProfilePhone(row.phone ?? "") === phoneDigits) {
      return true;
    }
    return false;
  });
}
