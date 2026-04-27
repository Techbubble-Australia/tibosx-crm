import { Router, type IRouter } from "express";
import { z } from "zod";
import { previewSigningAvailable, signCaseStudyPreviewToken } from "../lib/caseStudyPreviewToken";

const router: IRouter = Router();

router.post("/preview-token", (req, res) => {
  const parsed = z.object({ slug: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  if (!previewSigningAvailable()) {
    return res.status(503).json({
      error:
        "Case study preview is not configured. Set CASE_STUDY_PREVIEW_SECRET on the API (or JWT_SECRET in non-production).",
    });
  }
  const token = signCaseStudyPreviewToken(parsed.data.slug);
  if (!token) {
    return res.status(503).json({ error: "Could not sign preview token" });
  }
  return res.json({ data: { token } });
});

export { router as caseStudyPreviewRouter };
