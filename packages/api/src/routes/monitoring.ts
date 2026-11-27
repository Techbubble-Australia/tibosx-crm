import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "@techbubble/database";
import {
  DEFAULT_CAPTURE_INTERVAL_SECONDS,
  generateMonitoringDeviceToken,
  hashMonitoringDeviceToken,
  MAX_CAPTURE_INTERVAL_SECONDS,
  MIN_CAPTURE_INTERVAL_SECONDS,
} from "../lib/monitoring-token.js";
import { persistUploadedBuffer } from "../lib/upload-persist.js";
import {
  requireMonitoringDevice,
  type MonitoringDeviceRequest,
} from "../middleware/requireMonitoringDevice.js";
import type { AuthRequest } from "../middleware/auth.js";

const router: IRouter = Router();
const adminRouter: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mt = (file.mimetype || "").toLowerCase();
    const okExt = /\.(jpe?g|png|webp)$/i.test(ext);
    const okMt = /^image\/(jpe?g|png|webp)$/.test(mt) || mt === "image/jpg";
    if (okExt || okMt || !file.originalname) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, PNG, or WebP screenshots are allowed"));
  },
});

async function getOrCreateSettings() {
  return prisma.monitoringSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enabled: false,
      captureIntervalSeconds: DEFAULT_CAPTURE_INTERVAL_SECONDS,
    },
    update: {},
  });
}

function sessionDurationMinutes(startedAt: Date, lastHeartbeatAt: Date, endedAt: Date | null): number {
  const end = endedAt ?? lastHeartbeatAt;
  const ms = Math.max(0, end.getTime() - startedAt.getTime());
  return Math.round(ms / 60000);
}

async function getOrOpenSession(deviceId: string, adminUserId: string) {
  const open = await prisma.monitoringSession.findFirst({
    where: { deviceId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (open) return open;
  return prisma.monitoringSession.create({
    data: { deviceId, adminUserId },
  });
}

/** POST /api/monitor/enroll — public; email must match active AdminUser.
 * One active device per email. Pass replaceExisting: true to revoke the old device and link this one.
 */
router.post("/enroll", async (req, res) => {
  try {
    const emailRaw = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!emailRaw) {
      return res.status(400).json({ error: "Email is required" });
    }
    const email = emailRaw.toLowerCase();
    const deviceName =
      typeof req.body?.deviceName === "string" ? req.body.deviceName.trim().slice(0, 200) : "";
    const platformRaw =
      typeof req.body?.platform === "string" ? req.body.platform.trim().toLowerCase() : "unknown";
    const platform = ["darwin", "win32", "linux"].includes(platformRaw) ? platformRaw : "unknown";
    const replaceExisting = Boolean(req.body?.replaceExisting);

    const user = await prisma.adminUser.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, active: true },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ error: "No matching active user for that email" });
    }

    const existing = await prisma.monitoringDevice.findFirst({
      where: { adminUserId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        deviceName: true,
        platform: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (existing && !replaceExisting) {
      return res.status(409).json({
        code: "DEVICE_ALREADY_LINKED",
        error:
          "This email is already linked to another device. Continue only if you want to unlink the old device and use this one instead.",
        existingDevice: {
          id: existing.id,
          deviceName: existing.deviceName,
          platform: existing.platform,
          lastSeenAt: existing.lastSeenAt,
          createdAt: existing.createdAt,
        },
      });
    }

    const now = new Date();
    if (existing && replaceExisting) {
      await prisma.$transaction([
        prisma.monitoringDevice.updateMany({
          where: { adminUserId: user.id, revokedAt: null },
          data: { revokedAt: now },
        }),
        prisma.monitoringSession.updateMany({
          where: { adminUserId: user.id, endedAt: null },
          data: { endedAt: now, lastHeartbeatAt: now },
        }),
      ]);
    }

    const settings = await getOrCreateSettings();
    const token = generateMonitoringDeviceToken();
    const tokenHash = hashMonitoringDeviceToken(token);
    const device = await prisma.monitoringDevice.create({
      data: {
        adminUserId: user.id,
        deviceName: deviceName || `${user.email} device`,
        platform,
        tokenHash,
        lastSeenAt: now,
      },
    });

    return res.status(201).json({
      data: {
        token,
        deviceId: device.id,
        email: user.email,
        name: user.name,
        enabled: settings.enabled,
        captureIntervalSeconds: settings.captureIntervalSeconds,
        replacedDeviceId: existing && replaceExisting ? existing.id : null,
      },
    });
  } catch (err) {
    console.error("[monitor/enroll]", err);
    return res.status(500).json({ error: "Failed to enroll device" });
  }
});

router.get("/config", requireMonitoringDevice, async (req: MonitoringDeviceRequest, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({
      data: {
        enabled: settings.enabled,
        captureIntervalSeconds: settings.captureIntervalSeconds,
        deviceId: req.monitoringDevice!.id,
      },
    });
  } catch (err) {
    console.error("[monitor/config]", err);
    return res.status(500).json({ error: "Failed to load monitoring config" });
  }
});

