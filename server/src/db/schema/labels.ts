import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { boards } from "./boards.js";

export const labels = pgTable("labels", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  boardId: integer("board_id")
    .notNull()
    .references(() => boards.id),
  name: varchar({ length: 100 }).notNull(),
  color: varchar().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
