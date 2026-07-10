import { runMigrations } from "./src/db/migrations.js";

// Applies pending migrations to the test database once before the test suite runs
export default async function setup() {
  await runMigrations();
}
