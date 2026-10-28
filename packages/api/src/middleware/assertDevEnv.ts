import type { Response, NextFunction } from "express";
import { isDevelopmentAppEnv } from "../lib/app-env.js";

/** Blocks routes that must only run on development deployments. */
export function assertDevEnvMiddleware(_req: unknown, res: Response, next: NextFunction) {
  if (!isDevelopmentAppEnv()) {
    return res.status(403).json({
      error: "This endpoint is only available when ENV is development",
      code: "DEV_ENV_REQUIRED",
    });
  }
  next();
}
