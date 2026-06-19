import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Generates a short-lived access token for authenticating API requests
export function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: "15m" });
}

// Generates a long-lived refresh token used to obtain new access tokens
export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: "7d" });
}
