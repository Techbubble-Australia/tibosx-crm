/** Which TBOS environment this Debug portal build/deploy targets. */
export type PortalEnv = "development" | "staging" | "production";

export function resolvePortalEnv(
  explicit?: string | null,
  hostname?: string | null,
): PortalEnv {
  const fromEnv = (explicit ?? process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? "")
    .trim()
    .toLowerCase();
  if (fromEnv === "staging" || fromEnv === "stage") return "staging";
  if (fromEnv === "production" || fromEnv === "prod") return "production";
  if (fromEnv === "development" || fromEnv === "dev") return "development";

  const host = (hostname ?? "").toLowerCase();
  if (host.includes("staging") || host.includes("stage")) return "staging";
  if (host.includes("production") || host.includes("prod")) return "production";
  if (host.includes("development") || host.includes("dev.")) return "development";
  // This repo's staging branch ships the staging portal by default.
  return "staging";
}

export function portalEnvLabel(env: PortalEnv): string {
  if (env === "staging") return "Staging";
  if (env === "production") return "Production";
  return "Development";
}
