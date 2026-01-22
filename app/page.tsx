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
  Loader2,
  Code2,
  Eye,
  Send,
  Undo2,
  Sparkles,
  ArrowRight,
  X,
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log("input", input);
    e.preventDefault();
    sendMessage({ text: input });
    setInput("");
  };

  // --- Helpers ---

  // 1. 获取最后生成的代码
  console.log("messages", messages);
  const lastMessage = messages[messages.length - 1];
  const generatedCode =
    lastMessage?.role === "assistant"
      ? lastMessage.parts[lastMessage.parts.length - 1].text
          .replace(/```jsx|```/g, "")
          .trim() // 简单的清洗
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
    console.log(image, "image");
    if (!image) {
      alert("Please draw something first!");
      return;
    }

    // 发送图片 + 初始 Prompt
    await sendMessage({
      role: "user",
      parts: [
        {
          type: "text",
          text: "Create a React component based on this wireframe. Use Tailwind CSS.",
        },
        {
          type: "file",
          mediaType: "image/png",
          url: image,
        },
      ],
    });

    // 自动切到预览 Tab
    setActiveTab("preview");
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* Background gradient effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-white/10 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-blue-500/10 opacity-20 blur-[100px]"></div>
      </div>

      {/* --- Header --- */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 justify-between z-10 shrink-0 backdrop-blur-xl bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            Sketch to Code
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Powered by Vercel AI SDK
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* --- Main Workspace (Resizable) --- */}
      <Group
        orientation="horizontal"
        className="flex-1 overflow-hidden relative z-10"
      >
        {/* --- LEFT: Canvas (Tldraw) --- */}
        <Panel
          defaultSize={50}
          minSize={30}
          className="relative flex flex-col border-r border-white/10 bg-black/30 backdrop-blur-sm"
        >
          <div className="w-full h-full relative">
            <Tldraw
              onMount={(editor) => setEditor(editor)}
              persistenceKey="sketch-demo-v1"
              hideUi={false}
            />

            {/* Vercel-style floating control */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-lg">
              <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={status === "streaming"}
                    className="flex-1 group relative bg-white text-black hover:bg-gray-100 disabled:opacity-50 h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {status === "streaming" ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {generatedCode ? "Regenerate" : "Generate Code"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => editor?.undo()}
                    className="w-12 h-12 flex items-center justify-center border border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all"
                    title="Undo Drawing"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 text-[11px] text-gray-500 text-center font-mono">
                  Draw → Generate → Deploy
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* --- Resizer Handle --- */}
        <Separator className="w-1.5 bg-white/5 hover:bg-white/20 transition-colors flex items-center justify-center group">
          <div className="h-8 w-0.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>
        </Separator>

        {/* --- RIGHT: Result (Sandpack) --- */}
        <Panel
          defaultSize={50}
          minSize={30}
          className="flex flex-col bg-black/30 backdrop-blur-sm"
        >
          {/* Tabs */}
          <div className="h-12 border-b border-white/10 flex bg-black/50 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                activeTab === "preview"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {activeTab === "preview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-all relative ${
                activeTab === "code"
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {activeTab === "code" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
              )}
              <Code2 className="w-4 h-4" /> Code
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {generatedCode ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  <Sandpack
                    key={activeTab}
                    template="react"
                    theme="dark"
                    files={{
                      "/App.js": generatedCode,
                    }}
                    options={{
                      externalResources: ["https://cdn.tailwindcss.com"],
                      showNavigator: false,
                      showTabs: false,
                      editorHeight: "100%",
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

                {/* Refinement Chat Input */}
                <form
                  onSubmit={handleSubmit}
                  className="p-4 bg-black/50 backdrop-blur-xl border-t border-white/10 shrink-0"
                >
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Refine the design... (e.g., 'Make it dark mode', 'Add animations')"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                      />
                      {input && (
                        <button
                          type="button"
                          onClick={() => setInput("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
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
                  <div className="mt-2 text-[10px] text-gray-600 text-center font-mono">
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </form>
              </div>
            ) : (
              // Empty State with Vercel style
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border border-white/10 rounded-2xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    <Sparkles className="w-12 h-12 text-gray-600" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10"></div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Transform Ideas into Code
                </h3>
                <p className="max-w-md text-sm text-gray-500 leading-relaxed">
                  Draw your UI design on the canvas and watch it come to life
                  with AI-powered code generation.
                </p>
                <div className="mt-8 flex items-center gap-4 text-xs font-mono text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white">1</span>
                    </div>
                    <span>Draw Design</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white">2</span>
                    </div>
                    <span>Generate Code</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white">3</span>
                    </div>
                    <span>Deploy</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
