"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { parseGeneratedFiles } from "@/lib/parse-files";
import type { Framework } from "@/lib/frameworks";
import { useTheme } from "@/components/theme-provider";

type TabType = "preview" | "code";

interface CodeVersion {
  code: string;
  timestamp: number;
  description?: string;
}

export function useEditorState(framework: Framework) {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const {
    messages,
    sendMessage,
    status,
    error: chatError,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/generate",
      headers: () => {
        const hdrs: Record<string, string> = {};
        hdrs["x-framework"] = framework;
        return hdrs;
      },
    }),
  });

  const lastMessage = useMemo(() => {
    return messages[messages.length - 1];
  }, [messages]);

  const generatedCode = useMemo(() => {
    if (lastMessage?.role !== "assistant" || !lastMessage?.parts) return "";
    try {
      const lastPart = lastMessage.parts[lastMessage.parts.length - 1];
      if (lastPart?.type === "text") {
        const text = lastPart.text;
        const { files: parsed } = parseGeneratedFiles(text);
        return (
          parsed["/App.js"] ||
          parsed["/App.tsx"] ||
          Object.values(parsed)[0] ||
          text.trim()
        );
      }
    } catch (err) {
      console.error("Failed to parse generated code:", err);
      return "";
    }
    return "";
  }, [lastMessage]);

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

  const [activeFile, setActiveFile] = useState<string>("/App.js");
  const [codeHistory, setCodeHistory] = useState<CodeVersion[]>([]);

  const fileNameList = useMemo(
    () => Object.keys(generatedFiles),
    [generatedFiles],
  );

  const updateActiveFile = useCallback(
    (files: Record<string, string>, current: string) => {
      const names = Object.keys(files);
      if (names.length > 0 && !names.includes(current)) {
        return names[0];
      }
      return current;
    },
    [],
  );

  const effectiveActiveFile = updateActiveFile(generatedFiles, activeFile);
  if (effectiveActiveFile !== activeFile) {
    setActiveFile(effectiveActiveFile);
  }

  if (
    generatedCode &&
    generatedCode !== codeHistory[codeHistory.length - 1]?.code
  ) {
    setCodeHistory((prev) => [
      ...prev.slice(-9),
      { code: generatedCode, timestamp: Date.now() },
    ]);
  }

  return {
    input,
    setInput,
    activeTab,
    setActiveTab,
    copied,
    setCopied,
    showHistory,
    setShowHistory,
    codeHistory,
    setCodeHistory,
    error,
    setError,
    showKeyboardShortcuts,
    setShowKeyboardShortcuts,
    isDark,
    toggleTheme,
    uploadedImage,
    setUploadedImage,
    isDragging,
    setIsDragging,
    copiedAll,
    setCopiedAll,
    activeFile,
    setActiveFile,
    fileNameList,
    generatedCode,
    generatedFiles,
    messages,
    sendMessage,
    status,
    chatError,
    stop,
  };
}
