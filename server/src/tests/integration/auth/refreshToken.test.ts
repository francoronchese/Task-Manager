import request from "supertest";
import app from "@app";
import { resetDb } from "../../helpers/resetDb.js";
import { createUser, verifyUserEmail } from "@db/queries/users.js";
import { createRefreshToken } from "@db/queries/refreshTokens.js";
import { generateRefreshToken } from "@utils/tokens.js";

let userId: number;

describe("POST /api/auth/refresh-token", () => {
  beforeEach(async () => {
    await resetDb();
    const user = await createUser({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    userId = user.id;
  });

  it("returns a new access token for a valid refresh token", async () => {
    const token = generateRefreshToken(userId);
    await createRefreshToken({ userId, token });

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("rejects when no token is provided", async () => {
    const res = await request(app).post("/api/auth/refresh-token").send({});

    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: "not-a-valid-jwt" });

    expect(res.status).toBe(401);
  });

  it("rejects a token that doesn't exist in the database", async () => {
    // Valid signature, but never saved via createRefreshToken
    const token = generateRefreshToken(userId);

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
  });

  it("rejects a revoked token", async () => {
    const token = generateRefreshToken(userId);
    await createRefreshToken({ userId, token });
    await request(app).post("/api/auth/logout").send({ refreshToken: token });

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
  });
});