router.post("/heartbeat", requireMonitoringDevice, async (req: MonitoringDeviceRequest, res) => {
  try {
    const device = req.monitoringDevice!;
    const now = new Date();
    const openSession = await getOrOpenSession(device.id, device.adminUserId);
    const updated = await prisma.monitoringSession.update({
      where: { id: openSession.id },
      data: { lastHeartbeatAt: now },
    });
    await prisma.monitoringDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: now },
    });

    return res.json({
      data: {
        sessionId: updated.id,
        startedAt: updated.startedAt,
        lastHeartbeatAt: updated.lastHeartbeatAt,
      },
    });
  } catch (err) {
    console.error("[monitor/heartbeat]", err);
    return res.status(500).json({ error: "Failed to record heartbeat" });
  }
});

router.post("/session/end", requireMonitoringDevice, async (req: MonitoringDeviceRequest, res) => {
  try {
    const device = req.monitoringDevice!;
    const now = new Date();
    const result = await prisma.monitoringSession.updateMany({
      where: { deviceId: device.id, endedAt: null },
      data: { endedAt: now, lastHeartbeatAt: now },
    });
    await prisma.monitoringDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: now },
    });
    return res.json({ data: { closed: result.count } });
  } catch (err) {
    console.error("[monitor/session/end]", err);
    return res.status(500).json({ error: "Failed to end session" });
  }
});

