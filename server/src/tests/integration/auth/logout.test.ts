import request from "supertest";
import app from "../../../app.js";
import { resetDb } from "../../helpers/resetDb.js";
import { createUser, verifyUserEmail } from "../../../db/queries/users.js";
import {
  createRefreshToken,
  findRefreshToken,
} from "../../../db/queries/refreshTokens.js";
import { generateRefreshToken } from "../../../utils/tokens.js";

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("revokes the refresh token", async () => {
    const user = await createUser({
      name: "Test User",
      email: "test@example.com",
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    const token = generateRefreshToken(user.id);
    await createRefreshToken({ userId: user.id, token });

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Logged out successfully" });

    const storedToken = await findRefreshToken(token);
    expect(storedToken?.revokedAt).not.toBeNull();
  });

  it("rejects when no token is provided", async () => {
    const res = await request(app).post("/api/auth/logout").send({});

    expect(res.status).toBe(401);
  });
});