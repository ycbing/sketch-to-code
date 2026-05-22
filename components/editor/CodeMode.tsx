"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor 
} from "@codesandbox/sandpack-react";
import type { Framework } from "@/lib/frameworks";
import { getFrameworkConfig } from "@/lib/frameworks";

interface CodeModeProps {
  files: Record<string, string>;
  activeFile: string;
  isDark: boolean;
  framework?: Framework;
  readOnly?: boolean;
}

export function CodeMode({ files, activeFile, isDark, framework = "react", readOnly = false }: CodeModeProps) {
  const fwConfig = getFrameworkConfig(framework);
  const template = fwConfig?.sandpackTemplate || "react";

  return (
    <div className="h-full w-full">
      <SandpackProvider
        template={template}
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
