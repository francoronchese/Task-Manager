import jwt from "jsonwebtoken";
import request from "supertest";
import app from "@app";
import { resetDb } from "../../helpers/resetDb.js";
import {
  createUser,
  saveEmailVerifyIssuedAt,
  verifyUserEmail,
} from "@db/queries/users.js";
import { generateEmailVerifyToken } from "@utils/tokens.js";

const registeredEmail = "test@example.com";

describe("GET /api/auth/verify-email", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("verifies the email with a valid token", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    const token = generateEmailVerifyToken(user.id);
    const decoded = jwt.decode(token) as { iat: number };
    await saveEmailVerifyIssuedAt(registeredEmail, new Date(decoded.iat * 1000));

    const res = await request(app).get("/api/auth/verify-email").query({ token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Email verified successfully" });
  });

  it("rejects when no token is provided", async () => {
    const res = await request(app).get("/api/auth/verify-email");

    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/verify-email")
      .query({ token: "not-a-valid-jwt" });

    expect(res.status).toBe(401);
  });

  it("rejects a token for a user that no longer exists", async () => {
    const token = generateEmailVerifyToken(999999);

    const res = await request(app).get("/api/auth/verify-email").query({ token });

    expect(res.status).toBe(404);
  });

  it("confirms without error when the email is already verified", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    const token = generateEmailVerifyToken(user.id);

    const res = await request(app).get("/api/auth/verify-email").query({ token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Email already verified" });
  });

  it("rejects a token issued before the most recent verification email was requested", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    const token = generateEmailVerifyToken(user.id);
    const decoded = jwt.decode(token) as { iat: number };
    // Simulates the user requesting a newer verification email after this token was issued
    await saveEmailVerifyIssuedAt(
      registeredEmail,
      new Date(decoded.iat * 1000 + 5000),
    );

    const res = await request(app).get("/api/auth/verify-email").query({ token });

    expect(res.status).toBe(401);
  });
});
