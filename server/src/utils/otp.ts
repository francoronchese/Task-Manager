import crypto from "crypto";

// Generates a cryptographically secure 6-digit OTP
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}
