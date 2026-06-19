import type { Request, Response, NextFunction } from "express";

// These classes extend the built-in JavaScript Error class to create domain-specific error types.
// Each one carries a typed payload object that is sent directly as the JSON response body.
export class ValidationError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "ConflictError";
  }
}

export class InternalServerError extends Error {
  constructor(public payload: object) {
    super();
    this.name = "InternalServerError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  switch (true) {
    case err instanceof ValidationError:
      return res.status(400).json(err.payload);
    case err instanceof UnauthorizedError:
      return res.status(401).json(err.payload);
    case err instanceof ForbiddenError:
      return res.status(403).json(err.payload);
    case err instanceof NotFoundError:
      return res.status(404).json(err.payload);
    case err instanceof ConflictError:
      return res.status(409).json(err.payload);
    case err instanceof InternalServerError:
      return res.status(500).json(err.payload);
    default:
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
  }
}
