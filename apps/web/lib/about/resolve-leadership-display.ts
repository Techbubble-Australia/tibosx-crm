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
 * When all three {@link AboutPagePayload.leadership.featuredTeamMemberIds} are set and each id exists in
 * {@link publishedTeam}, the section uses team data (description → bio, role, image). Otherwise uses CMS
 * {@link AboutPagePayload.leadership.members} only.
 */
export function resolveLeadershipDisplay(
  leadership: AboutPagePayload["leadership"],
  publishedTeam: TeamMemberPublicRow[],
): LeadershipDisplayMember[] {
  const raw = leadership.featuredTeamMemberIds ?? ["", "", ""];
  const ids = [String(raw[0] ?? "").trim(), String(raw[1] ?? "").trim(), String(raw[2] ?? "").trim()];
  if (ids.some((id) => !id)) {
    return leadership.members.map((m) => ({
      name: m.name,
      role: m.role,
      bio: m.bio,
      imageUrl: m.imageUrl,
      imageKey: m.imageKey,
    }));
  }

  const byId = new Map(publishedTeam.map((t) => [t.id, t]));
  const cards: LeadershipDisplayMember[] = [];

  for (let i = 0; i < 3; i++) {
    const id = ids[i] as string;
    const m = byId.get(id);
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
