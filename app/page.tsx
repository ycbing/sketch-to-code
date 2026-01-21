"use client";

import { useState, useCallback, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import { useChat, useCompletion } from "@ai-sdk/react";
import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { Sandpack } from "@codesandbox/sandpack-react";
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";
import {
  Play,
  Loader2,
  Code2,
  Eye,
  Send,
  Undo2,
  MonitorPlay,
} from "lucide-react";

export default function SketchToCode() {
  const [input, setInput] = useState("");
  // --- State ---
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  // --- Vercel AI SDK ---
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
    }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput("");
  };

  // --- Helpers ---

  // 1. 获取最后生成的代码
  const lastMessage = messages[messages.length - 1];
  const generatedCode =
    lastMessage?.role === "assistant"
      ? lastMessage.content.replace(/```jsx|```/g, "").trim() // 简单的清洗
      : "";

  // 2. 将 Tldraw 画布导出为 Base64
  const getCanvasImage = async () => {
    if (!editor) return null;
    const shapeIds = editor.getCurrentPageShapeIds();
    if (shapeIds.size === 0) return null;

    const imageRes = await editor.toImage([...shapeIds], {
      quality: 1,
      format: "png",
    });

    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageRes.blob);
    });
  };

  // 3. 处理 "Make Real" (初次生成)
  const handleGenerate = async () => {
    const image = await getCanvasImage();
    if (!image) {
      alert("Please draw something first!");
      return;
    }

    // 发送图片 + 初始 Prompt
    await sendMessage(
      {
        role: "user",
        parts: [
          {
            type: "text",
            text: "Create a React component based on this wireframe. Use Tailwind CSS.",
          },
        ],
      },
      { body: { imageUrl: image } },
    );

    // 自动切到预览 Tab
    setActiveTab("preview");
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* --- Header --- */}
      <header className="h-14 border-b bg-white flex items-center px-4 justify-between z-10 shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg text-gray-800">
          <MonitorPlay className="w-6 h-6 text-blue-600" />
          <span>Sketch2Code</span>
        </div>
        <div className="text-xs text-gray-500">
          Powered by Vercel AI SDK & Tldraw
        </div>
      </header>

      {/* --- Main Workspace (Resizable) --- */}
      <Group orientation="horizontal" className="flex-1 overflow-hidden">
        {/* --- LEFT: Canvas (Tldraw) --- */}
        <Panel
          defaultSize={50}
          minSize={30}
          className="relative flex flex-col border-r bg-white"
        >
          <div className="w-full h-full relative">
            <Tldraw
              onMount={(editor) => setEditor(editor)}
              persistenceKey="sketch-demo-v1"
              hideUi={false} // 保持 Tldraw 原生工具栏
            />

            {/* 悬浮控制卡片 */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-md">
              <div className="bg-white/90 backdrop-blur shadow-2xl border rounded-xl p-3 flex flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={status === "streaming"}
                    className="flex-1 bg-black text-white hover:bg-gray-800 disabled:opacity-50 h-10 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {status === "streaming" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    {generatedCode ? "Regenerate from Canvas" : "Make Real"}
                  </button>
                  <button
                    onClick={() => editor?.undo()}
                    className="w-10 h-10 flex items-center justify-center border rounded-lg hover:bg-gray-100"
                    title="Undo Drawing"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] text-gray-400 text-center">
                  Draw your UI above, then click button to generate code.
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* --- Resizer Handle --- */}
        <Separator className="w-1.5 bg-gray-100 hover:bg-blue-500 transition-colors flex items-center justify-center group">
          <div className="h-8 w-1 bg-gray-300 rounded-full group-hover:bg-white" />
        </Separator>

        {/* --- RIGHT: Result (Sandpack) --- */}
        <Panel defaultSize={50} minSize={30} className="flex flex-col bg-white">
          {/* Tabs */}
          <div className="h-10 border-b flex bg-gray-50/50">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === "code"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Code2 className="w-4 h-4" /> Code
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden bg-gray-50">
            {generatedCode ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  <Sandpack
                    key={activeTab} // 强制刷新布局
                    template="react"
                    theme="light"
                    files={{
                      "/App.js": generatedCode,
                    }}
                    options={{
                      externalResources: ["https://cdn.tailwindcss.com"],
                      showNavigator: false, // 我们自己做了 Header
                      showTabs: false, // 我们自己做了 Tabs
                      editorHeight: "100%", // 铺满
                      showLineNumbers: true,
                      classes: {
                        "sp-wrapper": "h-full",
                        "sp-layout": "h-full",
                        "sp-preview":
                          activeTab === "preview" ? "h-full flex" : "hidden",
                        "sp-editor":
                          activeTab === "code" ? "h-full flex" : "hidden",
                      },
                    }}
                    customSetup={{
                      dependencies: {
                        "lucide-react": "latest",
                      },
                    }}
                  />
                </div>

                {/* Refinement Chat Input (Bottom of Right Panel) */}
                <form
                  onSubmit={handleSubmit}
                  className="p-3 bg-white border-t flex gap-2 shrink-0"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Refine logic (e.g., 'Make buttons blue', 'Add a footer')..."
                    className="flex-1 bg-gray-100 border-0 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={status === "streaming" || !input.trim()}
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-white border-2 border-dashed rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <MonitorPlay className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Ready to Visualize
                </h3>
                <p className="max-w-xs mt-2 text-sm">
                  1. Draw your layout on the left canvas.
                  <br />
                  2. Click <b>{"Make Real"}</b> to generate code.
                </p>
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
