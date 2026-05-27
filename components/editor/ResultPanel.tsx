"use client";

import React from "react";
import { Code2, Eye, Copy, Download, Check, Package } from "lucide-react";
import { PreviewMode } from "@/components/editor/PreviewMode";
import { CodeMode } from "@/components/editor/CodeMode";
import type { Framework } from "@/lib/frameworks";
import { cn } from "@/lib/utils";

type TabType = "preview" | "code";

interface ResultPanelProps {
  isDark: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  generatedCode: string;
  generatedFiles: Record<string, string>;
  activeFile: string;
  onActiveFileChange: (file: string) => void;
  framework: Framework;
  projectName: string;
  onCopy: () => void;
  onCopyAll: () => void;
  onDownload: () => void;
  onDownloadAll: () => void;
  copied: boolean;
  copiedAll: boolean;
}

export function ResultPanel({
  isDark, activeTab, onTabChange,
  generatedCode, generatedFiles, activeFile, onActiveFileChange,
  framework,
  onCopy, onCopyAll, onDownload, onDownloadAll,
  copied, copiedAll,
}: ResultPanelProps) {
  const fileNameList = Object.keys(generatedFiles);

  if (!generatedCode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-black/30 backdrop-blur-sm transition-colors duration-300">
        <div className="text-center">
          <Code2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-sm text-gray-400 dark:text-gray-500">在左侧绘制或上传设计稿，点击生成代码</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white dark:bg-black/30 backdrop-blur-sm relative transition-colors duration-300">
      {generatedCode && (
        <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/50 backdrop-blur-xl transition-colors duration-300">
          {fileNameList.length > 1 && (
            <div className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-thin border-b border-gray-200 dark:border-white/10">
              {fileNameList.map((name) => {
                const isActive = name === activeFile;
                const ext = name.split(".").pop() || "";
                const isComponent = name.startsWith("/components/");
                const fileName = name.split("/").pop() || name;
                const iconColor = ext === "css"
                  ? "text-purple-600 dark:text-purple-400"
                  : isComponent
                    ? "text-cyan-600 dark:text-cyan-400"
                    : "text-blue-600 dark:text-blue-400";

                return (
                  <button
                    key={name}
                    onClick={() => onActiveFileChange(name)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all",
                      isActive
                        ? "bg-gray-900 dark:bg-white/15 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5",
                    )}
                    title={name}
                  >
                    <svg className={cn("w-3 h-3 flex-shrink-0", iconColor)} viewBox="0 0 16 16" fill="currentColor">
                      {isComponent ? (
                        <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.172a1.5 1.5 0 0 1 1.06.44l.83.828H13.5A1.5 1.5 0 0 1 15 5.5v7A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-9Z" />
                      ) : (
                        <path d="M4 1h5.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm4 1v3a1 1 0 0 0 1 1h3L8 2Z" />
                      )}
                    </svg>
                    {fileName}
                  </button>
                );
              })}
            </div>
          )}
          <div className="h-10 flex items-center justify-between px-4">
            <div className="text-xs font-mono text-gray-400 dark:text-gray-500">
              {fileNameList.length} 文件 • {generatedCode.split("\n").length} 行 • {(generatedCode.length / 1024).toFixed(1)} KB
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onDownloadAll} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors flex items-center gap-1 px-2 py-1 rounded" title="打包下载所有文件">
                <Package className="w-3 h-3" /> 打包下载
              </button>
              <button onClick={onCopy} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors flex items-center gap-1 px-2 py-1 rounded">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "已复制！" : "复制"}
              </button>
              {fileNameList.length > 1 && (
                <button onClick={onCopyAll} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors flex items-center gap-1 px-2 py-1 rounded" title="复制所有文件代码">
                  {copiedAll ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedAll ? "已复制全部！" : "复制全部"}
                </button>
              )}
              <button onClick={onDownload} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-colors flex items-center gap-1 px-2 py-1 rounded">
                <Download className="w-3 h-3" /> 下载
              </button>
            </div>
          </div>
          <div className="flex h-9">
            {(["preview", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-all relative",
                  activeTab === tab
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />}
                {tab === "preview" ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
                {tab === "preview" ? "预览" : "代码"}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        {activeTab === "preview" ? (
          <PreviewMode files={generatedFiles} isDark={isDark} framework={framework} />
        ) : (
          <CodeMode files={generatedFiles} activeFile={activeFile} isDark={isDark} framework={framework} />
        )}
      </div>
    </div>
  );
}
