/** Deployment tier from `ENV` / `TBOS_ENV`. Defaults to production when unset. */
export type AppEnv = "development" | "staging" | "production";

export function normalizeAppEnv(value: string | undefined): AppEnv {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "staging" || raw === "stage") return "staging";
  return "production";
}

/** Set `ENV` or `TBOS_ENV` on the admin service (must be uppercase key in Railway/host). */
export function readAppEnvRaw(): string | undefined {
  return process.env.ENV ?? process.env.TBOS_ENV ?? process.env.NEXT_PUBLIC_TBOS_ENV;
}

export function isDevelopmentAppEnv(): boolean {
  return normalizeAppEnv(readAppEnvRaw()) === "development";
}

/** Floating debug capture toolbar + debug-capture pages. */
export function isDebugToolsAppEnv(): boolean {
  const env = normalizeAppEnv(readAppEnvRaw());
  return env === "development" || env === "staging";
}
