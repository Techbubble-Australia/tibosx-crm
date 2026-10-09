import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  clientId: z.string().min(1),
  memberUserIds: z.array(z.string().min(1)).max(50).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  clientId: z.string().min(1).optional(),
  memberUserIds: z.array(z.string().min(1)).max(50).optional(),
});

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.workspaceGroup.findMany({
      orderBy: { name: "asc" },
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: {
            adminUser: { select: { id: true, email: true, name: true, role: true } },
          },
        },
      },
    });
    res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        clientId: row.clientId,
        clientName: row.client.name,
        members: row.members.map((member) => ({
          id: member.id,
          adminUserId: member.adminUserId,
          email: member.adminUser.email,
          name: member.adminUser.name,
          role: member.adminUser.role,
        })),
      })),
    });
  } catch (error) {
    console.error("Error listing workspace groups:", error);
    res.status(500).json({ error: "Failed to list groups" });
  }
});

router.post("/", async (req, res) => {
  try {
    const input = createSchema.parse(req.body);
    const client = await prisma.client.findUnique({ where: { id: input.clientId } });
    if (!client) return res.status(400).json({ error: "Client not found" });

    const memberIds = input.memberUserIds ?? [];
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.workspaceGroup.create({
        data: { name: input.name.trim(), clientId: input.clientId },
      });
      if (memberIds.length) {
        await tx.workspaceGroupMember.createMany({
          data: memberIds.map((adminUserId) => ({ groupId: created.id, adminUserId })),
          skipDuplicates: true,
        });
      }
      return created;
    });
    res.status(201).json({ data: { id: row.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating workspace group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const input = updateSchema.parse(req.body);
    const existing = await prisma.workspaceGroup.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (input.clientId) {
      const client = await prisma.client.findUnique({ where: { id: input.clientId } });
      if (!client) return res.status(400).json({ error: "Client not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.workspaceGroup.update({
        where: { id: req.params.id },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        },
      });
      if (input.memberUserIds !== undefined) {
        await tx.workspaceGroupMember.deleteMany({ where: { groupId: req.params.id } });
        if (input.memberUserIds.length) {
          await tx.workspaceGroupMember.createMany({
            data: input.memberUserIds.map((adminUserId) => ({
              groupId: req.params.id,
              adminUserId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });
    res.json({ data: { ok: true } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating workspace group:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.workspaceGroup.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  } catch (error) {
    console.error("Error deleting workspace group:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

export { router as workspaceGroupRoutes };
