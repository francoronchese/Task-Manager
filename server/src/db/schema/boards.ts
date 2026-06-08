import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const boardRoleEnum = pgEnum("board_role", ["owner", "member"]);

export const boards = pgTable("boards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const boardMembers = pgTable(
  "board_members",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    role: boardRoleEnum().notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_board_idx").on(table.boardId, table.userId)],
);
