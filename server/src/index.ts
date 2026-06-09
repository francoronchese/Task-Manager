import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "./config.js";
import express from "express";

// Single-use PostgreSQL connection reserved for applying pending migrations before the server starts. 
// max: 1 limits the connection pool to one connection, since migrations only need one at a time.
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running in ${PORT} mode at http://localhost:${PORT}`);
});
