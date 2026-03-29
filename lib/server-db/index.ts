import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDbPath(): string {
  return path.join(process.cwd(), "local.db");
}

export const db: BetterSQLite3Database<typeof schema> = new Proxy(
  {} as BetterSQLite3Database<typeof schema>,
  {
    get(_target, prop, receiver) {
      if (!_db) {
        const sqlite = new Database(getDbPath());
        sqlite.pragma("journal_mode = WAL");
        sqlite.pragma("foreign_keys = ON");
        _db = drizzle(sqlite, { schema });
      }
      const value = Reflect.get(_db, prop, receiver);
      if (typeof value === "function") {
        return value.bind(_db);
      }
      return value;
    },
  },
);
