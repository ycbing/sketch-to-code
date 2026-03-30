// lib/db.ts
// 双写模式：IndexedDB（前端缓存/离线） + 服务端 SQLite（持久化）
import { openDB, DBSchema, IDBPDatabase } from "idb";
import { nanoid } from "nanoid";

// ──────────────────────────────────────────────
// IndexedDB Schema（保持不变，作为前端缓存）
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// 服务端 API 辅助函数
// ──────────────────────────────────────────────

async function apiFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      console.warn(`Server API ${url} returned ${res.status}`);
    }
    return res;
  } catch (err) {
    // 网络错误不阻塞前端操作，仅打印警告
    console.warn(`Server API ${url} unavailable:`, err);
    return null;
  }
}

// ──────────────────────────────────────────────
// 项目操作（双写模式）
// ──────────────────────────────────────────────

export async function createProject(name: string, description?: string) {
  const db = await getDB();
  const id = nanoid();
  const now = Date.now();

  const project = { id, name, description, createdAt: now, updatedAt: now };

  // 1. 写 IndexedDB
  await db.add("projects", project);

  // 2. 写服务端（异步，不阻塞）
  apiFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });

  return project;
}

export async function getAllProjects() {
  // 优先从 IndexedDB 读取（快速）
  const db = await getDB();
  const localProjects = await db.getAllFromIndex("projects", "by-updated");

  // 后台同步服务端数据（不阻塞返回）
  syncFromServer();

  return localProjects;
}

export async function deleteProject(id: string) {
  const db = await getDB();

  // 1. 删除 IndexedDB 中的版本和项目
  const versions = await db.getAllFromIndex("versions", "by-project", id);
  for (const version of versions) {
    await db.delete("versions", version.id);
  }
  await db.delete("projects", id);

  // 2. 删除服务端数据（异步，不阻塞）
  apiFetch(`/api/projects/${id}`, { method: "DELETE" });
}

// ──────────────────────────────────────────────
// 版本操作（双写模式）
// ──────────────────────────────────────────────

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
  const versions = await db.getAllFromIndex("versions", "by-project", projectId);
  const maxVersion = versions.reduce((max, v) => Math.max(max, v.versionNum), 0);

  const id = nanoid();
  const version = {
    id,
    projectId,
    versionNum: maxVersion + 1,
    ...data,
    createdAt: Date.now(),
  };

  // 1. 写 IndexedDB
  await db.add("versions", version);

  // 更新项目时间
  const project = await db.get("projects", projectId);
  if (project) {
    await db.put("projects", { ...project, updatedAt: Date.now() });
  }

  // 2. 写服务端（异步，不阻塞）
  apiFetch(`/api/projects/${projectId}/versions`, {
    method: "POST",
    body: JSON.stringify(version),
  });

  return version;
}

export async function getProjectVersions(projectId: string) {
  // 优先从 IndexedDB 读取（快速）
  const db = await getDB();
  const versions = await db.getAllFromIndex("versions", "by-project", projectId);
  const sorted = versions.sort((a, b) => b.versionNum - a.versionNum);

  // 后台同步（不阻塞返回）
  syncProjectVersionsFromServer(projectId);

  return sorted;
}

export async function getVersion(id: string) {
  const db = await getDB();
  return db.get("versions", id);
}

export async function deleteVersion(id: string) {
  const db = await getDB();
  await db.delete("versions", id);
}

// ──────────────────────────────────────────────
// 服务端同步函数
// ──────────────────────────────────────────────

/**
 * 从服务端拉取所有项目，更新本地 IndexedDB
 */
export async function syncFromServer() {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) return;

    const serverProjects: Array<{
      id: string;
      name: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }> = await res.json();

    const db = await getDB();

    for (const sp of serverProjects) {
      const local = await db.get("projects", sp.id);
      const serverTs = new Date(sp.updatedAt).getTime();
      const localTs = local?.updatedAt ?? 0;

      // 仅当服务端数据更新时才覆盖本地
      if (serverTs > localTs) {
        await db.put("projects", {
          id: sp.id,
          name: sp.name,
          description: sp.description ?? undefined,
          createdAt: new Date(sp.createdAt).getTime(),
          updatedAt: serverTs,
        });
      }
    }
  } catch {
    // 静默失败，不影响前端体验
  }
}

/**
 * 从服务端拉取指定项目的版本，更新本地 IndexedDB
 */
async function syncProjectVersionsFromServer(projectId: string) {
  try {
    const res = await fetch(`/api/projects/${projectId}/versions`);
    if (!res.ok) return;

    const serverVersions: Array<{
      id: string;
      projectId: string;
      versionNum: number;
      sketchData?: string;
      sketchImage?: string;
      generatedCode: string;
      requirements?: string;
      createdAt: string;
    }> = await res.json();

    const db = await getDB();

    for (const sv of serverVersions) {
      const local = await db.get("versions", sv.id);
      const serverTs = new Date(sv.createdAt).getTime();
      const localTs = local?.createdAt ?? 0;

      if (serverTs > localTs) {
        await db.put("versions", {
          id: sv.id,
          projectId: sv.projectId,
          versionNum: sv.versionNum,
          sketchData: sv.sketchData ?? "",
          sketchImage: sv.sketchImage ?? "",
          generatedCode: sv.generatedCode,
          requirements: sv.requirements,
          createdAt: serverTs,
        });
      }
    }
  } catch {
    // 静默失败
  }
}
