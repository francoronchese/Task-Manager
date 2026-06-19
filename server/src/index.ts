import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "./config.js";
import express from "express";
import authRouter from "./routes/auth.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Single-use PostgreSQL connection reserved for applying pending migrations before the server starts.
// max: 1 limits the connection pool to one connection, since migrations only need one at a time.
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Health check endpoint to verify the server is running
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "Server is running OK" });
});

// API routes
app.use("/api/auth", authRouter);

// Centralized error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
