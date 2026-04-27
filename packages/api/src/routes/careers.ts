import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const careerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  company: z.string().optional(),
  resumeUrl: z.string().optional(),
  message: z.string().optional(),
});

router.post("/apply", async (req, res) => {
  try {
    const validatedData = careerSchema.parse(req.body);
    
    const application = await prisma.careerApplication.create({
      data: validatedData,
    });
    
    res.status(201).json({ 
      message: "Thank you for your application. Our team will review and reach out within 48 hours.",
      data: { id: application.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    console.error("Error saving career application:", error);
    res.status(500).json({ error: "Failed to submit application. Please try again." });
  }
});

// Admin: list all career applications
router.get("/admin/applications", async (req, res) => {
  try {
    const applications = await prisma.careerApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: applications });
  } catch (error) {
    console.error("Error fetching career applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Admin: delete application
router.delete("/admin/applications/:id", async (req, res) => {
  try {
    await prisma.careerApplication.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Deleted" });
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("Error deleting career application:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export { router as careerRoutes };
