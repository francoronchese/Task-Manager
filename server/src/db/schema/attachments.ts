import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { tasks } from "./tasks.js";
import { users } from "./users.js";

export const attachments = pgTable("attachments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  uploadedBy: integer("uploaded_by")
    .notNull()
    .references(() => users.id),
  fileName: varchar("file_name", { length: 255 }),
  fileUrl: varchar("file_url", { length: 2048 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
