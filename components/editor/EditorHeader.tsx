"use client";

import React from "react";
import { Loader2, Sparkles, Keyboard, History, Share2, Sun, Moon, Home, Coins, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { FRAMEWORK_CONFIGS, type Framework } from "@/lib/frameworks";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EditorHeaderProps {
  projectName: string;
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
  projectName, framework, onFrameworkChange,
  onShowKeyboardShortcuts, onToggleHistory, showHistory, codeHistoryLength,
  onShare, shareUrl, shareLoading, copied,
  onToggleTheme, credits,
}: EditorHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-white/10 flex items-center px-6 justify-between z-10 shrink-0 backdrop-blur-xl bg-white/80 dark:bg-black/50 transition-colors duration-300 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} />
          <span className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">
            {projectName || "加载中..."}
          </span>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-white/10">
            {FRAMEWORK_CONFIGS.map((fw) => (
              <button
                key={fw.id}
                onClick={() => onFrameworkChange(fw.id)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                  framework === fw.id
                    ? "bg-white dark:bg-white text-gray-900 dark:text-black shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white",
                )}
                title={fw.description}
              >
                {fw.icon} {fw.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onShowKeyboardShortcuts} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
          <Keyboard className="w-3 h-3" /> 快捷键
        </button>
        <button onClick={onToggleHistory} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1" title="查看代码历史">
          <History className="w-3 h-3" /> 历史 ({codeHistoryLength})
        </button>
        <button
          onClick={onShare}
          disabled={shareLoading}
          className={cn(
            "text-xs transition-colors flex items-center gap-1",
            shareUrl ? "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
            shareLoading && "opacity-50 cursor-not-allowed",
          )}
          title={shareUrl ? "复制分享链接" : "分享项目"}
        >
          {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
          {shareUrl ? (copied ? "已复制！" : "已分享") : "分享"}
        </button>
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white"
          title="切换主题"
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 block dark:hidden" />
        </button>
        {session?.user && credits !== null && (
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
            credits < 20
              ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
              : "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300",
          )}>
            <Coins className="w-3.5 h-3.5" />
            <span>{credits}</span>
          </div>
        )}
        {session?.user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">{session.user.name || session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="text-xs flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="hidden sm:inline">自动保存</span>
        </div>
      </div>
    </header>
  );
}
