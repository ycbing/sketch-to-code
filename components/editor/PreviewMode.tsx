"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  useSandpack 
} from "@codesandbox/sandpack-react";
import { Loader2, AlertCircle } from "lucide-react";

interface PreviewModeProps {
  files: Record<string, string>;
  isDark: boolean;
}

// Status overlay: shows loading/error states based on Sandpack compilation
function StatusOverlay() {
  const { sandpack } = useSandpack();
  const { status } = sandpack;
  
  const isLoading = status === 'initial' || status === 'running';
  const isError = status === 'timeout';

  if (isError) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 text-red-500">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p>运行超时，请刷新重试</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm transition-all duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            正在编译...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export function PreviewMode({ files, isDark }: PreviewModeProps) {
  return (
    <div className="h-full w-full relative group">
      <SandpackProvider
        template="react"
        theme={isDark ? "dark" : "light"}
        files={files}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          initMode: "user-visible", 
          recompileMode: "delayed",
          recompileDelay: 300,
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "^0.292.0",
            "@stitches/react": "^1.2.8",
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
          },
        }}
      >
        <SandpackLayout style={{ 
          height: "100%", 
          border: "none", 
          borderRadius: 0,
          display: "block"
        }}>
          <div className="relative h-full w-full">
            <StatusOverlay />
            <SandpackPreview 
              style={{ height: "100%" }} 
              showOpenInCodeSandbox={false} 
              showRefreshButton={true}
            />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
