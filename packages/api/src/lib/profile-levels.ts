export const PROFILE_LEVELS = ["Manager", "Architect", "Developer", "Tester"] as const;

export type ProfileLevel = (typeof PROFILE_LEVELS)[number];

export const DEFAULT_PROFILE_LEVEL: ProfileLevel = "Developer";
