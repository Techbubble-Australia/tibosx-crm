import { createHash, randomBytes } from "crypto";

export function generateMonitoringDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashMonitoringDeviceToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export const MIN_CAPTURE_INTERVAL_SECONDS = 60;
export const MAX_CAPTURE_INTERVAL_SECONDS = 3600;
export const DEFAULT_CAPTURE_INTERVAL_SECONDS = 300;
