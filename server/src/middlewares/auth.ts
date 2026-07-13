import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@config";
import { UnauthorizedError } from "./errorHandler.js";

// Verifies the access token from the Authorization header and attaches the userId to the request
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError({ error: "No token provided" }));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as {
      userId: number;
    };
    req.userId = payload.userId;
    return next();
  } catch {
    return next(new UnauthorizedError({ error: "Invalid or expired token" }));
  }
}
