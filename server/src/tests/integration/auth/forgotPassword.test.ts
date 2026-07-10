import request from "supertest";
import app from "../../../app.js";
import { resetDb } from "../../helpers/resetDb.js";
import { createUser } from "../../../db/queries/users.js";
import { sendOtpEmail } from "../../helpers/mockEmail.js";

// Replaces utils/email.js with the fake versions from mockEmail.js
vi.mock("../../../utils/email.js", () => import("../../helpers/mockEmail.js"));

const registeredEmail = "test@example.com";

describe("POST /api/auth/forgot-password", () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
    await createUser({
      name: "Test User",
      email: registeredEmail,
      passwordHash: "notusedhere",
    });
  });

  it("sends an OTP for a registered email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: registeredEmail });

    expect(res.status).toBe(200);
    expect(sendOtpEmail).toHaveBeenCalledWith(
      registeredEmail,
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("rejects an invalid body", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "testemail" });

    expect(res.status).toBe(400);
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });

  it("responds the same way for an email that isn't registered, without sending an OTP", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "doesnotexist@example.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "If that email is registered, you will receive an OTP",
    });
    expect(sendOtpEmail).not.toHaveBeenCalled();
  });
});