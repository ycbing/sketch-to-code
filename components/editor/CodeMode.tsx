"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor 
} from "@codesandbox/sandpack-react";

interface CodeModeProps {
  code: string;
  isDark: boolean;
  readOnly?: boolean; // 可选：是否只读
}

export function CodeMode({ code, isDark, readOnly = false }: CodeModeProps) {
  return (
    <div className="h-full w-full">
      <SandpackProvider
        template="react"
        theme={isDark ? "dark" : "light"}
        files={{
          "/App.js": code,
        }}
        // 这里不需要 customSetup 中的 dependencies，
        // 因为不运行代码，就不需要下载依赖包，速度会极快。
        options={{
          // 如果只是看代码，不需要 bundlerURL 等配置
        }}
      >
        <SandpackLayout style={{ 
          height: "100%", 
          border: "none", 
          borderRadius: 0 
        }}>
          <SandpackCodeEditor 
            style={{ height: "100%" }}
            showTabs={false}          // 隐藏顶部标签页
            showLineNumbers={true}    // 显示行号
            showInlineErrors={true}   // 显示语法检查错误
            wrapContent={true}        // 自动换行
            readOnly={readOnly}       // 如果只是展示，建议开启只读
            showRunButton={false}     // 隐藏运行按钮
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}