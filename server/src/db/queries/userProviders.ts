import { and, eq } from "drizzle-orm";
import { db } from "../index.js";
import { userProviders } from "../schema/index.js";
import type { authProviderEnum } from "../schema/users.js";

type Provider = (typeof authProviderEnum.enumValues)[number];

type CreateUserProviderData = {
  userId: number;
  provider: Provider;
  providerId?: string;
};

// GENERAL - Finds a specific provider record for a user (e.g. does this user have "google" linked?)
export async function findUserProvider(userId: number, provider: Provider) {
  const [userProvider] = await db
    .select()
    .from(userProviders)
    .where(
      and(
        eq(userProviders.userId, userId),
        eq(userProviders.provider, provider),
      ),
    );
  return userProvider;
}

// REGISTER / GOOGLE CALLBACK - Links an auth provider (local or google) to a user
// onConflictDoNothing() relies on the [userId, provider] uniqueIndex: if this link already
// exists (e.g. a duplicate call or race condition), the insert is silently skipped instead of throwing
export async function createUserProvider(data: CreateUserProviderData) {
  await db.insert(userProviders).values(data).onConflictDoNothing();
}
