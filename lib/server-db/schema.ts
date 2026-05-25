import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

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
