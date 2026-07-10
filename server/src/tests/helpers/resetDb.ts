import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";

// Truncates auth-related tables and restarts their id sequences, so each test starts from a clean state
export async function resetDb() {
  await db.execute(
    sql`TRUNCATE TABLE refresh_tokens, user_providers, users RESTART IDENTITY CASCADE`,
  );
}