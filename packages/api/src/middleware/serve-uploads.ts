import express from "express";
import type { NextFunction, Request, Response } from "express";
import {
  getUploadObjectForResponse,
  headUploadObject,
  isSafeUploadRelativePath,
  objectStorageConfigured,
} from "../lib/object-storage";

function extractRelativeUploadPath(req: Request): string {
  try {
    const u = new URL(req.originalUrl, "http://localhost");
    let pathname = u.pathname;
    const prefix = "/uploads";
    if (!pathname.startsWith(prefix)) {
      return "";
    }
    let rel = pathname.slice(prefix.length);
    if (rel.startsWith("/")) rel = rel.slice(1);
    return rel;
  } catch {
    return "";
  }
}

/**
 * Serves GET (and falls through for unsupported methods) for `/uploads/*`:
 * - When object storage is configured: streams from the bucket (`uploads/<path>` keys).
 * - Otherwise: `express.static` on {@link absoluteUploadDir}.
 */
export function createUploadsMiddleware(absoluteUploadDir: string) {
  const staticMw = express.static(absoluteUploadDir, { index: false, dotfiles: "deny" });

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    if (!objectStorageConfigured()) {
      return staticMw(req, res, next);
    }

    void (async () => {
      const relRaw = extractRelativeUploadPath(req);
      if (!relRaw) {
        res.sendStatus(404);
        return;
      }

      let decoded: string;
      try {
        decoded = decodeURIComponent(relRaw);
      } catch {
        res.sendStatus(400);
        return;
      }

      if (!isSafeUploadRelativePath(decoded)) {
        res.sendStatus(400);
        return;
      }

      const key = `uploads/${decoded}`;

      try {
        if (req.method === "HEAD") {
          const meta = await headUploadObject(key);
          if (!meta) {
            res.sendStatus(404);
            return;
          }
          res.setHeader("Content-Type", meta.contentType);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          if (meta.contentLength != null) {
            res.setHeader("Content-Length", String(meta.contentLength));
          }
          res.end();
          return;
        }

        const obj = await getUploadObjectForResponse(key);
        if (!obj) {
          res.sendStatus(404);
          return;
        }

        res.setHeader("Content-Type", obj.contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        if (obj.contentLength != null) {
          res.setHeader("Content-Length", String(obj.contentLength));
        }

        obj.stream.on("error", (err) => {
          console.error("[uploads serve] stream error", err);
          if (!res.headersSent) {
            res.sendStatus(500);
          } else {
            res.end();
          }
        });

        obj.stream.pipe(res);
      } catch (err) {
        next(err);
      }
    })();
  };
}
