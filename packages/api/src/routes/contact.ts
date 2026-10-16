import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { notifyAsync } from "../lib/notifications";

const router: IRouter = Router();

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

    notifyAsync("contact.submitted", { submissionId: submission.id });

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

// Admin: list all contact submissions
router.get("/admin/submissions", async (req, res) => {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: submissions });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Admin: delete submission
router.delete("/admin/submissions/:id", async (req, res) => {
  try {
    await prisma.contactSubmission.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Deleted" });
  } catch (error: unknown) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : "";
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
    console.error("Error deleting contact submission:", error);
    res.status(500).json({ error: "Failed to delete submission" });
  }
});

export { router as contactRoutes };
