// Fake versions of the real Google OAuth functions from utils/googleOAuth.js, so tests never redirect to Google or exchange a real authorization code
export const getGoogleAuthUrl = vi.fn(
  () => "https://accounts.google.com/mock-consent-url",
);
export const oauth2Client = {
  getToken: vi.fn(),
  setCredentials: vi.fn(),
};

// Fake version of googleapis' google.oauth2(...).userinfo.get(), so tests never fetch a real user profile from Google
export const userinfoGet = vi.fn();
export const google = {
  oauth2: vi.fn(() => ({
    userinfo: { get: userinfoGet },
  })),
};