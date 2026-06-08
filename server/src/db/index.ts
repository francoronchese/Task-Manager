import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";
import { config } from "../config.js";

//Physical PostgreSQL connection using the database URL from config
const conn = postgres(config.db.url);
// Main Drizzle client that binds the PostgreSQL connection and schema models.
// This db object is used throughout the app to run queries.
export const db = drizzle(conn, { schema });
