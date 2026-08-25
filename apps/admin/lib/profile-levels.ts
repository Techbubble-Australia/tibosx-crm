/** Default level when none is set. */
export const DEFAULT_PROFILE_LEVEL = "Developer";

/** Used when the JobLevel settings table has no rows yet. */
export const FALLBACK_PROFILE_LEVELS = ["Manager", "Architect", "Developer", "Tester"] as const;

/** Static fallback list — prefer loading from `/api/admin/job-levels` in the UI. */
export const PROFILE_LEVELS = [...FALLBACK_PROFILE_LEVELS] as const;

export type ProfileLevel = string;
