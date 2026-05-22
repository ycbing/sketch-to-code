"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Panel, Group, Separator } from "react-resizable-panels";
import type { Editor as TldrawEditor } from "tldraw";
import {
  Loader2,
  Code2,
  Eye,
  Send,
  Undo2,
  Sparkles,
  ArrowRight,
  X,
  Copy,
  Download,
  History,
  Check,
  AlertCircle,
  Keyboard,
  Moon,
  Sun,
  Home,
  Upload,
  ImagePlus,
} from "lucide-react";
import { getDB, createVersion } from "@/lib/db";
import { parseGeneratedFiles } from "@/lib/parse-files";

// 动态导入重型组件，优化初始加载
const Tldraw = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black/30 dark:bg-black/30 bg-gray-100">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
});

import "tldraw/tldraw.css";
import { PreviewMode } from "@/components/editor/PreviewMode";
import { CodeMode } from "@/components/editor/CodeMode";
import { FRAMEWORK_CONFIGS, type Framework } from "@/lib/frameworks";

type TabType = "preview" | "code";
type Theme = "light" | "dark";

interface CodeVersion {
  code: string;
  timestamp: number;
  description?: string;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [input, setInput] = useState("");
  const [editor, setEditor] = useState<TldrawEditor | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [codeHistory, setCodeHistory] = useState<CodeVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [projectName, setProjectName] = useState<string>("");
  const [framework, setFramework] = useState<Framework>("react");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingFromTemplate, setIsGeneratingFromTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从 localStorage 加载主题偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    const savedFramework = localStorage.getItem("sketch-framework") as Framework | null;
    if (savedFramework && FRAMEWORK_CONFIGS.find((f) => f.id === savedFramework)) {
      setFramework(savedFramework);
    }
  }, []);

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // 主题切换函数
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  }, []);

  // 加载项目信息
  useEffect(() => {
    const loadProject = async () => {
      try {
        const db = await getDB();
        const project = await db.get("projects", projectId);
        if (project) {
          setProjectName(project.name);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    loadProject();
  }, [projectId, router]);

  // --- Vercel AI SDK ---
  // 从 localStorage 加载 AI 配置
  const getAIConfig = useCallback(() => {
    if (typeof window === "undefined") return null;
    const savedConfig = localStorage.getItem("ai-model-config");
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (err) {
        console.error("Failed to parse AI config:", err);
      }
    }
    return null;
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
      headers: () => {
        const config = getAIConfig();
        const hdrs: Record<string, string> = {};
        if (config) {
          hdrs["x-ai-config"] = JSON.stringify(config);
        }
        hdrs["x-framework"] = framework;
        return hdrs;
      },
    }),
  });

  // 模板自动生成：页面加载时检查 URL query param
  const templateAutoTriggered = useRef(false);
  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId || templateAutoTriggered.current) return;
    templateAutoTriggered.current = true;

    // Defer to ensure chat transport is ready
    const timer = setTimeout(async () => {
      try {
        const { getTemplateById } = await import("@/lib/templates");
        const template = getTemplateById(templateId);
        if (!template) {
          setError("模板不存在，请返回重试");
          return;
        }

        setIsGeneratingFromTemplate(true);
        // Small delay to ensure chat transport is ready
        await new Promise((r) => setTimeout(r, 500));
        await sendMessage({ text: template.initialPrompt }).catch((err: any) => {
          console.error("sendMessage failed:", err);
          setError("生成请求失败，请检查网络或 AI 模型配置后重试");
        });
        // Clean up URL
        window.history.replaceState({}, "", `/editor/${projectId}`);
        setIsGeneratingFromTemplate(false);
      } catch (err) {
        console.error("Failed to generate from template:", err);
        setError("模板生成失败，请重试");
        setIsGeneratingFromTemplate(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams, projectId, sendMessage]);

  // 使用 useMemo 缓存计算结果
  const lastMessage = useMemo(() => {
    return messages[messages.length - 1];
  }, [messages]);

  const generatedCode = useMemo(() => {
    if (lastMessage?.role !== "assistant" || !lastMessage?.parts) return "";

    try {
      const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
      if (lastPart?.type === "text") {
        const text = lastPart.text;
        // Parse using multi-file parser
        const { files: parsed } = parseGeneratedFiles(text);
        // Return the main App.js code as the primary generated code string
        return parsed["/App.js"] || parsed["/App.tsx"] || Object.values(parsed)[0] || text.trim();
      }
    } catch (err) {
      console.error("Failed to parse generated code:", err);
      return "";
    }
    return "";
  }, [lastMessage]);

  // Parse all generated files from the last assistant message
  const generatedFiles = useMemo<Record<string, string>>(() => {
    if (lastMessage?.role !== "assistant" || !lastMessage?.parts) return {};
    try {
      const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
      if (lastPart?.type === "text") {
        const { files } = parseGeneratedFiles(lastPart.text);
        return files;
      }
    } catch (err) {
      console.error("Failed to parse files:", err);
    }
    return {};
  }, [lastMessage]);

  const fileNameList = useMemo(() => Object.keys(generatedFiles), [generatedFiles]);
  const [activeFile, setActiveFile] = useState<string>("/App.js");

  // Reset activeFile when new files are generated
  useEffect(() => {
    if (fileNameList.length > 0) {
      if (!fileNameList.includes(activeFile)) {
        setActiveFile(fileNameList[0]);
      }
    }
  }, [fileNameList, activeFile]);

  // 保存代码到历史记录
  useEffect(() => {
    if (
      generatedCode &&
      generatedCode !== codeHistory[codeHistory.length - 1]?.code
    ) {
      setCodeHistory((prev) => [
        ...prev.slice(-9),
        { code: generatedCode, timestamp: Date.now() },
      ]);
    }
  }, [generatedCode]);

  // 保存版本到数据库
  const saveVersionToDatabase = useCallback(
    async (code: string) => {
      if (!editor) return;
      // 安全检查 store 已就绪
      try { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ (editor as any).store.getState(); } catch { return; }

      try {
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size === 0) return;

        const imageRes = await editor.toImage([...shapeIds], {
          quality: 1,
          format: "png",
        });

        const sketchImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageRes.blob);
        });

        const sketchData = JSON.stringify(editor.store.serialize());

        await createVersion(projectId, {
          sketchData,
          sketchImage,
          generatedCode: code,
          requirements: input || undefined,
        });
      } catch (err) {
        console.error("Failed to save version:", err);
      }
    },
    [editor, projectId, input],
  );

  // 当生成新代码时自动保存到数据库
  useEffect(() => {
    if (
      generatedCode &&
      generatedCode !== codeHistory[codeHistory.length - 1]?.code
    ) {
      saveVersionToDatabase(generatedCode);
    }
  }, [generatedCode, codeHistory, saveVersionToDatabase]);

  // 使用 useCallback 优化函数
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim()) return;

      setError(null);
      sendMessage({ text: input });
      setInput("");
    },
    [input, sendMessage],
  );

  const getCanvasImage = useCallback(async () => {
    if (!editor) {
      setError("画布还在加载中，请稍后重试");
      return null;
    }

    try {
      // 安全检查：确保 editor 内部状态已就绪
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).store.getState();
      } catch {
        setError("画布还在初始化中，请稍后重试");
        return null;
      }

      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) {
        setError("请先在画布上绘制内容，或上传设计稿截图");
        return null;
      }

      const imageRes = await editor.toImage([...shapeIds], {
        quality: 1,
        format: "png",
      });

      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => {
          setError("处理画布图片失败");
          resolve(null as any);
        };
        reader.readAsDataURL(imageRes.blob);
      });
    } catch (err) {
      setError("捕获画布失败，请重试。");
      console.error(err);
      return null;
    }
  }, [editor]);

  // --- Image Upload Handling ---
  const processFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setError("不支持的图片格式，请使用 PNG、JPG 或 WebP");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("图片大小不能超过 20MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("读取图片失败，请重试");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so re-selecting the same file works
      e.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only unset if leaving the drop zone (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const removeUploadedImage = useCallback(() => {
    setUploadedImage(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (status === "streaming") return; // 防止重复点击
    setError(null);

    // Priority: uploaded image > canvas screenshot
    let image: string | null = uploadedImage;
    let source = uploadedImage ? "uploaded" : "canvas";

    if (!image) {
      image = await getCanvasImage();
    }

    if (!image) {
      if (!error) {
        setError("请先在画布上绘制内容或上传设计稿截图");
      }
      return;
    }

    const promptText =
      source === "uploaded"
        ? "基于这张设计稿截图创建一个 React 组件。使用 Tailwind CSS。尽量还原设计稿的布局、颜色、字体和间距。"
        : "基于这个线框图创建一个 React 组件。使用 Tailwind CSS。";

    // Determine media type from data URL
    let mediaType = "image/png";
    if (image.startsWith("data:image/jpeg")) mediaType = "image/jpeg";
    else if (image.startsWith("data:image/webp")) mediaType = "image/webp";

    await sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: promptText,
        },
        {
          type: "file",
          mediaType,
          url: image,
        },
      ],
    });

    setActiveTab("preview");
  }, [uploadedImage, getCanvasImage, sendMessage, error]);

  const handleCopyCode = useCallback(async () => {
    const code = generatedFiles[activeFile] || generatedCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("复制代码失败");
    }
  }, [generatedFiles, activeFile, generatedCode]);

  const handleDownloadCode = useCallback(() => {
    const code = generatedFiles[activeFile] || generatedCode;
    if (!code) return;

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = activeFile.split("/").pop() || "component";
    a.download = `${fileName}-${Date.now()}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedFiles, activeFile, generatedCode]);

  // 快捷键支持 + 粘贴图片
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter: 生成代码
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
      // Cmd/Ctrl + K: 显示快捷键
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }
      // Cmd/Ctrl + S: 保存
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (generatedCode) {
          saveVersionToDatabase(generatedCode);
        }
      }
      // Escape: 清除错误
      if (e.key === "Escape") {
        setError(null);
        setShowKeyboardShortcuts(false);
      }
    };

    // Paste handler for images
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) processFile(file);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleGenerate, saveVersionToDatabase, generatedCode, processFile]);

  // 主题相关的类名
  const isDark = theme === "dark";

  return (
    <div
      className={`h-screen w-full flex flex-col font-sans overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Background gradient effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {isDark ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-white/10 opacity-20 blur-[100px]"></div>
            <div className="absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-blue-500/10 opacity-20 blur-[100px]"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-purple-100/30"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-200 opacity-30 blur-[100px]"></div>
            <div className="absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-purple-200 opacity-30 blur-[100px]"></div>
          </>
        )}
      </div>

      {/* --- Header --- */}
      <header
        className={`h-16 border-b flex items-center px-6 justify-between z-10 shrink-0 backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "bg-black/50 border-white/10"
            : "bg-white/80 border-gray-200 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/dashboard")}
            className={`transition-colors ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center ${
                isDark ? "from-white to-gray-400" : "from-gray-900 to-gray-700"
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${isDark ? "text-black" : "text-white"}`}
              />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">
                {projectName || "加载中..."}
              </span>
            </div>
            {/* Framework Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              {FRAMEWORK_CONFIGS.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => {
                    setFramework(fw.id);
                    localStorage.setItem("sketch-framework", fw.id);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    framework === fw.id
                      ? isDark
                        ? "bg-white text-black shadow-sm"
                        : "bg-white text-gray-900 shadow-sm"
                      : isDark
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
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
            onClick={() => setShowKeyboardShortcuts(true)}
            className={`text-xs transition-colors flex items-center gap-1 ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Keyboard className="w-3 h-3" />
            快捷键
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs transition-colors flex items-center gap-1 ${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="查看代码历史"
          >
            <History className="w-3 h-3" />
            历史 ({codeHistory.length})
          </button>
          <button
            onClick={toggleTheme}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isDark
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            title={`切换到${isDark ? "浅色" : "深色"}模式`}
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <div
            className={`text-xs flex items-center gap-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="hidden sm:inline">自动保存</span>
          </div>
        </div>
      </header>

      {/* --- Error Toast --- */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-xl rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-200 dark:text-red-200 text-red-700">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- Keyboard Shortcuts Modal --- */}
      {showKeyboardShortcuts && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
            isDark ? "bg-black/80" : "bg-black/50"
          }`}
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div
            className={`border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transition-colors duration-300 ${
              isDark
                ? "bg-black/90 border-white/10"
                : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">键盘快捷键</h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className={`transition-colors ${
                  isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  生成代码
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  ⌘/Ctrl + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  保存版本
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  ⌘/Ctrl + S
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  显示快捷键
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  ⌘/Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  关闭对话框
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  发送消息
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  粘贴上传截图
                </span>
                <kbd
                  className={`px-2 py-1 rounded text-xs ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                >
                  Ctrl + V
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Workspace --- */}
      <Group
        orientation="horizontal"
        className="flex-1 overflow-hidden relative z-10"
      >
        {/* --- LEFT: Canvas (Tldraw) --- */}
        <Panel
          defaultSize={50}
          minSize={30}
          className={`relative flex flex-col border-r backdrop-blur-sm transition-colors duration-300 ${
            isDark ? "bg-black/30 border-white/10" : "bg-white border-gray-200"
          }`}
        >
          <div className="w-full h-full relative">
            <Tldraw
              onMount={(ed) => setEditor(ed)}
              persistenceKey={`sketch-project-${projectId}`}
              hideUi={false}
            />

            {/* Image Upload Drop Zone - overlay on canvas */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="absolute inset-0 z-[1500] pointer-events-none"
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 pointer-events-auto flex items-center justify-center">
                  <div
                    className={`absolute inset-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${
                      isDark
                        ? "bg-black/60 border-blue-400"
                        : "bg-white/80 border-blue-500"
                    }`}
                  >
                    <Upload className="w-10 h-10 text-blue-400" />
                    <span
                      className={`text-sm font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      释放以上传设计稿
                    </span>
                  </div>
                </div>
              )}

              {/* Upload thumbnail indicator */}
              {uploadedImage && (
                <div className="absolute top-3 left-3 pointer-events-auto z-[1600]">
                  <div
                    className={`group relative rounded-lg overflow-hidden border shadow-lg transition-all ${
                      isDark
                        ? "border-white/20 bg-black/80"
                        : "border-gray-200 bg-white shadow-gray-200"
                    }`}
                  >
                    <img
                      src={uploadedImage}
                      alt="上传的设计稿"
                      className="w-20 h-20 object-cover"
                    />
                    <button
                      onClick={removeUploadedImage}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-md ${
                        isDark
                          ? "bg-gray-800 hover:bg-red-500 text-white"
                          : "bg-white hover:bg-red-500 text-gray-700 hover:text-white border border-gray-200"
                      }`}
                      title="移除图片"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div
                      className={`absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 ${
                        isDark
                          ? "bg-black/70 text-gray-300"
                          : "bg-white/80 text-gray-600"
                      }`}
                    >
                      设计稿
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Floating control — top of canvas to avoid tldraw bottom toolbar overlap */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-lg">
              <div
                className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl transition-colors duration-300 ${
                  isDark
                    ? "bg-black/80 border-white/10 shadow-black/50"
                    : "bg-white/95 border-gray-200 shadow-gray-300/50"
                }`}
              >
                {/* Upload preview strip (when image is uploaded, show inline) */}
                {uploadedImage && (
                  <div className="mb-3 flex items-center gap-3 p-2 rounded-lg border border-dashed transition-colors">
                    <img
                      src={uploadedImage}
                      alt="设计稿预览"
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        已上传设计稿
                      </p>
                      <p
                        className={`text-[10px] ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        点击生成将使用此图片
                      </p>
                    </div>
                    <button
                      onClick={removeUploadedImage}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isDark
                          ? "hover:bg-white/10 text-gray-400 hover:text-white"
                          : "hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                      }`}
                      title="移除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-12 h-12 flex items-center justify-center border rounded-xl transition-all flex-shrink-0 ${
                      uploadedImage
                        ? "border-green-500/50 bg-green-500/10"
                        : isDark
                          ? "border-white/20 hover:bg-white/10 hover:border-white/30"
                          : "border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    title="上传设计稿截图（支持 PNG / JPG / WebP，或 Ctrl+V 粘贴）"
                  >
                    {uploadedImage ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={status === "streaming"}
                    className={`flex-1 group relative h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden disabled:opacity-50 ${
                      isDark
                        ? "bg-white text-black hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {status === "streaming" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {generatedCode ? "重新生成" : "生成代码"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => editor?.undo()}
                    className={`w-12 h-12 flex items-center justify-center border rounded-xl transition-all ${
                      isDark
                        ? "border-white/20 hover:bg-white/10 hover:border-white/30"
                        : "border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    title="撤销绘图"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                </div>
                <div
                  className={`mt-3 text-[11px] text-center font-mono ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  绘制或上传 → 生成 → 自动保存
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* --- Resizer Handle --- */}
        <Separator
          className={`w-1.5 hover:transition-colors flex items-center justify-center group ${
            isDark
              ? "bg-white/5 hover:bg-white/20"
              : "bg-gray-200 hover:bg-gray-400"
          }`}
        >
          <div
            className={`h-8 w-0.5 rounded-full transition-colors ${
              isDark
                ? "bg-white/20 group-hover:bg-white/40"
                : "bg-gray-300 group-hover:bg-gray-500"
            }`}
          ></div>
        </Separator>

        {/* --- RIGHT: Result (Sandpack) --- */}
        <Panel
          defaultSize={50}
          minSize={30}
          className={`flex flex-col backdrop-blur-sm relative transition-colors duration-300 ${
            isDark ? "bg-black/30" : "bg-white"
          }`}
        >
          {/* File Tree + Action Bar */}
          {generatedCode && (
            <div
              className={`border-b backdrop-blur-xl transition-colors duration-300 ${
                isDark
                  ? "bg-black/50 border-white/10"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              {/* File tree — hidden when only 1 file */}
              {fileNameList.length > 1 && (
                <div className={`flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-thin ${isDark ? 'border-b border-white/10' : 'border-b border-gray-200'}`}>
                  {fileNameList.map((name) => {
                    const isActive = name === activeFile;
                    const ext = name.split('.').pop() || '';
                    const isComponent = name.startsWith('/components/');
                    const fileName = name.split('/').pop() || name;

                    // Color by extension / location
                    let iconColor = isDark ? 'text-blue-400' : 'text-blue-600';
                    if (ext === 'css') iconColor = isDark ? 'text-purple-400' : 'text-purple-600';
                    else if (isComponent) iconColor = isDark ? 'text-cyan-400' : 'text-cyan-600';
                    else if (ext === 'ts' || ext === 'tsx') iconColor = isDark ? 'text-blue-400' : 'text-blue-600';

                    return (
                      <button
                        key={name}
                        onClick={() => setActiveFile(name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all ${
                          isActive
                            ? isDark
                              ? 'bg-white/15 text-white shadow-sm'
                              : 'bg-gray-900 text-white shadow-sm'
                            : isDark
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                        title={name}
                      >
                        <svg
                          className={`w-3 h-3 flex-shrink-0 ${iconColor}`}
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          {isComponent ? (
                            // Component icon (folder-like)
                            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.172a1.5 1.5 0 0 1 1.06.44l.83.828H13.5A1.5 1.5 0 0 1 15 5.5v7A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-9Z" />
                          ) : (
                            // File icon
                            <path d="M4 1h5.586a1 1 0 0 1 .707.293l3.414 3.414a1 1 0 0 1 .293.707V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm4 1v3a1 1 0 0 0 1 1h3L8 2Z" />
                          )}
                        </svg>
                        {fileName}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Stats bar */}
              <div className="h-10 flex items-center justify-between px-4">
                <div
                  className={`text-xs font-mono ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {fileNameList.length} 文件 •{" "}
                  {generatedCode.split("\n").length} 行 •{" "}
                  {(generatedCode.length / 1024).toFixed(1)} KB
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                      isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copied ? "已复制！" : "复制"}
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className={`text-xs transition-colors flex items-center gap-1 px-2 py-1 rounded ${
                      isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    下载
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div
            className={`h-12 border-b flex backdrop-blur-xl transition-colors duration-300 ${
              isDark
                ? "bg-black/50 border-white/10"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                activeTab === "preview"
                  ? isDark
                    ? "text-white"
                    : "text-gray-900"
                  : isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {activeTab === "preview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
              <Eye className="w-4 h-4" /> 预览
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                activeTab === "code"
                  ? isDark
                    ? "text-white"
                    : "text-gray-900"
                  : isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {activeTab === "code" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
              <Code2 className="w-4 h-4" /> 代码
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {generatedCode ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  {activeTab === "preview" ? (
                    <PreviewMode files={generatedFiles} isDark={isDark} framework={framework} />
                  ) : (
                    <CodeMode files={generatedFiles} activeFile={activeFile} isDark={isDark} framework={framework} />
                  )}
                </div>

                {/* Refinement Chat Input */}
                <form
                  onSubmit={handleSubmit}
                  className={`p-4 backdrop-blur-xl border-t shrink-0 transition-colors duration-300 ${
                    isDark
                      ? "bg-black/50 border-white/10"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  {/* Quick suggestion chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["改成深色模式", "增加圆角和阴影", "改成响应式布局", "添加动画效果"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={status === "streaming"}
                          onClick={() => {
                            setInput(suggestion);
                            // Auto-send the suggestion
                            setError(null);
                            sendMessage({ text: suggestion });
                            setInput("");
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDark
                              ? "border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20"
                              : "border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="描述你想要的修改（如：把标题改成红色、添加阴影效果）"
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                          isDark
                            ? "bg-white/5 border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600"
                            : "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                        }`}
                      />
                      {input && (
                        <button
                          type="button"
                          onClick={() => setInput("")}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                            isDark
                              ? "text-gray-500 hover:text-white"
                              : "text-gray-400 hover:text-gray-700"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={status === "streaming" || !input.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3 rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none"
                    >
                      {status === "streaming" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div
                    className={`mt-2 text-[10px] text-center font-mono flex items-center justify-center gap-3 ${
                      isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    <span>按 Enter 发送</span>
                    <span>•</span>
                    <span>点击上方标签快速修改</span>
                    <span>•</span>
                    <span>⌘/Ctrl + K 查看快捷键</span>
                  </div>
                </form>
              </div>
            ) : (
              // Empty State
              <div
                className={`h-full flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {isGeneratingFromTemplate ? (
                  <>
                    <div className="relative mb-8">
                      <div
                        className={`w-24 h-24 border rounded-2xl flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${
                          isDark
                            ? "border-violet-500/30 bg-violet-500/10"
                            : "border-violet-300 bg-violet-50"
                        }`}
                      >
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl -z-10 animate-pulse"></div>
                    </div>
                    <h3
                      className={`text-2xl font-semibold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      正在从模板生成...
                    </h3>
                    <p
                      className={`max-w-md text-sm leading-relaxed ${
                        isDark ? "text-gray-500" : "text-gray-600"
                      }`}
                    >
                      AI 正在根据模板生成页面代码，请稍候片刻
                    </p>
                  </>
                ) : (
                <>
                <div className="relative mb-8">
                  <div
                    className={`w-24 h-24 border rounded-2xl flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${
                      isDark
                        ? "border-white/10 bg-white/5"
                        : "border-gray-300 bg-gray-100"
                    }`}
                  >
                    <Sparkles
                      className={`w-12 h-12 ${
                        isDark ? "text-gray-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10"></div>
                </div>
                <h3
                  className={`text-2xl font-semibold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  将想法转化为代码
                </h3>
                <p
                  className={`max-w-md text-sm leading-relaxed ${
                    isDark ? "text-gray-500" : "text-gray-600"
                  }`}
                >
                  在画布上绘制 UI 设计，或上传设计稿截图，观看 AI 代码生成技术让它变为现实。
                </p>
                <div
                  className={`mt-8 flex items-center gap-4 text-xs font-mono ${
                    isDark ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <span className={isDark ? "text-white" : "text-gray-700"}>
                        1
                      </span>
                    </div>
                    <span>绘制或上传</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <span className={isDark ? "text-white" : "text-gray-700"}>
                        2
                      </span>
                    </div>
                    <span>生成代码</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    >
                      <span className={isDark ? "text-white" : "text-gray-700"}>
                        3
                      </span>
                    </div>
                    <span>自动保存</span>
                  </div>
                </div>
                </>
                )}
              </div>
            )}
          </div>
        </Panel>
      </Group>

      {/* --- Code History Sidebar --- */}
      {showHistory && (
        <div
          className={`fixed right-0 top-16 bottom-0 w-80 backdrop-blur-xl border-l z-40 animate-in slide-in-from-right duration-300 transition-colors ${
            isDark
              ? "bg-black/95 border-white/10"
              : "bg-white border-gray-200 shadow-lg"
          }`}
        >
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isDark ? "border-white/10" : "border-gray-200"
            }`}
          >
            <h3 className="font-semibold">代码历史</h3>
            <button
              onClick={() => setShowHistory(false)}
              className={`transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-auto p-4 space-y-2 h-[calc(100%-60px)]">
            {codeHistory.length === 0 ? (
              <p
                className={`text-sm text-center py-8 ${
                  isDark ? "text-gray-600" : "text-gray-400"
                }`}
              >
                暂无历史记录
              </p>
            ) : (
              codeHistory.map((version, index) => (
                <button
                  key={version.timestamp}
                  onClick={() => {
                    navigator.clipboard.writeText(version.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      版本 {codeHistory.length - index}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isDark ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {new Date(version.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs font-mono truncate">
                    {version.code.split("\n")[0]}...
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${
                      isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {version.code.split("\n").length} 行
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
