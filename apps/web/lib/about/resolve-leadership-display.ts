import type { TeamMemberPublicRow } from "@/lib/api/public";
import type { AboutPagePayload } from "@/lib/site-content/resolve-pages";

export type LeadershipDisplayMember = {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  imageKey: string;
};

/**
 * When the API returns exactly three published team members with leadership slots 1–3, the section uses
 * their data (description → bio, role, image). Otherwise uses CMS {@link AboutPagePayload.leadership.members}.
 */
export function resolveLeadershipDisplay(
  leadership: AboutPagePayload["leadership"],
  leadershipLineup: TeamMemberPublicRow[],
): LeadershipDisplayMember[] {
  if (leadershipLineup.length !== 3) {
    return leadership.members.map((m) => ({
      name: m.name,
      role: m.role,
      bio: m.bio,
      imageUrl: m.imageUrl,
      imageKey: m.imageKey,
    }));
  }

  const cards: LeadershipDisplayMember[] = [];
  for (let i = 0; i < 3; i++) {
    const m = leadershipLineup[i];
    if (!m) {
      return leadership.members.map((mem) => ({
        name: mem.name,
        role: mem.role,
        bio: mem.bio,
        imageUrl: mem.imageUrl,
        imageKey: mem.imageKey,
      }));
    }
    const slot = leadership.members[i];
    const byName = leadership.members.find((c) => c.name === m.name);
    const cms = slot ?? byName;
    const desc = m.description.trim();
    const bio = desc || (cms?.bio ?? "").trim();
    const imageUrl = (m.imageUrl || cms?.imageUrl || "").trim();
    const imageKey = imageUrl ? "" : (cms?.imageKey ?? "");
    cards.push({ name: m.name, role: m.role, bio, imageUrl, imageKey });
  }
  return cards;
}
