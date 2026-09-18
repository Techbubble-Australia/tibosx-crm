import { prisma, type Prisma } from "@techbubble/database";

export type JobClientInfo = {
  clientId: string;
  clientName: string;
  jobListingId: string;
};

function titleKey(title: string): string {
  return title.trim().toLowerCase();
}

export async function buildJobClientByTitleLookup(
  published?: boolean,
): Promise<Map<string, JobClientInfo>> {
  const where: Prisma.JobListingWhereInput = {};
  if (published === true) where.published = true;
  if (published === false) where.published = false;

  const jobs = await prisma.jobListing.findMany({
    where,
    select: {
      id: true,
      title: true,
      clientId: true,
      client: { select: { name: true } },
    },
  });

  const map = new Map<string, JobClientInfo>();
  for (const job of jobs) {
    const key = titleKey(job.title);
    if (!key || !job.clientId) continue;
    if (!map.has(key)) {
      map.set(key, {
        clientId: job.clientId,
        clientName: job.client?.name ?? "",
        jobListingId: job.id,
      });
    }
  }
  return map;
}

export function resolveApplicationClient(
  row: {
    position: string;
    jobListingId: string | null;
    jobListing?: {
      clientId: string | null;
      client?: { name: string } | null;
    } | null;
  },
  jobClientByTitle: Map<string, JobClientInfo>,
): { clientId: string | null; clientName: string | null } {
  if (row.jobListing?.clientId) {
    return {
      clientId: row.jobListing.clientId,
      clientName: row.jobListing.client?.name ?? null,
    };
  }

  const key = titleKey(row.position);
  if (key) {
    const match = jobClientByTitle.get(key);
    if (match) {
      return { clientId: match.clientId, clientName: match.clientName };
    }
  }

  return { clientId: null, clientName: null };
}
