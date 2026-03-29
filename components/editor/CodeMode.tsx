"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor 
} from "@codesandbox/sandpack-react";

interface CodeModeProps {
  files: Record<string, string>;
  activeFile: string;
  isDark: boolean;
  readOnly?: boolean;
}

export function CodeMode({ files, activeFile, isDark, readOnly = false }: CodeModeProps) {
  return (
    <div className="h-full w-full">
      <SandpackProvider
        template="react"
        theme={isDark ? "dark" : "light"}
        files={files}
        options={{
          activeFile,
        }}
      >
        <SandpackLayout style={{ 
          height: "100%", 
          border: "none", 
          borderRadius: 0 
        }}>
          <SandpackCodeEditor 
            style={{ height: "100%" }}
            showTabs={false}
            showLineNumbers={true}
            showInlineErrors={true}
            wrapContent={true}
            readOnly={readOnly}
            showRunButton={false}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
