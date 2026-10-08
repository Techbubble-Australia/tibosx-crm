import type { Request, Response, NextFunction } from "express";
import { verifyTbosAdminToken } from "./auth.js";

export type TbosAuthUser = { id: string; email: string; role: string };

export interface TbosRequest extends Request {
  tbosUser?: TbosAuthUser;
}

export function tbosAuthMiddleware(req: TbosRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const user = verifyTbosAdminToken(token);
  if (!user) return res.status(401).json({ error: "Invalid TBOS session" });

  req.tbosUser = user;
  next();
}

export function requireTbosAdmin(req: TbosRequest, res: Response, next: NextFunction) {
  const role = (req.tbosUser?.role || "").trim().toLowerCase();
  if (role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}
