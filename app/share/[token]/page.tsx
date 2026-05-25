"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Sparkles, ArrowRight, Code2, Eye, Loader2, AlertCircle, X } from "lucide-react";

const PreviewMode = dynamic(
  () => import("@/components/editor/PreviewMode").then((m) => ({ default: m.PreviewMode })),
  { ssr: false, loading: () => <LoadingState /> },
);
const CodeMode = dynamic(
  () => import("@/components/editor/CodeMode").then((m) => ({ default: m.CodeMode })),
  { ssr: false, loading: () => <LoadingState /> },
);

type TabType = "preview" | "code";

interface SharedProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  latestVersion: {
    generatedCode: string;
    sketchImage?: string;
    createdAt: string;
    versionNum: number;
  } | null;
}

function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [activeFile, setActiveFile] = useState<string>("/App.js");

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          setError("项目不存在或分享链接已失效");
          return;
        }
        const data = await res.json();
        setProject(data);
        // Parse files from code
        if (data.latestVersion?.generatedCode) {
          try {
            const { parseGeneratedFiles } = await import("@/lib/parse-files");
            const { files } = parseGeneratedFiles(data.latestVersion.generatedCode);
            const fileNames = Object.keys(files);
            if (fileNames.length > 0) {
              setActiveFile(fileNames[0]);
            }
          } catch {
            // Use raw code as single file
          }
        }
      } catch {
        setError("加载项目失败，请重试");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [token]);

  // Parse generated code into files map
  const parsedFiles = useState<Record<string, string>>({})[0];

  const files = project?.latestVersion?.generatedCode
    ? (() => {
        try {
          // Dynamic import won't work in render, use simple heuristic
          const code = project.latestVersion.generatedCode;
          const fileMatch = code.match(/File:\s*`([^`]+)`/g);
          if (fileMatch && fileMatch.length > 1) {
            const result: Record<string, string> = {};
            for (const match of fileMatch) {
              const path = match.match(/File:\s*`([^`]+)`/)?.[1];
              const startIdx = code.indexOf(match);
              const nextFile = code.indexOf("File: `", startIdx + match.length);
              const content = code.slice(startIdx + match.length, nextFile === -1 ? undefined : nextFile).trim();
              if (path) result[path] = content;
            }
            if (Object.keys(result).length > 0) return result;
          }
          // Fallback: single file
          const mainFile = "/App.js";
          return { [mainFile]: code };
        } catch {
          return { "/App.js": project.latestVersion.generatedCode };
        }
      })()
    : parsedFiles;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载项目中...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            无法访问
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error || "项目不存在或分享链接已失效"}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
          >
            创建你的项目
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const fileNameList = Object.keys(files);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 dark:from-white/5 dark:via-transparent dark:to-white/5"></div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/50 dark:bg-black/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white dark:text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                由 Sketch-to-Code 生成
              </span>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {project.name}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            创建你的项目
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col">
        {/* Project Info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-gray-500 dark:text-gray-400">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span>
              创建于{" "}
              {new Date(project.createdAt).toLocaleDateString("zh-CN")}
            </span>
            {project.latestVersion && (
              <span>版本 {project.latestVersion.versionNum}</span>
            )}
          </div>
        </div>

        {/* Preview / Code Area */}
        {project.latestVersion ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
            {/* File tabs (if multiple files) */}
            {fileNameList.length > 1 && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                {fileNameList.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveFile(name)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all ${
                      name === activeFile
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-white/5"
                    }`}
                  >
                    {name.split("/").pop()}
                  </button>
                ))}
              </div>
            )}

            {/* Tab switcher */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                  activeTab === "preview"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {activeTab === "preview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                )}
                <Eye className="w-4 h-4" /> 预览
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                  activeTab === "code"
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {activeTab === "code" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                )}
                <Code2 className="w-4 h-4" /> 代码
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-[500px]">
              {activeTab === "preview" ? (
                <PreviewMode
                  files={files}
                  isDark={typeof window !== "undefined" && document.documentElement.classList.contains("dark")}
                />
              ) : (
                <CodeMode
                  files={files}
                  activeFile={activeFile}
                  isDark={typeof window !== "undefined" && document.documentElement.classList.contains("dark")}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400">
                该项目还没有生成代码
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
