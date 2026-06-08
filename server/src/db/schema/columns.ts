import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { boards } from "./boards.js";

export const columns = pgTable("columns", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id),
  name: varchar({ length: 100 }).notNull(),
  position: integer().notNull(),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
