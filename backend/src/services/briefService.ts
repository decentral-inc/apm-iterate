import axios from "axios";
import pool from "../db/pool";
import { getUsers, getUserStats } from "./userService";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

export interface Brief {
  id: string;
  content: any;
  summary: string;
  confidence_score: number;
  agent_outputs: any;
  feedback: string | null;
  parent_brief_id: string | null;
  created_at: string;
}

/**
 * Call Flask multi-agent service and persist the generated brief.
 */
export async function generateBrief(
  parentBriefId?: string,
  feedback?: string
): Promise<Brief> {
  // Gather context for agents
  const [users, stats] = await Promise.all([getUsers(300), getUserStats()]);

  // Build payload for the AI service
  const payload: any = { users, stats };
  if (feedback && parentBriefId) {
    // Fetch previous brief so agents can improve on it
    const prev = await pool.query("SELECT * FROM briefs WHERE id = $1", [
      parentBriefId,
    ]);
    if (prev.rows.length) {
      payload.previous_brief = prev.rows[0].content;
      payload.feedback = feedback;
    }
  }

  // Call Flask /analyze
  const { data } = await axios.post(`${AI_URL}/analyze`, payload, {
    timeout: 60_000,
  });

  // Persist
  const { rows } = await pool.query(
    `INSERT INTO briefs (content, summary, confidence_score, agent_outputs, feedback, parent_brief_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      JSON.stringify(data.brief),
      data.brief?.executive_summary ?? "",
      data.confidence_score ?? 0,
      JSON.stringify(data.agent_outputs),
      feedback ?? null,
      parentBriefId ?? null,
    ]
  );

  return rows[0];
}

export async function getLatestBrief(): Promise<Brief | null> {
  const { rows } = await pool.query(
    "SELECT * FROM briefs ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0] ?? null;
}
