import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type JWTConfig = {
  accessSecret: string;
  refreshSecret: string;
};

type Config = {
  db: DBConfig;
  jwt: JWTConfig;
  port: number;
};

const dbURL = process.env.DB_URL;
if (!dbURL) throw new Error("Missing environment variable: DB_URL");

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret)
  throw new Error("Missing environment variable: JWT_ACCESS_SECRET");

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtRefreshSecret)
  throw new Error("Missing environment variable: JWT_REFRESH_SECRET");

// Centralized configuration object that provides database connection and migration settings to the application
export const config: Config = {
  db: {
    url: dbURL,
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },
  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
  },
  port: Number(process.env.PORT) || 3000,
};
