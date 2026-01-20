// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";

interface SketchDB extends DBSchema {
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      description?: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { "by-updated": number };
  };
  versions: {
    key: string;
    value: {
      id: string;
      projectId: string;
      versionNum: number;
      sketchData: string;
      sketchImage: string;
      generatedCode: string;
      requirements?: string;
      createdAt: number;
    };
    indexes: { "by-project": string };
  };
}

let db: IDBPDatabase<SketchDB> | null = null;

export async function getDB() {
  if (db) return db;

  db = await openDB<SketchDB>("sketch-to-react", 1, {
    upgrade(db) {
      // 项目表
      const projectStore = db.createObjectStore("projects", { keyPath: "id" });
      projectStore.createIndex("by-updated", "updatedAt");

      // 版本表
      const versionStore = db.createObjectStore("versions", { keyPath: "id" });
      versionStore.createIndex("by-project", "projectId");
    },
  });

  return db;
}

// 项目操作
export async function createProject(name: string, description?: string) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const now = Date.now();

  await db.add("projects", {
    id,
    name,
    description,
    createdAt: now,
    updatedAt: now,
  });

  return { id, name, description, createdAt: now, updatedAt: now };
}

export async function getAllProjects() {
  const db = await getDB();
  return db.getAllFromIndex("projects", "by-updated");
}

export async function deleteProject(id: string) {
  const db = await getDB();

  // 删除所有版本
  const versions = await db.getAllFromIndex("versions", "by-project", id);
  for (const version of versions) {
    await db.delete("versions", version.id);
  }

  // 删除项目
  await db.delete("projects", id);
}

// 版本操作
export async function createVersion(
  projectId: string,
  data: {
    sketchData: string;
    sketchImage: string;
    generatedCode: string;
    requirements?: string;
  },
) {
  const db = await getDB();

  // 获取最新版本号
  const versions = await db.getAllFromIndex(
    "versions",
    "by-project",
    projectId,
  );
  const maxVersion = versions.reduce(
    (max, v) => Math.max(max, v.versionNum),
    0,
  );

  const id = crypto.randomUUID();
  const version = {
    id,
    projectId,
    versionNum: maxVersion + 1,
    ...data,
    createdAt: Date.now(),
  };

  await db.add("versions", version);

  // 更新项目时间
  const project = await db.get("projects", projectId);
  if (project) {
    await db.put("projects", { ...project, updatedAt: Date.now() });
  }

  return version;
}

export async function getProjectVersions(projectId: string) {
  const db = await getDB();
  const versions = await db.getAllFromIndex(
    "versions",
    "by-project",
    projectId,
  );
  return versions.sort((a, b) => b.versionNum - a.versionNum);
}

export async function getVersion(id: string) {
  const db = await getDB();
  return db.get("versions", id);
}

export async function deleteVersion(id: string) {
  const db = await getDB();
  await db.delete("versions", id);
}
