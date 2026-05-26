"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import type { Editor as TldrawEditor } from "tldraw";
import { Loader2, Sparkles, Undo2, Check, ImagePlus, X, Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Tldraw = dynamic(() => import("tldraw").then((mod) => mod.Tldraw), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black/30">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  ),
});

interface CanvasPanelProps {
  projectId: string;
  isDark: boolean;
  uploadedImage: string | null;
  isDragging: boolean;
  isStreaming: boolean;
  hasCode: boolean;
  onEditorMount: (editor: TldrawEditor) => void;
  onGenerate: () => void;
  onStop: () => void;
  onRemoveImage: () => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  lastMessage: any;
}

export function CanvasPanel({
  projectId, isDark, uploadedImage, isDragging, isStreaming, hasCode,
  onEditorMount, onGenerate, onStop, onRemoveImage, onFileInput,
  onDragOver, onDragEnter, onDragLeave, onDrop, lastMessage,
}: CanvasPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 backdrop-blur-sm transition-colors duration-300">
      <div className="w-full h-full relative">
        <Tldraw onMount={onEditorMount} persistenceKey={`sketch-project-${projectId}`} hideUi={false} />

        <div onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDrop={onDrop} className="absolute inset-0 z-[1500] pointer-events-none">
          {isDragging && (
            <div className="absolute inset-0 pointer-events-auto flex items-center justify-center">
              <div className="absolute inset-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors border-blue-500 bg-white/80 dark:bg-black/60 dark:border-blue-400">
                <Upload className="w-10 h-10 text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">释放以上传设计稿</span>
              </div>
            </div>
          )}

          {uploadedImage && (
            <div className="absolute top-3 left-3 pointer-events-auto z-[1600]">
              <div className="group relative rounded-lg overflow-hidden border shadow-lg transition-all border-gray-200 dark:border-white/20 bg-white dark:bg-black/80 shadow-gray-200 dark:shadow-none">
                <img src={uploadedImage} alt="上传的设计稿" className="w-20 h-20 object-cover" />
                <button onClick={onRemoveImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors shadow-md bg-white dark:bg-gray-800 hover:bg-red-500 text-gray-700 dark:text-white hover:text-white border border-gray-200 dark:border-none" title="移除图片">
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 bg-white/80 dark:bg-black/70 text-gray-600 dark:text-gray-300">设计稿</div>
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileInput} className="hidden" />

        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-lg">
          <div className="backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl bg-white/95 dark:bg-black/80 shadow-gray-300/50 dark:shadow-black/50 transition-colors duration-300">
            {uploadedImage && (
              <div className="mb-3 flex items-center gap-3 p-2 rounded-lg border border-dashed border-gray-300 dark:border-white/20">
                <img src={uploadedImage} alt="设计稿预览" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">已上传设计稿</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">点击生成将使用此图片</p>
                </div>
                <button onClick={onRemoveImage} className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white" title="移除">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-12 h-12 flex items-center justify-center border rounded-xl transition-all flex-shrink-0",
                  uploadedImage
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/30",
                )}
                title="上传设计稿截图"
              >
                {uploadedImage ? <Check className="w-5 h-5 text-green-400" /> : <ImagePlus className="w-5 h-5" />}
              </button>
              <button
                onClick={onGenerate}
                disabled={isStreaming}
                className="flex-1 group relative h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden disabled:opacity-50 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isStreaming ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 生成中...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> {hasCode ? "重新生成" : "生成代码"}</>
                )}
              </button>
              {isStreaming && (
                <button onClick={onStop} className="w-12 h-12 flex items-center justify-center border rounded-xl transition-all border-red-400 dark:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400" title="取消生成">
                  <XCircle className="w-5 h-5" />
                </button>
              )}
              <button className="w-12 h-12 flex items-center justify-center border rounded-xl transition-all border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/30" title="撤销绘图">
                <Undo2 className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 text-gray-400 dark:text-gray-500">
              {isStreaming ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>AI 正在生成代码...</span>
                    <span className="text-blue-500 dark:text-blue-400">
                      {lastMessage && lastMessage.role === "assistant"
                        ? `${((lastMessage.parts?.filter((p: any) => p.type === "text").reduce((acc: number, p: any) => acc + (p.text?.length || 0), 0) / 4000) * 100).toFixed(0)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="w-full max-w-xs mx-auto h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: lastMessage && lastMessage.role === "assistant"
                          ? `${Math.min(95, (lastMessage.parts?.filter((p: any) => p.type === "text").reduce((acc: number, p: any) => acc + (p.text?.length || 0), 0) / 4000) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-center font-mono">绘制或上传 → 生成 → 自动保存</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
