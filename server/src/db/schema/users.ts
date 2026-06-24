import {
  boolean,
  char,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "member"]);
export const authProviderEnum = pgEnum("auth_provider", ["local", "google"]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 256 }).unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  name: varchar({ length: 256 }).notNull(),
  avatar: varchar(),
  role: userRoleEnum().default("member").notNull(),
  verifyEmail: boolean("verify_email").default(false).notNull(),
  verifyEmailIssuedAt: timestamp("verify_email_issued_at"),
  forgotPasswordOtp: char("forgot_password_otp", { length: 6 }),
  forgotPasswordExpiry: timestamp("forgot_password_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const userProviders = pgTable(
  "user_providers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    provider: authProviderEnum().notNull(),
    providerId: varchar("provider_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_provider_idx").on(table.userId, table.provider),
  ],
);

export const refreshTokens = pgTable("refresh_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  token: varchar().unique().notNull(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: varchar("ip_address"),
  browser: varchar(),
  os: varchar(),
  device: varchar(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
