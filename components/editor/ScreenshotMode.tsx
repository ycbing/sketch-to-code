"use client";

import React from "react";
import {
  Loader2, ImagePlus, RotateCcw, Search, Smartphone, Palette, Zap, Monitor,
} from "lucide-react";

interface ImageInfo {
  width: number;
  height: number;
  size: string;
  format: string;
}

interface ScreenshotModeProps {
  uploadedImage: string | null;
  imageInfo: ImageInfo | null;
  isDark: boolean;
  isDragging: boolean;
  isStreaming: boolean;
  hasCode: boolean;
  onFileClick: () => void;
  onGenerate: (prompt?: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const QUICK_SCENES = [
  { icon: Search, label: "精准还原", prompt: "基于这张设计稿截图，尽可能精准地还原为一个 React 组件。注意匹配布局、颜色、字体大小、间距、边距等所有视觉细节。" },
  { icon: Smartphone, label: "移动端适配", prompt: "基于这张设计稿截图创建一个移动端优先的响应式 React 组件。确保在手机端和桌面端都有良好显示。" },
  { icon: Palette, label: "提取配色", prompt: "基于这张设计稿截图创建组件。优先精确提取配色方案，每个颜色使用 Tailwind 色值。布局可适当简化。" },
  { icon: Zap, label: "快速原型", prompt: "基于这张设计稿截图创建一个简化版的 React 组件原型。优先实现布局结构和核心内容，样式可适当简化。" },
];

export function ScreenshotMode({
  uploadedImage, imageInfo, isDark, isDragging, isStreaming, hasCode,
  onFileClick, onGenerate,
  onDragOver, onDragEnter, onDragLeave, onDrop,
}: ScreenshotModeProps) {
  return (
    <div
      className="flex-1 relative overflow-hidden"
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {uploadedImage ? (
        <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
          {/* Image info */}
          {imageInfo && (
            <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full text-xs ${isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
              <Monitor className="w-3 h-3" />
              <span>{imageInfo.width} × {imageInfo.height}</span>
              <span>•</span>
              <span>{imageInfo.size}</span>
              <span>•</span>
              <span>{imageInfo.format}</span>
            </div>
          )}

          {/* Preview */}
          <div className={`relative rounded-xl overflow-hidden shadow-2xl ${isDark ? "ring-1 ring-white/10" : "ring-1 ring-gray-200"}`}>
            <img
              src={uploadedImage}
              alt="设计稿预览"
              className="max-h-[60vh] max-w-full object-contain"
              style={{ boxShadow: isDark ? "0 0 60px rgba(59,130,246,0.15)" : "0 8px 40px rgba(0,0,0,0.1)" }}
            />
          </div>

          {/* Quick scenes */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_SCENES.map((scene) => (
              <button
                key={scene.label}
                disabled={isStreaming}
                onClick={() => onGenerate(scene.prompt)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${
                  isDark
                    ? "border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                <scene.icon className="w-3.5 h-3.5" />
                {scene.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onFileClick}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border transition-all ${isDark ? "border-white/20 text-gray-300 hover:bg-white/10" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
            >
              <RotateCcw className="w-4 h-4" />
              重新上传
            </button>
            <button
              onClick={() => onGenerate()}
              disabled={isStreaming}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${isDark ? "bg-white text-black hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-gray-800"}`}
            >
              {isStreaming ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</> : <>✨ {hasCode ? "重新生成" : "生成代码"}</>}
            </button>
          </div>
          <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>支持 Ctrl+V 粘贴截图 • 拖拽上传</p>
        </div>
      ) : (
        /* Empty drop zone */
        <div className="h-full flex items-center justify-center p-8">
          <div
            className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${isDragging ? (isDark ? "border-blue-400 bg-blue-500/10" : "border-blue-500 bg-blue-50") : (isDark ? "border-white/15 hover:border-white/30" : "border-gray-300 hover:border-gray-400")}`}
            onClick={onFileClick}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
              <ImagePlus className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>上传设计稿截图</p>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>拖拽图片到此处，或点击选择文件</p>
              <p className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-gray-300"}`}>支持 PNG / JPG / WebP，也可 Ctrl+V 粘贴</p>
            </div>
            {isDragging && <p className="text-blue-400 text-sm font-medium">释放以上传</p>}
          </div>
        </div>
      )}
    </div>
  );
}
