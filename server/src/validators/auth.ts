import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .regex(
      /^[a-zA-ZÀ-ÿ]+(?: [a-zA-ZÀ-ÿ]+)+$/,
      "Name must include first and last name",
    ),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
      "Password must contain letters, numbers, and at least one special character",
    ),
  avatar: z.url("Invalid avatar URL").optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "Invalid OTP"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/,
      "Password must contain letters, numbers, and at least one special character",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
