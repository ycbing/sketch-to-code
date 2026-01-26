"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

interface CodeModeProps {
  code: string;
  isDark: boolean;
}

export function CodeMode({ code, isDark }: CodeModeProps) {
  return (
    <div className="h-full flex">
      <Sandpack
        template="react"
        theme={isDark ? "dark" : "light"}
        files={{
          "/App.js": code,
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
            "sp-preview": "hidden",
            "sp-editor": "h-full flex",
          },
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
          },
        }}
      />
    </div>
  );
}
