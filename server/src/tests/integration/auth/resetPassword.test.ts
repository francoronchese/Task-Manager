import request from "supertest";
import app from "@app";
import { resetDb } from "../../helpers/resetDb.js";
import {
  createUser,
  savePasswordOtp,
  verifyUserEmail,
} from "@db/queries/users.js";

const registeredEmail = "test@example.com";
const validOtp = "123456";
const newPassword = "NewPassword1!";

describe("POST /api/auth/reset-password", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("resets the password with a valid OTP", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    await savePasswordOtp(
      registeredEmail,
      validOtp,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    const res = await request(app).post("/api/auth/reset-password").send({
      email: registeredEmail,
      otp: validOtp,
      password: newPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Password reset successfully" });

    // Confirm the new password actually works via login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: registeredEmail, password: newPassword });
    expect(loginRes.status).toBe(200);
  });

  it("rejects an invalid body", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    await savePasswordOtp(
      registeredEmail,
      validOtp,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    const res = await request(app).post("/api/auth/reset-password").send({
      email: "testemail",
      otp: validOtp,
      password: newPassword,
    });

    expect(res.status).toBe(400);
  });

  it("rejects an email that isn't registered", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "doesnotexist@example.com",
      otp: validOtp,
      password: newPassword,
    });

    expect(res.status).toBe(404);
  });

  it("rejects an expired OTP", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    await savePasswordOtp(registeredEmail, validOtp, new Date(Date.now() - 1000));

    const res = await request(app).post("/api/auth/reset-password").send({
      email: registeredEmail,
      otp: validOtp,
      password: newPassword,
    });

    expect(res.status).toBe(401);
  });

  it("rejects an OTP that doesn't match", async () => {
    const user = await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
    await verifyUserEmail(user.id);
    await savePasswordOtp(
      registeredEmail,
      validOtp,
      new Date(Date.now() + 15 * 60 * 1000),
    );

    const res = await request(app).post("/api/auth/reset-password").send({
      email: registeredEmail,
      otp: "000000",
      password: newPassword,
    });

    expect(res.status).toBe(401);
  });
});
