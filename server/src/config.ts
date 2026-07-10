import type { MigrationConfig } from "drizzle-orm/migrator";

// Vitest sets NODE_ENV to "test" automatically, so tests load .env.test instead of the regular .env and never touch the dev database
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
process.loadEnvFile(envFile);

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type JWTConfig = {
  accessSecret: string;
  refreshSecret: string;
};

type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

type Config = {
  db: DBConfig;
  jwt: JWTConfig;
  port: number;
  resendApiKey: string;
  clientUrl: string;
  google: GoogleConfig;
};

const dbURL = process.env.DB_URL;
if (!dbURL) throw new Error("Missing environment variable: DB_URL");

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret)
  throw new Error("Missing environment variable: JWT_ACCESS_SECRET");

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtRefreshSecret)
  throw new Error("Missing environment variable: JWT_REFRESH_SECRET");

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey)
  throw new Error("Missing environment variable: RESEND_API_KEY");

const clientUrl = process.env.CLIENT_URL;
if (!clientUrl) throw new Error("Missing environment variable: CLIENT_URL");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (!googleClientId)
  throw new Error("Missing environment variable: GOOGLE_CLIENT_ID");
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientSecret)
  throw new Error("Missing environment variable: GOOGLE_CLIENT_SECRET");
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;
if (!googleCallbackUrl)
  throw new Error("Missing environment variable: GOOGLE_CALLBACK_URL");

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
  resendApiKey,
  clientUrl,
  google: {
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    callbackUrl: googleCallbackUrl,
  },
};
