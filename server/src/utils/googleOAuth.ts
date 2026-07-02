import { google } from "googleapis";
import { config } from "../config.js";

export const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl,
);

// Generates the Google authorization URL to redirect the user to Google's consent page.
// access_type: "offline" requests a refresh token so the app can access Google APIs without user interaction.
// Scopes define what user data the app can access:
// openid - enables OpenID Connect authentication
// userinfo.email - grants access to the user's email address
// userinfo.profile - grants access to the user's basic profile info (name, picture)
export function getGoogleAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
}
