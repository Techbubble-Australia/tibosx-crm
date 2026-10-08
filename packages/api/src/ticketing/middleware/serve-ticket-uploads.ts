import express from "express";
import type { NextFunction, Request, Response } from "express";
import {
  getUploadObjectForResponse,
  headUploadObject,
  isSafeUploadRelativePath,
  objectStorageConfigured,
  TICKET_UPLOAD_OBJECT_PREFIX,
} from "../lib/object-storage.js";

const URL_PREFIX = "/uploads/tickets";

function pathnameUnderTickets(pathname: string): string {
  if (!pathname.startsWith(URL_PREFIX)) {
    return "";
  }
  let rel = pathname.slice(URL_PREFIX.length);
  if (rel.startsWith("/")) rel = rel.slice(1);
  return rel;
}

function extractRelativeTicketUploadPath(req: Request): string {
  const fromMount = pathnameUnderTickets(`${req.baseUrl || ""}${req.path || ""}`);
  if (fromMount) return fromMount;

  try {
    const u = new URL(req.originalUrl, "http://localhost");
    return pathnameUnderTickets(u.pathname);
  } catch {
    return "";
  }
}

/**
 * Serves GET/HEAD for `/uploads/tickets/*`:
 * - Object storage (same `OBJECT_STORAGE_*` as TBOS API): keys `uploads/tickets/<file>`.
 * - Otherwise: disk under {@link absoluteTicketUploadDir}.
 */
export function createTicketUploadsMiddleware(absoluteTicketUploadDir: string) {
  const staticMw = express.static(absoluteTicketUploadDir, { index: false, dotfiles: "deny" });

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    if (!objectStorageConfigured()) {
      return staticMw(req, res, next);
    }

    void (async () => {
      const relRaw = extractRelativeTicketUploadPath(req);
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

      const key = `${TICKET_UPLOAD_OBJECT_PREFIX}/${decoded}`;

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
          console.error("[ticket uploads serve] stream error", err);
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
