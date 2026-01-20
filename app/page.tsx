// app/page.tsx - 完整版本
"use client";

import { useState, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import AdvancedCanvas from "./components/AdvancedCanvas";
import CodePreview from "./components/CodePreview";
import CodeExporter from "./components/CodeExporter";
import { Sparkles, Wand2 } from "lucide-react";

export default function Home() {
  const [sketchImage, setSketchImage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showExporter, setShowExporter] = useState(false);

  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/generate",
    onFinish: (prompt, completion) => {
      // 提取代码
      const codeMatch = completion.match(/```(?:tsx|jsx)?\n([\s\S]*?)```/);
      const code = codeMatch?.[1].trim() || completion;
      setGeneratedCode(code);
    },
  });

  const handleGenerate = async (imageData: string) => {
    setSketchImage(imageData);
    setGeneratedCode("");
    setShowExporter(false);

    await complete("", {
      body: {
        image: imageData,
      },
    });
  };

  // 当有代码生成后显示导出选项
  useEffect(() => {
    if (generatedCode) {
      setShowExporter(true);
    }
  }, [generatedCode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wand2 className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Sketch to React
                </h1>
                <p className="text-xs text-gray-500">AI 驱动的草图转代码工具</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/yourusername/sketch-to-react"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                GitHub
              </a>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
                <Sparkles size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-900">
                  AI Powered
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：画板 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">绘制草图</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  步骤 1
                </span>
              </div>
              <AdvancedCanvas onExport={handleGenerate} disabled={isLoading} />
            </div>

            {/* 使用说明 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📝</span>
                使用指南
              </h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <span>使用画笔工具绘制您想要的 UI 界面草图</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <span>添加文字标注说明组件功能</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <span>点击"生成代码"按钮，AI 将为您生成 React 组件</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <span>预览效果，导出代码到项目中使用</span>
                </li>
              </ol>
            </div>
          </div>

          {/* 右侧：代码预览和导出 */}
          <div className="space-y-4">
            {/* 代码预览 */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">代码预览</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  步骤 2
                </span>
              </div>

              {/* 加载状态 */}
              {isLoading && (
                <div className="p-12 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">
                    AI 正在生成代码...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">这可能需要几秒钟</p>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="p-8 text-center">
                  <div className="text-red-500 text-4xl mb-3">⚠️</div>
                  <p className="text-red-700 font-medium">生成失败</p>
                  <p className="text-sm text-red-600 mt-1">{error.message}</p>
                  <button
                    onClick={() => handleGenerate(sketchImage)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 空状态 */}
              {!isLoading && !error && !generatedCode && (
                <div className="p-12 text-center">
                  <div className="text-gray-300 text-6xl mb-4">✨</div>
                  <p className="text-gray-600 font-medium">等待生成代码</p>
                  <p className="text-sm text-gray-500 mt-1">
                    在左侧画板绘制草图后点击生成
                  </p>
                </div>
              )}

              {/* 代码预览 */}
              {!isLoading && !error && generatedCode && (
                <div className="h-[600px]">
                  <CodePreview code={generatedCode} />
                </div>
              )}
            </div>

            {/* 导出选项 */}
            {showExporter && generatedCode && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">导出代码</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    步骤 3
                  </span>
                </div>
                <div className="p-4">
                  <CodeExporter code={generatedCode} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部示例展示 */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🎨</span>
            示例草图
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "登录表单", emoji: "🔐" },
              { name: "卡片列表", emoji: "📇" },
              { name: "仪表盘", emoji: "📊" },
              { name: "导航栏", emoji: "🧭" },
            ].map((example) => (
              <button
                key={example.name}
                className="p-4 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-all group"
                onClick={() => {
                  // 这里可以加载预设的示例草图
                  alert(`加载 ${example.name} 示例`);
                }}
              >
                <div className="text-4xl mb-2">{example.emoji}</div>
                <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  {example.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="mt-12 py-8 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Powered by{" "}
              <a
                href="https://openai.com"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI GPT-4 Vision
              </a>{" "}
              •{" "}
              <a
                href="https://nextjs.org"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Next.js
              </a>{" "}
              •{" "}
              <a
                href="https://tailwindcss.com"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Tailwind CSS
              </a>
            </p>
            <p className="mt-2">© 2024 Sketch to React. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
