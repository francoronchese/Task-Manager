import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "@config";

// Generates a short-lived access token for authenticating API requests
export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: "15m" });
}

// Generates a long-lived refresh token used to obtain new access tokens
// jti is a random unique id per token, so two tokens issued for the same user in the same second are never identical (refreshTokens.token is unique in the DB)
export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId, jti: crypto.randomUUID() }, config.jwt.refreshSecret, { expiresIn: "7d" });
}

// Generates a 24-hour token used to verify the user's email address
export function generateEmailVerifyToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: "24h" });
}
