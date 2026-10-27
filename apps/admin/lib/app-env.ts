/** Deployment tier from `ENV` (development | production). Defaults to production when unset. */
export function normalizeAppEnv(value: string | undefined): "development" | "production" {
  const raw = (value ?? "").trim().toLowerCase();
  return raw === "development" ? "development" : "production";
}

export function isDevelopmentAppEnv(): boolean {
  return normalizeAppEnv(process.env.ENV) === "development";
}
