import { Router, Request, Response } from "express";
import { generateBrief, getLatestBrief } from "../services/briefService";

const router = Router();

/**
 * POST /api/generate-brief
 * Triggers multi-agent analysis and returns the generated meeting brief.
 */
router.post("/generate-brief", async (_req: Request, res: Response) => {
  try {
    const brief = await generateBrief();
    res.json(brief);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/feedback
 * Body: { brief_id, feedback }
 * Triggers re-generation using critic agent feedback loop.
 */
router.post("/feedback", async (req: Request, res: Response) => {
  try {
    const { brief_id, feedback } = req.body;
    if (!brief_id || !feedback) {
      res.status(400).json({ error: "brief_id and feedback are required" });
      return;
    }
    const brief = await generateBrief(brief_id, feedback);
    res.json(brief);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/brief
 * Returns the latest generated brief.
 */
router.get("/brief", async (_req: Request, res: Response) => {
  try {
    const brief = await getLatestBrief();
    if (!brief) {
      res.status(404).json({ error: "No brief generated yet" });
      return;
    }
    res.json(brief);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
