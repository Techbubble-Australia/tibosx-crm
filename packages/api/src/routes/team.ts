import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  department: z.string().min(1),
  description: z.string().default(""),
  imageUrl: z.string().default(""),
  order: z.number().int().default(0),
  published: z.boolean().default(true),
});

// Public: list published team members
router.get("/", async (req, res) => {
  try {
    const where: { published: boolean; department?: string } = { published: true };
    if (req.query.department) {
      where.department = req.query.department as string;
    }
    const members = await prisma.teamMember.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json({ data: members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Admin: list all team members (including unpublished)
router.get("/admin/all", async (req, res) => {
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    res.json({ data: members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Failed to fetch team members" });
  }
});

// Admin: create team member
router.post("/", async (req, res) => {
  try {
    const data = teamMemberSchema.parse(req.body);
    const member = await prisma.teamMember.create({ data });
    res.status(201).json({ data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating team member:", error);
    res.status(500).json({ error: "Failed to create team member" });
  }
});

// Admin: update team member
router.put("/:id", async (req, res) => {
  try {
    const data = teamMemberSchema.partial().parse(req.body);
    const member = await prisma.teamMember.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating team member:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// Admin: delete team member
router.delete("/:id", async (req, res) => {
  try {
    await prisma.teamMember.delete({ where: { id: req.params.id } });
    res.json({ message: "Team member deleted" });
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).json({ error: "Failed to delete team member" });
  }
});

export { router as teamRoutes };
