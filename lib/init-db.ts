// lib/init-db.ts — 确保 SQLite 表存在（应用启动时调用）
import Database from "better-sqlite3";
import path from "path";

export function initDatabase() {
  const dbPath = path.join(process.cwd(), "local.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL DEFAULT 'default-user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_num INTEGER NOT NULL,
      sketch_data TEXT,
      sketch_image TEXT,
      generated_code TEXT NOT NULL,
      requirements TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log("[DB] SQLite tables ready");
  sqlite.close();
}
