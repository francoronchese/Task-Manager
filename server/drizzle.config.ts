import { defineConfig } from "drizzle-kit";

process.loadEnvFile();

const dbURL = process.env.DB_URL;
if (!dbURL) {
  throw new Error("Missing environment variable: DB_URL");
}

export default defineConfig({
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbURL,
  },
});
