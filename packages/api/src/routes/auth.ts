import { Router } from "express";
import { z } from "zod";
import { generateToken } from "../middleware/auth";

const router = Router();

// Simple admin authentication
// In production, use a proper auth solution with hashed passwords

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Check credentials against environment variables
    // In production, use a proper user database with hashed passwords
    const adminEmail = process.env.ADMIN_EMAIL || "admin@techbubble.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = generateToken({
      id: "admin",
      email: adminEmail,
      role: "admin",
    });
    
    res.json({
      message: "Login successful",
      data: {
        token,
        user: {
          id: "admin",
          email: adminEmail,
          role: "admin",
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  // This would normally verify the token and return user info
  // For simplicity, we'll just return a success message
  res.json({ message: "Authenticated" });
});

export { router as authRoutes };
