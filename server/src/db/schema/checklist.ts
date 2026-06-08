import { boolean, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { tasks } from "./tasks.js";

export const checklistItems = pgTable("checklist_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  content: varchar({ length: 255 }).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  position: integer().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
