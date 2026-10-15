import type { Prisma } from "@techbubble/database";

/** Match full names like "Ramesh R" across first name, last name, and email. */
export function candidateProfileSearchWhere(query: string): Prisma.CandidateProfileWhereInput {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (!terms.length) return {};
  const first = terms[0];
  if (terms.length === 1 && (!first || first.length < 2)) return {};

  return {
    AND: terms.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    })),
  };
}
