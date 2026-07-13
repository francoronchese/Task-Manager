import { eq } from "drizzle-orm";
import { db } from "@db/index.js";
import { users } from "@db/schema/index.js";

type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
};

// REGISTER - Inserts a new user record into the database
export async function createUser(data: CreateUserData) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

//GENERAL - Finds a user by their ID
export async function findUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

// GENERAL - Finds a user by email
export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

// FORGOT PASSWORD - Saves the OTP and its expiry date to the user record
export async function savePasswordOtp(
  email: string,
  otp: string,
  expiry: Date,
) {
  await db
    .update(users)
    .set({ forgotPasswordOtp: otp, forgotPasswordExpiry: expiry })
    .where(eq(users.email, email));
}

// RESET PASSWORD - Updates the user's password and clears the OTP fields
export async function resetUserPassword(email: string, passwordHash: string) {
  await db
    .update(users)
    .set({
      passwordHash,
      forgotPasswordOtp: null,
      forgotPasswordExpiry: null,
    })
    .where(eq(users.email, email));
}

// VERIFY EMAIL - Saves the timestamp of when the verification email was sent
export async function saveEmailVerifyIssuedAt(email: string, issuedAt: Date) {
  await db
    .update(users)
    .set({ verifyEmailIssuedAt: issuedAt })
    .where(eq(users.email, email));
}

// VERIFY EMAIL - Marks the user's email as verified and clears the issued at timestamp
export async function verifyUserEmail(userId: number) {
  await db
    .update(users)
    .set({ verifyEmail: true, verifyEmailIssuedAt: null })
    .where(eq(users.id, userId));
}
