import pool from "./pool";
import { readFileSync } from "fs";
import path from "path";

/**
 * Run schema + seed SQL files to initialise the database.
 * Called from POST /connect/:source for the mock CRM flow.
 */
export async function initDatabase(): Promise<void> {
  const schema = readFileSync(
    path.resolve(__dirname, "../../sql/001_schema.sql"),
    "utf-8"
  );
  const seed = readFileSync(
    path.resolve(__dirname, "../../sql/002_seed.sql"),
    "utf-8"
  );
  await pool.query(schema);
  await pool.query(seed);
}
