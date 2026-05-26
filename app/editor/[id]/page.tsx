"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Panel, Group, Separator } from "react-resizable-panels";
import type { Editor as TldrawEditor } from "tldraw";
import JSZip from "jszip";
import {
  Loader2, Send, X, Sparkles, ArrowRight, AlertCircle, Code2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getDB, createVersion, shareProject } from "@/lib/db";

import "tldraw/tldraw.css";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { CanvasPanel } from "@/components/editor/CanvasPanel";
import { ResultPanel } from "@/components/editor/ResultPanel";
import { useEditorState } from "@/components/editor/useEditorState";
import { FRAMEWORK_CONFIGS, type Framework } from "@/lib/frameworks";

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

  const [editor, setEditor] = useState<TldrawEditor | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [framework, setFramework] = useState<Framework>("react");
  const [isGeneratingFromTemplate, setIsGeneratingFromTemplate] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"canvas" | "result">("canvas");
  const { data: session } = useSession();

  const state = useEditorState(framework);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => { if (data.credits !== undefined) setCredits(data.credits); })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const savedFramework = localStorage.getItem("sketch-framework") as Framework | null;
    if (savedFramework && FRAMEWORK_CONFIGS.find((f) => f.id === savedFramework)) {
      setFramework(savedFramework);
    }
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const db = await getDB();
        const project = await db.get("projects", projectId);
        if (project) {
          setProjectName(project.name);
          if (project.shareToken) setShareUrl(`/share/${project.shareToken}`);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    loadProject();
  }, [projectId, router]);

  const handleShare = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(window.location.origin + shareUrl);
        state.setCopied(true);
        setTimeout(() => state.setCopied(false), 2000);
      } catch { state.setError("复制链接失败"); }
      return;
    }
    setShareLoading(true);
    try {
      const token = await shareProject(projectId);
      const url = `/share/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(window.location.origin + url);
      state.setCopied(true);
      setTimeout(() => state.setCopied(false), 2000);
    } catch { state.setError("分享失败，请重试"); }
    finally { setShareLoading(false); }
  }, [shareUrl, projectId, state.setCopied, state.setError]);

  useEffect(() => {
    if (state.chatError && session?.user?.id) {
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => { if (data.credits !== undefined) setCredits(data.credits); })
        .catch(() => {});
    }
  }, [state.chatError, session?.user?.id]);

  const templateAutoTriggered = useRef(false);
  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId || templateAutoTriggered.current) return;
    templateAutoTriggered.current = true;
    const timer = setTimeout(async () => {
      try {
        const { getTemplateById } = await import("@/lib/templates");
        const template = getTemplateById(templateId);
        if (!template) { state.setError("模板不存在，请返回重试"); return; }
        setIsGeneratingFromTemplate(true);
        await new Promise((r) => setTimeout(r, 500));
        await state.sendMessage({ text: template.initialPrompt }).catch((err: any) => {
          console.error("sendMessage failed:", err);
          state.setError("生成请求失败，请检查网络或 AI 模型配置后重试");
        });
        window.history.replaceState({}, "", `/editor/${projectId}`);
        setIsGeneratingFromTemplate(false);
      } catch (err) {
        console.error("Failed to generate from template:", err);
        state.setError("模板生成失败，请重试");
        setIsGeneratingFromTemplate(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchParams, projectId, state.sendMessage]);

  useEffect(() => {
    if (state.generatedCode && state.generatedCode !== state.codeHistory[state.codeHistory.length - 1]?.code) {
      fetch("/api/credits")
        .then((res) => res.json())
        .then((data) => { if (data.credits !== undefined) setCredits(data.credits); })
        .catch(() => {});
    }
  }, [state.generatedCode, state.codeHistory]);

  const saveVersionToDatabase = useCallback(
    async (code: string) => {
      if (!editor) return;
      try { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ (editor as any).store.getState(); } catch { return; }
      try {
        const shapeIds = editor.getCurrentPageShapeIds();
        if (shapeIds.size === 0) return;
        const imageRes = await editor.toImage([...shapeIds], { quality: 1, format: "png" });
        const sketchImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageRes.blob);
        });
        const sketchData = JSON.stringify(editor.store.serialize());
        await createVersion(projectId, { sketchData, sketchImage, generatedCode: code, requirements: state.input || undefined });
      } catch (err) { console.error("Failed to save version:", err); }
    },
    [editor, projectId, state.input],
  );

  useEffect(() => {
    if (state.generatedCode && state.generatedCode !== state.codeHistory[state.codeHistory.length - 1]?.code) {
      saveVersionToDatabase(state.generatedCode);
    }
  }, [state.generatedCode, state.codeHistory, saveVersionToDatabase]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!state.input.trim()) return;
      state.setError(null);
      state.sendMessage({ text: state.input });
      state.setInput("");
    },
    [state.input, state.sendMessage, state.setError],
  );

  const getCanvasImage = useCallback(async () => {
    if (!editor) { state.setError("画布还在加载中，请稍后重试"); return null; }
    try {
      try { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ (editor as any).store.getState(); } catch { state.setError("画布还在初始化中，请稍后重试"); return null; }
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) { state.setError("请先在画布上绘制内容，或上传设计稿截图"); return null; }
      const imageRes = await editor.toImage([...shapeIds], { quality: 1, format: "png" });
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => { state.setError("处理画布图片失败"); resolve(null as any); };
        reader.readAsDataURL(imageRes.blob);
      });
    } catch (err) { state.setError("捕获画布失败，请重试。"); console.error(err); return null; }
  }, [editor, state.setError]);

  const processFile = useCallback((file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) { state.setError("不支持的图片格式，请使用 PNG、JPG 或 WebP"); return; }
    if (file.size > 20 * 1024 * 1024) { state.setError("图片大小不能超过 20MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { state.setUploadedImage(reader.result as string); state.setError(null); };
    reader.onerror = () => { state.setError("读取图片失败，请重试"); };
    reader.readAsDataURL(file);
  }, [state.setUploadedImage, state.setError]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); state.setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile, state.setIsDragging]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); state.setIsDragging(true); }, [state.setIsDragging]);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget === e.target) state.setIsDragging(false);
  }, [state.setIsDragging]);

  const handleGenerate = useCallback(async () => {
    if (state.status === "streaming") return;
    state.setError(null);
    if (session?.user?.id && credits !== null && credits < 20) { state.setError("积分不足，请升级套餐"); return; }
    let image: string | null = state.uploadedImage;
    const source = state.uploadedImage ? "uploaded" : "canvas";
    if (!image) image = await getCanvasImage();
    if (!image) { if (!state.error) state.setError("请先在画布上绘制内容或上传设计稿截图"); return; }
    const promptText = source === "uploaded"
      ? "基于这张设计稿截图创建一个 React 组件。使用 Tailwind CSS。尽量还原设计稿的布局、颜色、字体和间距。"
      : "基于这个线框图创建一个 React 组件。使用 Tailwind CSS。";
    let mediaType = "image/png";
    if (image.startsWith("data:image/jpeg")) mediaType = "image/jpeg";
    else if (image.startsWith("data:image/webp")) mediaType = "image/webp";
    await state.sendMessage({ role: "user", parts: [{ type: "text", text: promptText }, { type: "file", mediaType, url: image }] });
    state.setActiveTab("preview");
  }, [state.uploadedImage, getCanvasImage, state.sendMessage, state.error, session?.user?.id, credits]);

  const handleCopyCode = useCallback(async () => {
    const code = state.generatedFiles[state.activeFile] || state.generatedCode;
    if (!code) return;
    try { await navigator.clipboard.writeText(code); state.setCopied(true); setTimeout(() => state.setCopied(false), 2000); }
    catch { state.setError("复制代码失败"); }
  }, [state.generatedFiles, state.activeFile, state.generatedCode]);

  const handleCopyAllCode = useCallback(async () => {
    if (Object.keys(state.generatedFiles).length === 0) return;
    try {
      const allCode = Object.entries(state.generatedFiles).map(([path, code]) => `// ---${path}---\n${code}`).join("\n\n");
      await navigator.clipboard.writeText(allCode);
      state.setCopiedAll(true); setTimeout(() => state.setCopiedAll(false), 2000);
    } catch { state.setError("复制全部代码失败"); }
  }, [state.generatedFiles]);

  const handleDownloadCode = useCallback(() => {
    const code = state.generatedFiles[state.activeFile] || state.generatedCode;
    if (!code) return;
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${state.activeFile.split("/").pop() || "component"}-${Date.now()}.js`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.generatedFiles, state.activeFile, state.generatedCode]);

  const handleDownloadAll = useCallback(async () => {
    if (Object.keys(state.generatedFiles).length === 0) return;
    try {
      const zip = new JSZip();
      for (const [filePath, content] of Object.entries(state.generatedFiles)) {
        zip.file(filePath.startsWith("/") ? filePath.slice(1) : filePath, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${projectName || "project"}-${Date.now()}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { state.setError("打包下载失败"); }
  }, [state.generatedFiles, projectName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); state.setShowKeyboardShortcuts((prev) => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (state.generatedCode) saveVersionToDatabase(state.generatedCode); }
      if (e.key === "Escape") { state.setError(null); state.setShowKeyboardShortcuts(false); }
    };
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) { e.preventDefault(); const file = items[i].getAsFile(); if (file) processFile(file); return; }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("paste", handlePaste);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("paste", handlePaste); };
  }, [handleGenerate, saveVersionToDatabase, state.generatedCode, processFile]);

  const handleFrameworkChange = useCallback((fw: Framework) => {
    setFramework(fw);
    localStorage.setItem("sketch-framework", fw);
  }, []);

  return (
    <div className={`h-screen w-full flex flex-col font-sans overflow-hidden transition-colors duration-300 ${state.isDark ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        {state.isDark ? (
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

      <EditorHeader
        projectName={projectName}
        isDark={state.isDark}
        framework={framework}
        onFrameworkChange={handleFrameworkChange}
        onShowKeyboardShortcuts={() => state.setShowKeyboardShortcuts(true)}
        onToggleHistory={() => state.setShowHistory(!state.showHistory)}
        showHistory={state.showHistory}
        codeHistoryLength={state.codeHistory.length}
        onShare={handleShare}
        shareUrl={shareUrl}
        shareLoading={shareLoading}
        copied={state.copied}
        onToggleTheme={state.toggleTheme}
        credits={credits}
      />

      {state.error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300">
          <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-xl rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-200 dark:text-red-200 text-red-700">{state.error}</span>
            <button onClick={() => state.setError(null)} className="text-red-400 hover:text-red-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {state.showKeyboardShortcuts && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${state.isDark ? "bg-black/80" : "bg-black/50"}`} onClick={() => state.setShowKeyboardShortcuts(false)}>
          <div className={`border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transition-colors duration-300 ${state.isDark ? "bg-black/90 border-white/10" : "bg-white border-gray-200"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">键盘快捷键</h3>
              <button onClick={() => state.setShowKeyboardShortcuts(false)} className={`transition-colors ${state.isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["生成代码", "⌘/Ctrl + Enter"],
                ["保存版本", "⌘/Ctrl + S"],
                ["显示快捷键", "⌘/Ctrl + K"],
                ["关闭对话框", "Esc"],
                ["发送消息", "Enter"],
                ["粘贴上传截图", "Ctrl + V"],
              ].map(([label, key]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={state.isDark ? "text-gray-400" : "text-gray-600"}>{label}</span>
                  <kbd className={`px-2 py-1 rounded text-xs ${state.isDark ? "bg-white/10" : "bg-gray-200"}`}>{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <div className="md:hidden flex border-t shrink-0 z-20 relative" style={{ backdropFilter: "blur(20px)" }}>
        <button
          onClick={() => setMobileView("canvas")}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            mobileView === "canvas"
              ? state.isDark ? "text-white bg-white/10" : "text-gray-900 bg-gray-100"
              : state.isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> 画布
        </button>
        <button
          onClick={() => setMobileView("result")}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            mobileView === "result"
              ? state.isDark ? "text-white bg-white/10" : "text-gray-900 bg-gray-100"
              : state.isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> 代码
        </button>
      </div>

      {/* Mobile layout: show one panel at a time */}
      <div className="md:hidden flex-1 overflow-hidden relative z-10">
        {mobileView === "canvas" ? (
          <CanvasPanel
            projectId={projectId}
            isDark={state.isDark}
            uploadedImage={state.uploadedImage}
            isDragging={state.isDragging}
            isStreaming={state.status === "streaming"}
            hasCode={!!state.generatedCode}
            onEditorMount={setEditor}
            onGenerate={handleGenerate}
            onStop={state.stop}
            onRemoveImage={() => state.setUploadedImage(null)}
            onFileInput={handleFileInput}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            lastMessage={state.messages[state.messages.length - 1]}
          />
        ) : state.generatedCode ? (
          <div className="h-full flex flex-col">
            <ResultPanel
              isDark={state.isDark}
              activeTab={state.activeTab}
              onTabChange={state.setActiveTab}
              generatedCode={state.generatedCode}
              generatedFiles={state.generatedFiles}
              activeFile={state.activeFile}
              onActiveFileChange={state.setActiveFile}
              framework={framework}
              projectName={projectName}
              onCopy={handleCopyCode}
              onCopyAll={handleCopyAllCode}
              onDownload={handleDownloadCode}
              onDownloadAll={handleDownloadAll}
              copied={state.copied}
              copiedAll={state.copiedAll}
            />
          </div>
        ) : (
          <div className={`h-full flex items-center justify-center ${state.isDark ? "text-gray-500" : "text-gray-400"}`}>
            <p className="text-sm">请先在画布中生成代码</p>
          </div>
        )}
      </div>

      {/* Desktop layout: resizable panels */}
      <Group orientation="horizontal" className="hidden md:flex flex-1 overflow-hidden relative z-10">
        <Panel defaultSize={50} minSize={30}>
          <CanvasPanel
            projectId={projectId}
            isDark={state.isDark}
            uploadedImage={state.uploadedImage}
            isDragging={state.isDragging}
            isStreaming={state.status === "streaming"}
            hasCode={!!state.generatedCode}
            onEditorMount={setEditor}
            onGenerate={handleGenerate}
            onStop={state.stop}
            onRemoveImage={() => state.setUploadedImage(null)}
            onFileInput={handleFileInput}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            lastMessage={state.messages[state.messages.length - 1]}
          />
        </Panel>

        <Separator className={`w-1.5 hover:transition-colors flex items-center justify-center group ${state.isDark ? "bg-white/5 hover:bg-white/20" : "bg-gray-200 hover:bg-gray-400"}`}>
          <div className={`h-8 w-0.5 rounded-full transition-colors ${state.isDark ? "bg-white/20 group-hover:bg-white/40" : "bg-gray-300 group-hover:bg-gray-500"}`}></div>
        </Separator>

        <Panel defaultSize={50} minSize={30}>
          {state.generatedCode ? (
            <div className="h-full flex flex-col">
              <ResultPanel
                isDark={state.isDark}
                activeTab={state.activeTab}
                onTabChange={state.setActiveTab}
                generatedCode={state.generatedCode}
                generatedFiles={state.generatedFiles}
                activeFile={state.activeFile}
                onActiveFileChange={state.setActiveFile}
                framework={framework}
                projectName={projectName}
                onCopy={handleCopyCode}
                onCopyAll={handleCopyAllCode}
                onDownload={handleDownloadCode}
                onDownloadAll={handleDownloadAll}
                copied={state.copied}
                copiedAll={state.copiedAll}
              />
              <form
                onSubmit={handleSubmit}
                className={`p-4 backdrop-blur-xl border-t shrink-0 transition-colors duration-300 ${state.isDark ? "bg-black/50 border-white/10" : "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {["改成深色模式", "增加圆角和阴影", "改成响应式布局", "添加动画效果"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={state.status === "streaming"}
                      onClick={() => { state.setError(null); state.sendMessage({ text: suggestion }); state.setInput(""); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        state.isDark ? "border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20" : "border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      value={state.input}
                      onChange={(e) => state.setInput(e.target.value)}
                      placeholder="描述你想要的修改（如：把标题改成红色、添加阴影效果）"
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                        state.isDark ? "bg-white/5 border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600" : "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                      }`}
                    />
                    {state.input && (
                      <button type="button" onClick={() => state.setInput("")} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${state.isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={state.status === "streaming" || !state.input.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-3 rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none"
                  >
                    {state.status === "streaming" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
                <div className={`mt-2 text-[10px] text-center font-mono flex items-center justify-center gap-3 ${state.isDark ? "text-gray-600" : "text-gray-400"}`}>
                  <span>按 Enter 发送</span><span>•</span><span>点击上方标签快速修改</span><span>•</span><span>⌘/Ctrl + K 查看快捷键</span>
                </div>
              </form>
            </div>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ${state.isDark ? "text-gray-400" : "text-gray-600"}`}>
              {isGeneratingFromTemplate ? (
                <>
                  <div className="relative mb-8">
                    <div className={`w-24 h-24 border rounded-2xl flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${state.isDark ? "border-violet-500/30 bg-violet-500/10" : "border-violet-300 bg-violet-50"}`}>
                      <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-2xl -z-10 animate-pulse"></div>
                  </div>
                  <h3 className={`text-2xl font-semibold mb-2 ${state.isDark ? "text-white" : "text-gray-900"}`}>正在从模板生成...</h3>
                  <p className={`max-w-md text-sm leading-relaxed ${state.isDark ? "text-gray-500" : "text-gray-600"}`}>AI 正在根据模板生成页面代码，请稍候片刻</p>
                </>
              ) : (
                <>
                  <div className="relative mb-8">
                    <div className={`w-24 h-24 border rounded-2xl flex items-center justify-center backdrop-blur-sm transition-colors duration-300 ${state.isDark ? "border-white/10 bg-white/5" : "border-gray-300 bg-gray-100"}`}>
                      <Sparkles className={`w-12 h-12 ${state.isDark ? "text-gray-600" : "text-gray-400"}`} />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10"></div>
                  </div>
                  <h3 className={`text-2xl font-semibold mb-2 ${state.isDark ? "text-white" : "text-gray-900"}`}>将想法转化为代码</h3>
                  <p className={`max-w-md text-sm leading-relaxed ${state.isDark ? "text-gray-500" : "text-gray-600"}`}>在画布上绘制 UI 设计，或上传设计稿截图，观看 AI 代码生成技术让它变为现实。</p>
                  <div className={`mt-8 flex items-center gap-4 text-xs font-mono ${state.isDark ? "text-gray-600" : "text-gray-500"}`}>
                    {[
                      { n: "1", t: "绘制或上传" },
                      { n: "2", t: "生成代码" },
                      { n: "3", t: "自动保存" },
                    ].map((step, i) => (
                      <React.Fragment key={step.n}>
                        {i > 0 && <ArrowRight className="w-4 h-4" />}
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${state.isDark ? "bg-white/5 border-white/10" : "bg-gray-200 border-gray-300"}`}>
                            <span className={state.isDark ? "text-white" : "text-gray-700"}>{step.n}</span>
                          </div>
                          <span>{step.t}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </Panel>
      </Group>

      {state.showHistory && (
        <div className={`fixed right-0 top-16 bottom-0 w-80 backdrop-blur-xl border-l z-40 animate-in slide-in-from-right duration-300 transition-colors ${state.isDark ? "bg-black/95 border-white/10" : "bg-white border-gray-200 shadow-lg"}`}>
          <div className={`p-4 border-b flex items-center justify-between ${state.isDark ? "border-white/10" : "border-gray-200"}`}>
            <h3 className="font-semibold">代码历史</h3>
            <button onClick={() => state.setShowHistory(false)} className={`transition-colors ${state.isDark ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-auto p-4 space-y-2 h-[calc(100%-60px)]">
            {state.codeHistory.length === 0 ? (
              <p className={`text-sm text-center py-8 ${state.isDark ? "text-gray-600" : "text-gray-400"}`}>暂无历史记录</p>
            ) : (
              state.codeHistory.map((version, index) => (
                <button
                  key={version.timestamp}
                  onClick={() => { navigator.clipboard.writeText(version.code); state.setCopied(true); setTimeout(() => state.setCopied(false), 2000); }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${state.isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${state.isDark ? "text-gray-400" : "text-gray-600"}`}>版本 {state.codeHistory.length - index}</span>
                    <span className={`text-[10px] font-mono ${state.isDark ? "text-gray-600" : "text-gray-400"}`}>{new Date(version.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-mono truncate">{version.code.split("\n")[0]}...</div>
                  <div className={`text-[10px] mt-1 ${state.isDark ? "text-gray-600" : "text-gray-400"}`}>{version.code.split("\n").length} 行</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
