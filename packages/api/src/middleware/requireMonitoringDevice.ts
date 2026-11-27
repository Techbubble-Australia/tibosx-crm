import { Response, NextFunction } from "express";
import { prisma } from "@techbubble/database";
import { hashMonitoringDeviceToken } from "../lib/monitoring-token.js";
import type { AuthRequest } from "./auth.js";

export type MonitoringDeviceContext = {
  id: string;
  adminUserId: string;
  deviceName: string;
  platform: string;
};

export interface MonitoringDeviceRequest extends AuthRequest {
  monitoringDevice?: MonitoringDeviceContext;
}

export async function requireMonitoringDevice(
  req: MonitoringDeviceRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No device token provided" });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No device token provided" });
  }

  const tokenHash = hashMonitoringDeviceToken(token);
  try {
    const device = await prisma.monitoringDevice.findFirst({
      where: { tokenHash, revokedAt: null },
      select: {
        id: true,
        adminUserId: true,
        deviceName: true,
        platform: true,
        adminUser: { select: { active: true } },
      },
    });
    if (!device || !device.adminUser.active) {
      return res.status(401).json({ error: "Unauthorized: Invalid or revoked device token" });
    }
    req.monitoringDevice = {
      id: device.id,
      adminUserId: device.adminUserId,
      deviceName: device.deviceName,
      platform: device.platform,
    };
    next();
  } catch (err) {
    console.error("[requireMonitoringDevice]", err);
    return res.status(500).json({ error: "Failed to authenticate device" });
  }
}
