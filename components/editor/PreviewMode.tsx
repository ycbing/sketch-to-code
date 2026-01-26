"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

interface PreviewModeProps {
  code: string;
  isDark: boolean;
}

export function PreviewMode({ code, isDark }: PreviewModeProps) {
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
            "sp-preview": "h-full flex",
            "sp-editor": "hidden",
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