router.post(
  "/screenshot",
  requireMonitoringDevice,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Invalid screenshot upload" });
      }
      next();
    });
  },
  async (req: MonitoringDeviceRequest, res) => {
    try {
      const settings = await getOrCreateSettings();
      if (!settings.enabled) {
        return res.status(403).json({ error: "Screenshot monitoring is disabled" });
      }
      const file = req.file;
      if (!file?.buffer?.length) {
        return res.status(400).json({ error: "Screenshot image is required" });
      }

      const device = req.monitoringDevice!;
      const now = new Date();
      const session = await getOrOpenSession(device.id, device.adminUserId);
      await prisma.monitoringSession.update({
        where: { id: session.id },
        data: { lastHeartbeatAt: now },
      });
      await prisma.monitoringDevice.update({
        where: { id: device.id },
        data: { lastSeenAt: now },
      });

      const ext =
        path.extname(file.originalname || "").toLowerCase() ||
        (file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg");
      const filename = `monitoring-${device.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      // Persist under uploads/ so existing /uploads middleware can serve; keep monitoring- prefix.
      await persistUploadedBuffer(file.buffer, filename, file.mimetype || "image/jpeg");
      const imageUrl = `/uploads/${filename}`;

      const width =
        typeof req.body?.width === "string" || typeof req.body?.width === "number"
          ? Number(req.body.width)
          : undefined;
      const height =
        typeof req.body?.height === "string" || typeof req.body?.height === "number"
          ? Number(req.body.height)
          : undefined;
      const capturedAtRaw = typeof req.body?.capturedAt === "string" ? req.body.capturedAt : null;
      const capturedAt = capturedAtRaw ? new Date(capturedAtRaw) : now;

      const shot = await prisma.monitoringScreenshot.create({
        data: {
          sessionId: session.id,
          deviceId: device.id,
          adminUserId: device.adminUserId,
          imageUrl,
          width: Number.isFinite(width) ? width : null,
          height: Number.isFinite(height) ? height : null,
          capturedAt: Number.isNaN(capturedAt.getTime()) ? now : capturedAt,
        },
      });

      return res.status(201).json({
        data: {
          id: shot.id,
          sessionId: session.id,
          imageUrl: shot.imageUrl,
          capturedAt: shot.capturedAt,
        },
      });
    } catch (err) {
      console.error("[monitor/screenshot]", err);
      return res.status(500).json({ error: "Failed to store screenshot" });
    }
  },
);

/** Admin: GET/PUT settings */
adminRouter.get("/settings", async (_req: AuthRequest, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ data: settings });
  } catch (err) {
    console.error("[admin/monitoring/settings GET]", err);
    return res.status(500).json({ error: "Failed to load monitoring settings" });
  }
});

adminRouter.put("/settings", async (req: AuthRequest, res) => {
  try {
    const enabled =
      typeof req.body?.enabled === "boolean" ? req.body.enabled : undefined;
    let captureIntervalSeconds: number | undefined;
    if (req.body?.captureIntervalSeconds != null) {
      const n = Number(req.body.captureIntervalSeconds);
      if (!Number.isFinite(n) || n < MIN_CAPTURE_INTERVAL_SECONDS || n > MAX_CAPTURE_INTERVAL_SECONDS) {
        return res.status(400).json({
          error: `captureIntervalSeconds must be between ${MIN_CAPTURE_INTERVAL_SECONDS} and ${MAX_CAPTURE_INTERVAL_SECONDS}`,
        });
      }
      captureIntervalSeconds = Math.round(n);
    }

    const settings = await prisma.monitoringSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        enabled: enabled ?? false,
        captureIntervalSeconds: captureIntervalSeconds ?? DEFAULT_CAPTURE_INTERVAL_SECONDS,
      },
      update: {
        ...(enabled !== undefined ? { enabled } : {}),
        ...(captureIntervalSeconds !== undefined ? { captureIntervalSeconds } : {}),
      },
    });
    return res.json({ data: settings });
  } catch (err) {
    console.error("[admin/monitoring/settings PUT]", err);
    return res.status(500).json({ error: "Failed to update monitoring settings" });
  }
});

adminRouter.get("/sessions", async (req: AuthRequest, res) => {
  try {
    const adminUserId = typeof req.query.adminUserId === "string" ? req.query.adminUserId : undefined;
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
    const take = Math.min(200, Math.max(1, Number(req.query.limit) || 50));

    const where: {
      adminUserId?: string;
      startedAt?: { gte?: Date; lte?: Date };
    } = {};
    if (adminUserId) where.adminUserId = adminUserId;
    if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
      where.startedAt = {};
      if (from && !Number.isNaN(from.getTime())) where.startedAt.gte = from;
      if (to && !Number.isNaN(to.getTime())) where.startedAt.lte = to;
    }

    const rows = await prisma.monitoringSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take,
      include: {
        adminUser: { select: { id: true, email: true, name: true } },
        device: {
          select: {
            id: true,
            deviceName: true,
            platform: true,
            lastSeenAt: true,
            revokedAt: true,
          },
        },
        _count: { select: { screenshots: true } },
      },
    });

    return res.json({
      data: rows.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        lastHeartbeatAt: s.lastHeartbeatAt,
        endedAt: s.endedAt,
        onlineMinutes: sessionDurationMinutes(s.startedAt, s.lastHeartbeatAt, s.endedAt),
        screenshotCount: s._count.screenshots,
        adminUser: s.adminUser,
        device: s.device,
      })),
    });
  } catch (err) {
    console.error("[admin/monitoring/sessions]", err);
    return res.status(500).json({ error: "Failed to list monitoring sessions" });
  }
});

adminRouter.get("/screenshots", async (req: AuthRequest, res) => {
  try {
    const adminUserId = typeof req.query.adminUserId === "string" ? req.query.adminUserId : undefined;
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
    const from = typeof req.query.from === "string" ? new Date(req.query.from) : undefined;
    const to = typeof req.query.to === "string" ? new Date(req.query.to) : undefined;
    const take = Math.min(200, Math.max(1, Number(req.query.limit) || 50));

    const where: {
      adminUserId?: string;
      sessionId?: string;
      capturedAt?: { gte?: Date; lte?: Date };
    } = {};
    if (adminUserId) where.adminUserId = adminUserId;
    if (sessionId) where.sessionId = sessionId;
    if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
      where.capturedAt = {};
      if (from && !Number.isNaN(from.getTime())) where.capturedAt.gte = from;
      if (to && !Number.isNaN(to.getTime())) where.capturedAt.lte = to;
    }

    const rows = await prisma.monitoringScreenshot.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      take,
      include: {
        adminUser: { select: { id: true, email: true, name: true } },
        device: { select: { id: true, deviceName: true, platform: true } },
        session: { select: { id: true, startedAt: true, endedAt: true } },
      },
    });

    return res.json({ data: rows });
  } catch (err) {
    console.error("[admin/monitoring/screenshots]", err);
    return res.status(500).json({ error: "Failed to list screenshots" });
  }
});

adminRouter.get("/devices", async (req: AuthRequest, res) => {
  try {
    const adminUserId = typeof req.query.adminUserId === "string" ? req.query.adminUserId : undefined;
    const rows = await prisma.monitoringDevice.findMany({
      where: adminUserId ? { adminUserId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        adminUser: { select: { id: true, email: true, name: true } },
        _count: { select: { sessions: true, screenshots: true } },
      },
    });
    return res.json({ data: rows });
  } catch (err) {
    console.error("[admin/monitoring/devices]", err);
    return res.status(500).json({ error: "Failed to list devices" });
  }
});

adminRouter.post("/devices/:id/revoke", async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const device = await prisma.monitoringDevice.findUnique({ where: { id } });
    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }
    const now = new Date();
    await prisma.$transaction([
      prisma.monitoringDevice.update({
        where: { id },
        data: { revokedAt: now },
      }),
      prisma.monitoringSession.updateMany({
        where: { deviceId: id, endedAt: null },
        data: { endedAt: now, lastHeartbeatAt: now },
      }),
    ]);
    return res.json({ data: { id, revokedAt: now } });
  } catch (err) {
    console.error("[admin/monitoring/devices/revoke]", err);
    return res.status(500).json({ error: "Failed to revoke device" });
  }
});

export const monitoringAgentRoutes = router;
export const monitoringAdminRoutes = adminRouter;
