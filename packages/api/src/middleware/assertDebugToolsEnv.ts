import type { Response, NextFunction } from "express";
import { isDebugToolsAppEnv } from "../lib/app-env.js";

/** Blocks routes that must only run on development or staging deployments. */
export function assertDebugToolsEnvMiddleware(_req: unknown, res: Response, next: NextFunction) {
  if (!isDebugToolsAppEnv()) {
    return res.status(403).json({
      error: "This endpoint is only available when ENV is development or staging",
      code: "DEBUG_TOOLS_ENV_REQUIRED",
    });
  }
  next();
}
