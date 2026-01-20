// app/components/CodePreview.tsx
"use client";

import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";
import { themes } from "prism-react-renderer";
import React, { useState, useEffect } from "react";

interface CodePreviewProps {
  code: string;
}

export default function CodePreview({ code }: CodePreviewProps) {
  // 预处理代码：移除 export default
  const processCode = (rawCode: string) => {
    let processed = rawCode.trim();

    // 移除 export default
    processed = processed.replace(/export\s+default\s+/g, "");

    // 如果是函数组件，添加 render 调用
    if (processed.includes("function") || processed.includes("const")) {
      const match = processed.match(/(?:function|const)\s+(\w+)/);
      if (match) {
        processed = `${processed}\n\nrender(<${match[1]} />);`;
      }
    }

    return processed;
  };

  const scope = {
    // 这里添加代码中可能用到的依赖
    React,
    useState,
    useEffect,
    // 可以添加更多
  };

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-white">
      <LiveProvider
        code={processCode(code)}
        scope={scope}
        theme={themes.vsDark}
        noInline={true}
      >
        {/* 顶部标签 */}
        <div className="flex border-b bg-gray-800 text-white">
          <div className="px-4 py-2 border-r border-gray-700 bg-gray-900 text-sm">
            代码
          </div>
          <div className="px-4 py-2 border-r border-gray-700 text-sm">预览</div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：代码编辑器 */}
          <div className="w-1/2 border-r overflow-auto">
            <LiveEditor
              style={{
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 14,
                minHeight: "100%",
              }}
            />
          </div>

          {/* 右侧：实时预览 */}
          <div className="w-1/2 overflow-auto bg-white">
            <div className="p-4">
              <LivePreview />
            </div>

            {/* 错误显示 */}
            <LiveError
              style={{
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 12,
                padding: "1rem",
                margin: "1rem",
                backgroundColor: "#fee",
                color: "#c00",
                borderRadius: "0.5rem",
              }}
            />
          </div>
        </div>
      </LiveProvider>
    </div>
  );
}
