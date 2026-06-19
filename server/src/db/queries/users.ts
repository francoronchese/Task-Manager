import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema/index.js";

type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
};

// REGISTER - Inserts a new user record into the database
export async function createUser(data: CreateUserData) {
  await db.insert(users).values(data);
}

// REGISTER - Finds a user by email, used to check for duplicates before insertion
export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}
