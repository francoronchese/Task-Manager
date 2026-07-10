import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import z from "zod";
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../middlewares/errorHandler.js";
import {
  generateAccessToken,
  generateEmailVerifyToken,
  generateRefreshToken,
} from "../utils/tokens.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  resetUserPassword,
  saveEmailVerifyIssuedAt,
  savePasswordOtp,
  verifyUserEmail,
} from "../db/queries/users.js";
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
} from "../db/queries/refreshTokens.js";
import {
  createUserProvider,
  findUserProvider,
} from "../db/queries/userProviders.js";
import { config } from "../config.js";
import { generateOtp } from "../utils/otp.js";
import { sendOtpEmail, sendVerifyEmail } from "../utils/email.js";
import { getGoogleAuthUrl, oauth2Client } from "../utils/googleOAuth.js";
import { google } from "googleapis";

// REGISTER CONTROLLER
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Validate request body against the register schema
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError({ errors: z.flattenError(result.error).fieldErrors }),
    );
  }

  const { name, email, password, avatar } = result.data;

  // Check if email is already registered
  const user = await findUserByEmail(email);
  if (user) {
    return next(new ConflictError({ error: "Email already in use" }));
  }

  // Hash the password before storing
  const passwordHash = await argon2.hash(password);

  // Insert the new user into the database
  const newUser = await createUser({ name, email, passwordHash, avatar });

  // Register "local" as this user's auth provider
  await createUserProvider({ userId: newUser.id, provider: "local" });

  // Generate email verification token and extract its issued-at timestamp
  const verifyToken = generateEmailVerifyToken(newUser.id);
  const decoded = jwt.decode(verifyToken) as { iat: number };
  const verifyUrl = `${config.clientUrl}/verify-email?token=${verifyToken}`;
  await saveEmailVerifyIssuedAt(email, new Date(decoded.iat * 1000));
  await sendVerifyEmail(email, verifyUrl);

  return res.status(201).json({ message: "User registered successfully" });
}

// LOGIN CONTROLLER
export async function login(req: Request, res: Response, next: NextFunction) {
  // Validate request body against the login schema
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError({ errors: z.flattenError(result.error).fieldErrors }),
    );
  }

  const { email, password } = result.data;

  // Check if user exists
  const user = await findUserByEmail(email);
  if (!user) {
    return next(new UnauthorizedError({ error: "Invalid credentials" }));
  }

  // Verify password
  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) {
    return next(new UnauthorizedError({ error: "Invalid credentials" }));
  }

  // Block login until the user has verified their email
  if (!user.verifyEmail) {
    return next(
      new ForbiddenError({ error: "Please verify your email before logging in" }),
    );
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in the database
  await createRefreshToken({ userId: user.id, token: refreshToken });

  return res.json({ accessToken, refreshToken });
}

// REFRESH TOKEN CONTROLLER
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { refreshToken: token } = req.body;
  if (!token) {
    return next(new UnauthorizedError({ error: "No token provided" }));
  }

  // Verify token signature
  let payload: { userId: number };
  try {
    // jwt.verify() returns JwtPayload, so a type assertion is used to tell TypeScript the payload only contains userId
    payload = jwt.verify(token, config.jwt.refreshSecret) as { userId: number };
  } catch {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }

  // Check token exists in the database
  const storedToken = await findRefreshToken(token);
  if (!storedToken) {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }

  // Check token is not revoked
  if (storedToken.revokedAt) {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }

  // Generate new access token
  const accessToken = generateAccessToken(payload.userId);
  return res.json({ accessToken });
}

// LOGOUT CONTROLLER
export async function logout(req: Request, res: Response, next: NextFunction) {
  const { refreshToken: token } = req.body;
  if (!token) {
    return next(new UnauthorizedError({ error: "No token provided" }));
  }
  // Revoke the refresh token
  await revokeRefreshToken(token);
  return res.json({ message: "Logged out successfully" });
}

// FORGOT PASSWORD CONTROLLER
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Validate request body against the forgot password schema
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError({ errors: z.flattenError(result.error).fieldErrors }),
    );
  }

  const { email } = result.data;

  // Check if user exists
  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({
      message: "If that email is registered, you will receive an OTP",
    });
  }

  // Generate OTP and set expiry to 15 minutes from now
  const otp = generateOtp();
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  // Save OTP to the database
  await savePasswordOtp(email, otp, expiry);
  //Send OTP via email with Resend
  await sendOtpEmail(email, otp);
  return res.json({
    message: "If that email is registered, you will receive an OTP",
  });
}

