import { Resend } from "resend";
import { config } from "@config";

const resend = new Resend(config.resendApiKey);

export async function sendOtpEmail(email: string, otp: string) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Task Manager reset code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Password Reset</h2>
        <p style="color: #64748b; margin-bottom: 24px;">Use the code below to reset your password. It expires in 15 minutes.</p>
        <div style="background-color: #f1f5f9; border-radius: 6px; padding: 16px; text-align: center; letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #1e293b;">
          ${otp}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerifyEmail(email: string, verifyUrl: string) {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Task Manager - Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #64748b; margin-bottom: 24px;">Click the button below to verify your email address. The link expires in 24 hours.</p>
        <a href="${verifyUrl}" style="background-color: #1e293b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify email</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}
