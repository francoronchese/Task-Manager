import {
  integer,
  primaryKey,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { columns } from "./columns.js";
import { users } from "./users.js";
import { labels } from "./labels.js";

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const tasks = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  columnId: integer("column_id")
    .notNull()
    .references(() => columns.id),
  title: varchar({ length: 100 }).notNull(),
  description: text(),
  position: integer().notNull(),
  priority: taskPriorityEnum().notNull().default("medium"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  dueDate: timestamp("due_date"),
  reminderDate: timestamp("reminder_date"),
  remindedAt: timestamp("reminded_at"),
  completedAt: timestamp("completed_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const taskMembers = pgTable(
  "task_members",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    addedBy: integer("added_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("task_member_idx").on(table.taskId, table.userId)],
);

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    labelId: integer("label_id")
      .notNull()
      .references(() => labels.id),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);
