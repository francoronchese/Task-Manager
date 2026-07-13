import argon2 from "argon2";
import request from "supertest";
import app from "../../../app.js";
import { resetDb } from "../../helpers/resetDb.js";
import { createUser, verifyUserEmail } from "../../../db/queries/users.js";

const plainPassword = "Password1!";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await resetDb();
    const passwordHash = await argon2.hash(plainPassword);
    const user = await createUser({
      name: "Test User",
      email: "test@example.com",
      passwordHash,
    });
    // Login is blocked for unverified users, so verify by default and let the one test that needs an unverified user handle its own setup
    await verifyUserEmail(user.id);
  });

  it("logs in successfully and returns both tokens", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: plainPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("rejects an invalid body (email)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "testemail", password: plainPassword });

    expect(res.status).toBe(400);
  });

  it("rejects an email that isn't registered", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@example.com", password: plainPassword });

    expect(res.status).toBe(401);
  });

  it("rejects the wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword1!" });

    expect(res.status).toBe(401);
  });

  it("rejects login for an unverified email", async () => {
    const passwordHash = await argon2.hash(plainPassword);
    await createUser({
      name: "Unverified User",
      email: "unverified@example.com",
      passwordHash,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unverified@example.com", password: plainPassword });

    expect(res.status).toBe(403);
  });

  it("logs in successfully twice in a row without colliding refresh tokens", async () => {
    const first = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: plainPassword });

    const second = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: plainPassword });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.refreshToken).not.toBe(first.body.refreshToken);
  });
});
