"use client";

import { useState, useCallback } from "react";
import { useCompletion } from "ai/react";
import AdvancedCanvas from "./components/AdvancedCanvas";
import CodePreview from "./components/CodePreview";
import CodeExporter from "./components/CodeExporter";
import HistoryPanel from "./components/HistoryPanel";
import { Sparkles, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function Home() {
  const [sketchImage, setSketchImage] = useState("");
  const [sketchData, setSketchData] = useState("");
  const [requirements, setRequirements] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate",
  });

  const handleExport = async (imageData: string) => {
    setSketchImage(imageData);
    await complete("", {
      body: { image: imageData, requirements },
    });
  };

  const handleCanvasSave = (data: string) => {
    setSketchData(data);
  };

  const handleLoadVersion = useCallback(
    (version: {
      sketchData: string;
      sketchImage: string;
      generatedCode: string;
    }) => {
      setSketchData(version.sketchData);
      setSketchImage(version.sketchImage);
      // 这里需要通知画布组件加载数据
      // 可以通过 ref 或 context 实现
    },
    [],
  );

  const extractCode = (text: string) => {
    const match = text.match(/```(?:tsx|jsx)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : text;
  };

  const code = completion ? extractCode(completion) : "";

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 头部 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-500" />
          <h1 className="text-xl font-bold">Sketch to React</h1>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
        >
          {showHistory ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
          历史记录
        </button>
      </header>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 历史面板 */}
        {showHistory && (
          <div className="w-80 p-4 overflow-hidden">
            <HistoryPanel
              currentSketchData={sketchData}
              currentSketchImage={sketchImage}
              currentCode={code}
              currentRequirements={requirements}
              onLoadVersion={handleLoadVersion}
            />
          </div>
        )}

        {/* 主工作区 */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
          {/* 左侧：画板 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div>
              <label className="block text-sm font-medium mb-2">额外需求</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="例如：深色主题、使用 shadcn/ui..."
                className="w-full p-3 border rounded-lg resize-none h-16"
              />
            </div>

            <div className="flex-1 min-h-0">
              <AdvancedCanvas
                onExport={handleExport}
                onSave={handleCanvasSave}
                initialData={sketchData}
              />
            </div>
          </div>

          {/* 右侧：预览和导出 */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">生成结果</label>
              {isLoading && (
                <span className="flex items-center gap-2 text-sm text-blue-500">
                  <Loader2 className="animate-spin" size={16} />
                  生成中...
                </span>
              )}
            </div>

            {/* 代码预览 */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {code ? (
                <CodePreview code={code} />
              ) : (
                <div className="h-full border rounded-lg flex items-center justify-center bg-white">
                  <div className="text-center text-gray-400">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                    <p>在左侧画出 UI 设计</p>
                    <p className="text-sm">{`点击"生成代码"开始`}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 导出面板 */}
            {code && <CodeExporter code={code} sketchImage={sketchImage} />}
          </div>
        </div>
      </div>
    </div>
  );
}
