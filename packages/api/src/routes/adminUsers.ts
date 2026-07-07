import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const ROLES = ["admin", "editor", "viewer"] as const;

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  password: z.string().min(8),
  role: z.enum(ROLES).default("editor"),
  active: z.boolean().default(true),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(200).optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
});

function sanitizeUser(row: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.adminUser.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ data: rows.map(sanitizeUser) });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.adminUser.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: sanitizeUser(row) });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const row = await prisma.adminUser.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash,
        role: data.role,
        active: data.active,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(201).json({ data: sanitizeUser(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating admin user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const updateData: Record<string, unknown> = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const row = await prisma.adminUser.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json({ data: sanitizeUser(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating admin user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    if (req.user?.id === req.params.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: "Not found" });

    if (target.role === "admin") {
      const adminCount = await prisma.adminUser.count({ where: { role: "admin", active: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last active admin" });
      }
    }

    await prisma.adminUser.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export { router as adminUserRoutes };
