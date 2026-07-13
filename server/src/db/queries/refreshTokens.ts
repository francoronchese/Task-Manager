import { eq } from "drizzle-orm";
import { db } from "@db/index.js";
import { refreshTokens } from "@db/schema/index.js";

type CreateRefreshTokenData = {
  userId: number;
  token: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  device?: string;
};

// LOGIN - Inserts a new refresh token record into the database
export async function createRefreshToken(data: CreateRefreshTokenData) {
  // Set expiration date to 7 days from now (7 days * 24h * 60min * 60sec * 1000ms)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ ...data, expiresAt });
}

// REFRESH TOKEN - Finds a refresh token by its value
export async function findRefreshToken(token: string) {
  const [refreshToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
  return refreshToken;
}

// LOGOUT - Revokes a refresh token by setting revokedAt to the current date
export async function revokeRefreshToken(token: string) {
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.token, token));
}