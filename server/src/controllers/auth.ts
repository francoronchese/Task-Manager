import type { Request, Response, NextFunction } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import z from "zod";
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from "../middlewares/errorHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens.js";
import { loginSchema, registerSchema } from "../validators/auth.js";
import { createUser, findUserByEmail } from "../db/queries/users.js";
import { createRefreshToken, findRefreshToken, revokeRefreshToken } from "../db/queries/refreshTokens.js";
import { config } from "../config.js";

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
  await createUser({ name, email, passwordHash, avatar });

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

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Save refresh token in the database
  await createRefreshToken({ userId: user.id, token: refreshToken });

  return res.json({ accessToken, refreshToken });
}

// REFRESH TOKEN CONTROLLER
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
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