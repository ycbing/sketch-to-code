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
      share_token TEXT UNIQUE,
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

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT,
      credits INTEGER NOT NULL DEFAULT 200,
      created_at TEXT NOT NULL,
      ai_provider TEXT,
      ai_api_key TEXT,
      ai_base_url TEXT,
      ai_model TEXT
    );

    CREATE TABLE IF NOT EXISTS credits_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migration: add AI config columns if missing
  const userCols = sqlite.pragma("table_info(users)") as Array<{ name: string }>;
  const colNames = userCols.map((c) => c.name);
  if (!colNames.includes("ai_provider")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN ai_provider TEXT;`);
  }
  if (!colNames.includes("ai_api_key")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN ai_api_key TEXT;`);
  }
  if (!colNames.includes("ai_base_url")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN ai_base_url TEXT;`);
  }
  if (!colNames.includes("ai_model")) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN ai_model TEXT;`);
  }

  console.log("[DB] SQLite tables ready");
  sqlite.close();
}
