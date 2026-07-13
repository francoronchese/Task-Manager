import request from "supertest";
import app from "../../../app.js";
import { resetDb } from "../../helpers/resetDb.js";
import { findUserByEmail } from "../../../db/queries/users.js";
import { findUserProvider } from "../../../db/queries/userProviders.js";
import {
  getGoogleAuthUrl,
  oauth2Client,
  userinfoGet,
} from "../../helpers/mockGoogleOAuth.js";

// Replaces utils/googleOAuth.js with the fake versions from mockGoogleOAuth.js.
// Mocked entirely because the real file runs `new google.auth.OAuth2(...)` on load
vi.mock("../../../utils/googleOAuth.js", () =>
  import("../../helpers/mockGoogleOAuth.js"),
);
// Replaces googleapis with the fake versions from mockGoogleOAuth.js
vi.mock("googleapis", () => import("../../helpers/mockGoogleOAuth.js"));

// Sample profile Google would normally return from oauth2.userinfo.get()
const googleProfile = {
  id: "1234567890",
  email: "googleuser@example.com",
  name: "Google User",
  verified_email: true,
  picture: "https://example.com/avatar.jpg",
};

describe("GET /api/auth/google", () => {
  it("redirects to Google's consent screen", async () => {
    const res = await request(app).get("/api/auth/google");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(await getGoogleAuthUrl());
  });
});

describe("GET /api/auth/google/callback", () => {
  beforeEach(async () => {
    await resetDb();
    vi.clearAllMocks();
  });

  it("rejects when no authorization code is provided", async () => {
    const res = await request(app).get("/api/auth/google/callback");

    expect(res.status).toBe(401);
    expect(oauth2Client.getToken).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired authorization code", async () => {
    oauth2Client.getToken.mockRejectedValueOnce(new Error("invalid_grant"));

    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "bad-code" });

    expect(res.status).toBe(401);
  });

  it("rejects when Google doesn't return a verified email", async () => {
    oauth2Client.getToken.mockResolvedValueOnce({ tokens: {} });
    userinfoGet.mockResolvedValueOnce({
      data: { ...googleProfile, verified_email: false },
    });

    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "good-code" });

    expect(res.status).toBe(401);
  });

  it("creates a new verified user and links the google provider", async () => {
    oauth2Client.getToken.mockResolvedValueOnce({ tokens: {} });
    userinfoGet.mockResolvedValueOnce({ data: googleProfile });

    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "good-code" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(
      /\/oauth\/callback\?accessToken=.+&refreshToken=.+/,
    );

    const user = await findUserByEmail(googleProfile.email);
    expect(user).not.toBeNull();
    expect(user?.verifyEmail).toBe(true);

    const provider = await findUserProvider(user!.id, "google");
    expect(provider).not.toBeNull();
  });

  it("logs in an existing user and links the google provider if it was missing", async () => {
    // First callback creates the user and links the provider
    oauth2Client.getToken.mockResolvedValueOnce({ tokens: {} });
    userinfoGet.mockResolvedValueOnce({ data: googleProfile });
    await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "good-code" });

    const userBefore = await findUserByEmail(googleProfile.email);

    // Second callback should reuse the same user, not create a duplicate
    oauth2Client.getToken.mockResolvedValueOnce({ tokens: {} });
    userinfoGet.mockResolvedValueOnce({ data: googleProfile });
    const res = await request(app)
      .get("/api/auth/google/callback")
      .query({ code: "good-code" });

    expect(res.status).toBe(302);
    const userAfter = await findUserByEmail(googleProfile.email);
    expect(userAfter?.id).toBe(userBefore?.id);
  });
});
