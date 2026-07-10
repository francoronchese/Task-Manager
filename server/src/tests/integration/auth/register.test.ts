import request from "supertest";
import app from "../../../app.js";
import { resetDb } from "../../helpers/resetDb.js";
import { sendVerifyEmail } from "../../helpers/mockEmail.js";

// Replaces utils/email.js with the fake versions from mockEmail.js
vi.mock("../../../utils/email.js", () => import("../../helpers/mockEmail.js"));

const validUser = {
  name: "Test User",
  email: "test@example.com",
  password: "Password1!",
  avatar: "https://example.com/avatar.jpg",
};

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
  });

  it("registers a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "User registered successfully" });
    expect(sendVerifyEmail).toHaveBeenCalledWith(
      validUser.email,
      expect.stringContaining("/verify-email?token="),
    );
  });

  it("rejects an invalid body (email)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validUser, email: "testemail" });

    expect(res.status).toBe(400);
    expect(sendVerifyEmail).not.toHaveBeenCalled();
  });

  it("rejects an email already in use", async () => {
    await request(app).post("/api/auth/register").send(validUser);
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.status).toBe(409);
    expect(sendVerifyEmail).toHaveBeenCalledTimes(1);
  });
});