// RESET PASSWORD CONTROLLER
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Validate request body against the reset password schema
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new ValidationError({ errors: z.flattenError(result.error).fieldErrors }),
    );
  }

  const { email, otp, password } = result.data;
  // Check if user exists
  const user = await findUserByEmail(email);
  if (!user) {
    return next(new NotFoundError({ error: "User not found" }));
  }

  // Check if OTP is expired
  if (!user.forgotPasswordExpiry || user.forgotPasswordExpiry < new Date()) {
    return next(new UnauthorizedError({ error: "OTP has expired" }));
  }

  // Check if OTP matches
  if (user.forgotPasswordOtp !== otp) {
    return next(new UnauthorizedError({ error: "Invalid OTP" }));
  }

  // Hash the new password
  const passwordHash = await argon2.hash(password);
  // Update the user's password and clear the OTP fields
  await resetUserPassword(email, passwordHash);
  return res.json({ message: "Password reset successfully" });
}

// VERIFY EMAIL CONTROLLER
export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return next(new UnauthorizedError({ error: "No token provided" }));
  }
  // Verify token signature and extract userId
  let payload: { userId: number; iat: number };
  try {
    // jwt.verify() returns JwtPayload, so a type assertion is used to tell TypeScript the payload only contains userId and iat
    payload = jwt.verify(token, config.jwt.accessSecret) as {
      userId: number;
      iat: number;
    };
  } catch {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }

  // Check if user exists
  const user = await findUserById(payload.userId);
  if (!user) {
    return next(new NotFoundError({ error: "User not found" }));
  }

  // Check if email is already verified
  if (user.verifyEmail) {
    return res.json({ message: "Email already verified" });
  }

  // Check if token was issued before the last verification email was sent
  // payload.iat is the token's issued-at timestamp in seconds, so it must be converted to milliseconds to create a Date
  if (
    user.verifyEmailIssuedAt &&
    new Date(payload.iat * 1000) < user.verifyEmailIssuedAt
  ) {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }

  // Mark email as verified
  await verifyUserEmail(payload.userId);
  return res.json({ message: "Email verified successfully" });
}

// GOOGLE AUTH CONTROLLER - Redirects the user to Google's consent page
export function googleAuth(_req: Request, res: Response) {
  const url = getGoogleAuthUrl();
  return res.redirect(url);
}

// GOOGLE CALLBACK CONTROLLER - Handles the callback from Google after the user grants permission
export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Google sends the authorization code as a query parameter after the user grants permission
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    return next(
      new UnauthorizedError({ error: "No authorization code provided" }),
    );
  }

  // This will provide an object with the access_token and refresh_token from Google
  let tokens;
  try {
    ({ tokens } = await oauth2Client.getToken(code));
  } catch {
    return next(
      new UnauthorizedError({ error: "Invalid or expired authorization code" }),
    );
  }
  // Set the tokens on the OAuth2 client so it can make authenticated requests to Google APIs on behalf of the user
  oauth2Client.setCredentials(tokens);

  // Get the user's profile from Google using the oauth2 v2 API
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get({});
  if (!data.email || !data.name || !data.verified_email) {
    return next(
      new UnauthorizedError({
        error: "Could not retrieve verified user info from Google",
      }),
    );
  }

  // Check if user already exists - Google OAuth handles both registration and login.
  // If the user exists, they are logged in. If not, a new account is created.
  let user = await findUserByEmail(data.email);
  if (!user) {
    // Create a new user with a random password since they authenticate via Google
    const passwordHash = await argon2.hash(crypto.randomUUID());
    user = await createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      avatar: data.picture ?? undefined,
    });
    // Google already verified this email, so the account starts as verified
    await verifyUserEmail(user.id);
  }

  // Link the Google provider to this user if it isn't already linked
  const existingProvider = await findUserProvider(user.id, "google");
  if (!existingProvider) {
    await createUserProvider({
      userId: user.id,
      provider: "google",
      providerId: data.id ?? undefined,
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in the database
  await createRefreshToken({ userId: user.id, token: refreshToken });

  // Redirect to the frontend with the tokens
  return res.redirect(
    `${config.clientUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
  );
}
