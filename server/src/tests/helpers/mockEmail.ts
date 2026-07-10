// Fake versions of the real email functions, so tests never call the Resend API
export const sendOtpEmail = vi.fn();
export const sendVerifyEmail = vi.fn();