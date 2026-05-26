"use client";

import React from "react";
import {
  Loader2, Sparkles, Keyboard, History, Share2, Sun, Moon,
  Home, Coins, LogOut,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { FRAMEWORK_CONFIGS, type Framework } from "@/lib/frameworks";
import Link from "next/link";

interface EditorHeaderProps {
  projectName: string;
  isDark: boolean;
  framework: Framework;
  onFrameworkChange: (fw: Framework) => void;
  onShowKeyboardShortcuts: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  codeHistoryLength: number;
  onShare: () => void;
  shareUrl: string | null;
  shareLoading: boolean;
  copied: boolean;
  onToggleTheme: () => void;
  credits: number | null;
}

export function EditorHeader({
  projectName, isDark, framework, onFrameworkChange,
  onShowKeyboardShortcuts, onToggleHistory, showHistory, codeHistoryLength,
  onShare, shareUrl, shareLoading, copied,
  onToggleTheme, credits,
}: EditorHeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={`h-16 border-b flex items-center px-6 justify-between z-10 shrink-0 backdrop-blur-xl transition-colors duration-300 ${
        isDark ? "bg-black/50 border-white/10" : "bg-white/80 border-gray-200 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className={`transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center ${
              isDark ? "from-white to-gray-400" : "from-gray-900 to-gray-700"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isDark ? "text-black" : "text-white"}`} />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            {projectName || "加载中..."}
          </span>
          <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
            {FRAMEWORK_CONFIGS.map((fw) => (
              <button
                key={fw.id}
                onClick={() => onFrameworkChange(fw.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  framework === fw.id
                    ? isDark ? "bg-white text-black shadow-sm" : "bg-white text-gray-900 shadow-sm"
                    : isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                title={fw.description}
              >
                {fw.icon} {fw.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onShowKeyboardShortcuts}
          className={`text-xs transition-colors flex items-center gap-1 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Keyboard className="w-3 h-3" />
          快捷键
        </button>
        <button
          onClick={onToggleHistory}
          className={`text-xs transition-colors flex items-center gap-1 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          title="查看代码历史"
        >
          <History className="w-3 h-3" />
          历史 ({codeHistoryLength})
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className={`text-xs transition-colors flex items-center gap-1 ${
            shareUrl
              ? isDark ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"
              : isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
          } ${shareLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          title={shareUrl ? "复制分享链接" : "分享项目"}
        >
          {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
          {shareUrl ? (copied ? "已复制！" : "已分享") : "分享"}
        </button>
        <button
          onClick={onToggleTheme}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          title={`切换到${isDark ? "浅色" : "深色"}模式`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {session?.user && credits !== null && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              credits < 20
                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                : isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-700"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{credits}</span>
          </div>
        )}
        {session?.user && (
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {session.user.name || session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isDark ? "hover:bg-white/10 text-gray-500 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-700"
              }`}
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className={`text-xs flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="hidden sm:inline">自动保存</span>
        </div>
      </div>
    </header>
  );
}
