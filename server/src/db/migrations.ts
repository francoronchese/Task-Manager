import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import {config} from "@config";

// Single-use PostgreSQL connection reserved for applying pending migrations before the server starts.
// max: 1 limits the connection pool to one connection, since migrations only need one at a time.
export async function runMigrations() {
  const migrationClient = postgres(config.db.url, { max: 1 });
  await migrate(drizzle(migrationClient), config.db.migrationConfig);
  await migrationClient.end();
}