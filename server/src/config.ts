import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type Config = {
  db: DBConfig;
};

const dbURL = process.env.DB_URL;
if (!dbURL) {
  throw new Error("Missing environment variable: DB_URL");
}

// Centralized configuration object that provides database connection and migration settings to the application
export const config: Config = {
  db: {
    url: dbURL,
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },
};
