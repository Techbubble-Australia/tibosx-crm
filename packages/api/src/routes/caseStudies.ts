import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { verifyCaseStudyPreviewToken } from "../lib/caseStudyPreviewToken";

const router: IRouter = Router();

// Validation schema for case study
const caseStudySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  category: z.string().min(1),
  clientName: z.string().min(1),
  
  heroStat1Value: z.string(),
  heroStat1Label: z.string(),
  heroStat2Value: z.string(),
  heroStat2Label: z.string(),
  heroStat3Value: z.string(),
  heroStat3Label: z.string(),
  
  featuredImage: z.string(),
  bannerImages: z.array(z.string()).default([]),
  contentImage: z.string(),

  backgroundTitle: z.string(),
  backgroundContent: z.string(),
  
  challengeTitle: z.string(),
  challengeContent: z.string(),
  
  challengeStat1Value: z.string(),
  challengeStat1Label: z.string(),
  challengeStat2Value: z.string(),
  challengeStat2Label: z.string(),
  challengeStat3Value: z.string(),
  challengeStat3Label: z.string(),
  
  problem1Title: z.string(),
  problem1Content: z.string(),
  problem2Title: z.string(),
  problem2Content: z.string(),
  problem3Title: z.string(),
  problem3Content: z.string(),
  problem4Title: z.string(),
  problem4Content: z.string(),
  
  solutionTitle: z.string(),
  solutionContent: z.string(),
  
  phase1Title: z.string(),
  phase1Duration: z.string(),
  phase1Content: z.string(),
  phase1Tags: z.array(z.string()),
  
  phase2Title: z.string(),
  phase2Duration: z.string(),
  phase2Content: z.string(),
  phase2Tags: z.array(z.string()),
  
  phase3Title: z.string(),
  phase3Duration: z.string(),
  phase3Content: z.string(),
  phase3Tags: z.array(z.string()),
  
  phase4Title: z.string().optional().nullable(),
  phase4Duration: z.string().optional().nullable(),
  phase4Content: z.string().optional().nullable(),
  phase4Tags: z.array(z.string()).optional(),
  
  techStackTitle: z.string(),
  techStackIntro: z.string(),
  
  tech1Name: z.string(),
  tech1Description: z.string(),
  tech1Icon: z.string(),
  tech2Name: z.string(),
  tech2Description: z.string(),
  tech2Icon: z.string(),
  tech3Name: z.string(),
  tech3Description: z.string(),
  tech3Icon: z.string(),
  tech4Name: z.string(),
  tech4Description: z.string(),
  tech4Icon: z.string(),
  tech5Name: z.string(),
  tech5Description: z.string(),
  tech5Icon: z.string(),
  tech6Name: z.string(),
  tech6Description: z.string(),
  tech6Icon: z.string(),
  
  testimonialQuote: z.string(),
  testimonialAuthorName: z.string(),
  testimonialAuthorTitle: z.string(),
  testimonialAuthorCompany: z.string(),
  testimonialAuthorInitials: z.string(),
  
  resultsTitle: z.string(),
  resultsContent: z.string(),
  
  resultStat1Value: z.string(),
  resultStat1Label: z.string(),
  resultStat2Value: z.string(),
  resultStat2Label: z.string(),
  resultStat3Value: z.string(),
  resultStat3Label: z.string(),
  
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

// GET categories (public) — register before /:id so "meta" is not captured as an id
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await prisma.caseStudy.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ["category"],
    });
    
    res.json({ data: categories.map((c: { category: string }) => c.category) });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET all case studies (public)
router.get("/", async (req, res) => {
  try {
    const { category, limit = "10", page = "1" } = req.query;
    
    const where = {
      published: true,
      ...(category && category !== "All" ? { category: category as string } : {}),
    };
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [caseStudies, total] = await Promise.all([
      prisma.caseStudy.findMany({
        where,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: parseInt(limit as string),
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          category: true,
          clientName: true,
          featuredImage: true,
          featured: true,
          heroStat1Value: true,
          heroStat1Label: true,
          heroStat2Value: true,
          heroStat2Label: true,
          heroStat3Value: true,
          heroStat3Label: true,
          createdAt: true,
        },
      }),
      prisma.caseStudy.count({ where }),
    ]);
    
    res.json({
      data: caseStudies,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching case studies:", error);
    res.status(500).json({ error: "Failed to fetch case studies" });
  }
});

// GET all case studies (admin — drafts + published, includes `published` for status UI)
router.get("/admin/all", async (req, res) => {
  try {
    const rows = await prisma.caseStudy.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        clientName: true,
        published: true,
        createdAt: true,
      },
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching case studies (admin):", error);
    res.status(500).json({ error: "Failed to fetch case studies" });
  }
});

// GET single case study by slug (public). Optional ?preview=<signed-token> shows drafts (admin-issued).
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const preview =
      typeof req.query.preview === "string" && req.query.preview.length > 0
        ? req.query.preview
        : undefined;
    const allowDraft = preview ? verifyCaseStudyPreviewToken(preview, slug) : false;

    const row = await prisma.caseStudy.findUnique({ where: { slug } });
    if (!row) {
      return res.status(404).json({ error: "Case study not found" });
    }
    if (!row.published && !allowDraft) {
      return res.status(404).json({ error: "Case study not found" });
    }

    res.json({ data: row });
  } catch (error) {
    console.error("Error fetching case study:", error);
    res.status(500).json({ error: "Failed to fetch case study" });
  }
});

// GET single case study by ID (admin)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const caseStudy = await prisma.caseStudy.findUnique({
      where: { id },
    });
    
    if (!caseStudy) {
      return res.status(404).json({ error: "Case study not found" });
    }
    
    res.json({ data: caseStudy });
  } catch (error) {
    console.error("Error fetching case study:", error);
    res.status(500).json({ error: "Failed to fetch case study" });
  }
});

// POST create case study (admin)
router.post("/", async (req, res) => {
  try {
    const validatedData = caseStudySchema.parse(req.body);
    
    const caseStudy = await prisma.caseStudy.create({
      data: validatedData,
    });
    
    res.status(201).json({ data: caseStudy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating case study:", error);
    res.status(500).json({ error: "Failed to create case study" });
  }
});

// PUT update case study (admin)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = caseStudySchema.partial().parse(req.body);
    
    const caseStudy = await prisma.caseStudy.update({
      where: { id },
      data: validatedData,
    });
    
    res.json({ data: caseStudy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating case study:", error);
    res.status(500).json({ error: "Failed to update case study" });
  }
});

// DELETE case study (admin)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.caseStudy.delete({
      where: { id },
    });
    
    res.json({ message: "Case study deleted successfully" });
  } catch (error) {
    console.error("Error deleting case study:", error);
    res.status(500).json({ error: "Failed to delete case study" });
  }
});

export { router as caseStudyRoutes };
