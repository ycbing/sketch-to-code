/**
 * scripts/init-db.ts
 *
 * 手动初始化 SQLite 数据库（创建表）。
 * 用法: npx tsx scripts/init-db.ts
 *
 * 通常不需要手动运行——API route 首次请求时会自动创建表。
 */
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "local.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    user_id     TEXT NOT NULL DEFAULT 'default-user',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS versions (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_num     INTEGER NOT NULL,
    sketch_data     TEXT,
    sketch_image    TEXT,
    generated_code  TEXT NOT NULL,
    requirements    TEXT,
    created_at      TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions(project_id);
`);

console.log(`✅ Database initialized at ${dbPath}`);
sqlite.close();
