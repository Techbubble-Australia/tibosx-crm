import { Router } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router = Router();

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

export { router as careerRoutes };
