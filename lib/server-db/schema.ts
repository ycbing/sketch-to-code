import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ----------------------------------------------------------------------
// 用户表 (Users)
// ----------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  credits: integer("credits").notNull().default(200),
  createdAt: text("created_at").notNull(),
});

// ----------------------------------------------------------------------
// 积分日志表 (Credits Log)
// ----------------------------------------------------------------------
export const creditsLog = sqliteTable("credits_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason"),
  createdAt: text("created_at").notNull(),
});

// ----------------------------------------------------------------------
// 项目表 (Projects)
// ----------------------------------------------------------------------
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id").notNull().default("default-user"),
  shareToken: text("share_token"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ----------------------------------------------------------------------
// 版本表 (Versions)
// ----------------------------------------------------------------------
export const versions = sqliteTable("versions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionNum: integer("version_num").notNull(),
  sketchData: text("sketch_data"),
  sketchImage: text("sketch_image"),
  generatedCode: text("generated_code").notNull(),
  requirements: text("requirements"),
  createdAt: text("created_at").notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  versions: many(versions),
}));

export const versionsRelations = relations(versions, ({ one }) => ({
  project: one(projects, {
    fields: [versions.projectId],
    references: [projects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  creditsLogEntries: many(creditsLog),
}));

export const creditsLogRelations = relations(creditsLog, ({ one }) => ({
  user: one(users, {
    fields: [creditsLog.userId],
    references: [users.id],
  }),
}));
