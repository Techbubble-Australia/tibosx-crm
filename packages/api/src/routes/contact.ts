import { Router } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router = Router();

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().optional(),
  country: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

router.post("/", async (req, res) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    
    const submission = await prisma.contactSubmission.create({
      data: validatedData,
    });
    
    // Here you could also send an email notification
    // await sendEmailNotification(submission);
    
    res.status(201).json({ 
      message: "Thank you for your message. We'll get back to you within 4 business hours.",
      data: { id: submission.id }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Validation error", 
        details: error.errors 
      });
    }
    console.error("Error saving contact submission:", error);
    res.status(500).json({ error: "Failed to submit form. Please try again." });
  }
});

export { router as contactRoutes };
