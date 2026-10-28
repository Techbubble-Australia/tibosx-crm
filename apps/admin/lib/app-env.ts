/** Deployment tier from `ENV` (development | production). Defaults to production when unset. */
export function normalizeAppEnv(value: string | undefined): "development" | "production" {
  const raw = (value ?? "").trim().toLowerCase();
  return raw === "development" ? "development" : "production";
}

/** Set `ENV` or `TBOS_ENV` on the admin service (must be uppercase key in Railway/host). */
export function readAppEnvRaw(): string | undefined {
  return process.env.ENV ?? process.env.TBOS_ENV ?? process.env.NEXT_PUBLIC_TBOS_ENV;
}

export function isDevelopmentAppEnv(): boolean {
  return normalizeAppEnv(readAppEnvRaw()) === "development";
}
