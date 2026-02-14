import { Router, Request, Response } from "express";
import { getUsers, getUserStats } from "../services/userService";
import { initDatabase } from "../db/init";

const router = Router();

/**
 * GET /api/users?status=signed_up|not_engaged&limit=50&offset=0
 */
router.get("/users", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 300, 500);
    const offset = Number(req.query.offset) || 0;
    const status = req.query.status as string | undefined;
    const users = await getUsers(limit, offset, status);
    res.json({ users, count: users.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/connect/:source
 * Mock CRM connection — seeds database with demo data.
 */
router.post("/connect/:source", async (req: Request, res: Response) => {
  const source = req.params.source;
  if (!["salesforce", "hubspot"].includes(source)) {
    res.status(400).json({ error: "Invalid source. Use salesforce or hubspot" });
    return;
  }
  try {
    await initDatabase();
    const stats = await getUserStats();
    res.json({ message: `Connected to ${source} (mock)`, stats });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
