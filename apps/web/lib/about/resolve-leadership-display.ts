import type { TeamMemberPublicRow } from "@/lib/api/public";

export type LeadershipDisplayMember = {
  name: string;
  role: string;
  location: string;
  bio: string;
  imageUrl: string;
  imageKey: string;
};

/** Meet the Leadership cards from published team members with leadership slots (API order). */
export function resolveLeadershipDisplay(leadershipLineup: TeamMemberPublicRow[]): LeadershipDisplayMember[] {
  return leadershipLineup.map((m) => {
    const imageUrl = (m.imageUrl ?? "").trim();
    return {
      name: m.name,
      role: m.role,
      location: (m.location ?? "").trim(),
      bio: (m.description ?? "").trim(),
      imageUrl,
      imageKey: "",
    };
  });
}
