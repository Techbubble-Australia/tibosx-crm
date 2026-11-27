/** Deployment tier from `ENV` / `TBOS_ENV`. Defaults to production when unset. */
export type AppEnv = "development" | "staging" | "production";

export function normalizeAppEnv(value: string | undefined): AppEnv {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "development" || raw === "dev") return "development";
  if (raw === "staging" || raw === "stage") return "staging";
  return "production";
}

export function readAppEnvRaw(): string | undefined {
  return process.env.ENV ?? process.env.TBOS_ENV ?? process.env.NEXT_PUBLIC_TBOS_ENV;
}

export function isDevelopmentAppEnv(): boolean {
  return normalizeAppEnv(readAppEnvRaw()) === "development";
}

/** Floating debug capture + related APIs (development and staging). */
export function isDebugToolsAppEnv(): boolean {
  const env = normalizeAppEnv(readAppEnvRaw());
  return env === "development" || env === "staging";
}
