"use client";

import React from "react";
import JSZip from "jszip";
import {
  Code2, Eye, Copy, Download, Check, Package,
} from "lucide-react";
import { PreviewMode } from "@/components/editor/PreviewMode";
import { CodeMode } from "@/components/editor/CodeMode";
import type { Framework } from "@/lib/frameworks";

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
  framework, projectName,
  onCopy, onCopyAll, onDownload, onDownloadAll,
  copied, copiedAll,
}: ResultPanelProps) {
  const fileNameList = Object.keys(generatedFiles);

  if (!generatedCode) {
    return (
      <div className={`flex-1 flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${isDark ? "bg-black/30" : "bg-white"}`}>
        <div className="text-center">
          <Code2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
          <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            在左侧绘制或上传设计稿，点击生成代码
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col backdrop-blur-sm relative transition-colors duration-300 ${isDark ? "bg-black/30" : "bg-white"}`}>
      {generatedCode && (
        <div className={`border-b backdrop-blur-xl transition-colors duration-300 ${isDark ? "bg-black/50 border-white/10" : "bg-gray-50 border-gray-200"}`}>
          {fileNameList.length > 1 && (
            <div className={`flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-thin ${isDark ? "border-b border-white/10" : "border-b border-gray-200"}`}>
              {fileNameList.map((name) => {
                const isActive = name === activeFile;
                const ext = name.split(".").pop() || "";
                const isComponent = name.startsWith("/components/");
                const fileName = name.split("/").pop() || name;
                let iconColor = isDark ? "text-blue-400" : "text-blue-600";
                if (ext === "css") iconColor = isDark ? "text-purple-400" : "text-purple-600";
                else if (isComponent) iconColor = isDark ? "text-cyan-400" : "text-cyan-600";
                else if (ext === "ts" || ext === "tsx") iconColor = isDark ? "text-blue-400" : "text-blue-600";

                return (
                  <button
                    key={name}
                    onClick={() => onActiveFileChange(name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all ${
                      isActive
                        ? isDark ? "bg-white/15 text-white shadow-sm" : "bg-gray-900 text-white shadow-sm"
                        : isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                    title={name}
                  >
                    <svg className={`w-3 h-3 flex-shrink-0 ${iconColor}`} viewBox="0 0 16 16" fill="currentColor">
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
            <div className={`text-xs font-mono ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {fileNameList.length} 文件 • {generatedCode.split("\n").length} 行 • {(generatedCode.length / 1024).toFixed(1)} KB
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onDownloadAll}
                className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
                title="打包下载所有文件"
              >
                <Package className="w-3 h-3" />
                打包下载
              </button>
              <button
                onClick={onCopy}
                className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "已复制！" : "复制"}
              </button>
              {fileNameList.length > 1 && (
                <button
                  onClick={onCopyAll}
                  className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                    isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  }`}
                  title="复制所有文件代码"
                >
                  {copiedAll ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedAll ? "已复制全部！" : "复制全部"}
                </button>
              )}
              <button
                onClick={onDownload}
                className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                  isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                <Download className="w-3 h-3" />
                下载
              </button>
            </div>
          </div>
          <div className="flex h-9">
            <button
              onClick={() => onTabChange("preview")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-all relative ${
                activeTab === "preview"
                  ? isDark ? "text-white" : "text-gray-900"
                  : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {activeTab === "preview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
              <Eye className="w-3.5 h-3.5" /> 预览
            </button>
            <button
              onClick={() => onTabChange("code")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium transition-all relative ${
                activeTab === "code"
                  ? isDark ? "text-white" : "text-gray-900"
                  : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {activeTab === "code" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
              )}
              <Code2 className="w-3.5 h-3.5" /> 代码
            </button>
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
