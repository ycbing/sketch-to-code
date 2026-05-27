"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Sparkles, ArrowRight, Code2, Eye, Loader2, AlertCircle } from "lucide-react";
import { Button, Logo, SiteHeader } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";

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
        if (!res.ok) { setError("项目不存在或分享链接已失效"); return; }
        setProject(await res.json());
      } catch { setError("加载项目失败，请重试"); } finally { setLoading(false); }
    }
    loadProject();
  }, [token]);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [files, setFiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project?.latestVersion?.generatedCode) {
      import("@/lib/parse-files").then(({ parseGeneratedFiles }) => {
        const { files: parsed } = parseGeneratedFiles(project.latestVersion!.generatedCode);
        setFiles(parsed);
        const fileNames = Object.keys(parsed);
        if (fileNames.length > 0) setActiveFile(fileNames[0]);
      }).catch(() => {
        setFiles({ "/App.js": project.latestVersion!.generatedCode });
      });
    }
  }, [project?.latestVersion?.generatedCode, project?.latestVersion]);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">无法访问</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "项目不存在或分享链接已失效"}</p>
          <Button size="lg" href="/dashboard">
            创建你的项目 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const fileNameList = Object.keys(files);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 dark:from-white/5 dark:via-transparent dark:to-white/5" />
      </div>

      <SiteHeader>
        <div className="flex items-center gap-3">
          <Logo size="md" showText={false} />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">由 Sketch-to-Code 生成</span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <span className="font-semibold text-gray-900 dark:text-white">{project.name}</span>
          </div>
        </div>
        <Button size="sm" href="/dashboard">
          创建你的项目 <ArrowRight className="w-4 h-4" />
        </Button>
      </SiteHeader>

      <div className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.name}</h1>
          {project.description && <p className="text-gray-500 dark:text-gray-400">{project.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <span>创建于 {new Date(project.createdAt).toLocaleDateString("zh-CN")}</span>
            {project.latestVersion && <span>版本 {project.latestVersion.versionNum}</span>}
          </div>
        </div>

        {project.latestVersion ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg">
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
            <div className="h-12 border-b border-gray-200 dark:border-gray-800 flex">
              {(["preview", "code"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                    activeTab === tab ? "text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />}
                  {tab === "preview" ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                  {tab === "preview" ? "预览" : "代码"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-[500px]">
              {activeTab === "preview" ? (
                <PreviewMode files={files} isDark={isDark} />
              ) : (
                <CodeMode files={files} activeFile={activeFile} isDark={isDark} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400">该项目还没有生成代码</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
