"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  useSandpack,
  type SandpackPredefinedTemplate
} from "@codesandbox/sandpack-react";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Monitor, Tablet, Smartphone } from "lucide-react";
import type { Framework } from "@/lib/frameworks";
import { getFrameworkConfig } from "@/lib/frameworks";

interface PreviewModeProps {
  files: Record<string, string>;
  isDark: boolean;
  framework?: Framework;
}

// Simple WXML to HTML converter for miniprogram preview
function convertWxmlToHtml(wxml: string): string {
  return wxml
    .replace(/wx:for="(\{\{[^}]+\}\})"\s*wx:key="([^"]+)"/g, 'v-for="(item, index) in $1" :key="item.$2"')
    .replace(/wx:if="(\{\{[^}]+\}\})"/g, 'v-if="$1"')
    .replace(/bindtap="([^"]+)"/g, '@click="$1"')
    .replace(/\{\{([^}]+)\}\}/g, '{{ $1 }}')
    .replace(/class="([^"]*?)"/g, 'class="$1"');
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

type ViewMode = "desktop" | "tablet" | "mobile";

const VIEW_MODES: { id: ViewMode; icon: typeof Monitor; label: string; width: string }[] = [
  { id: "desktop", icon: Monitor, label: "桌面端", width: "100%" },
  { id: "tablet", icon: Tablet, label: "平板端", width: "768px" },
  { id: "mobile", icon: Smartphone, label: "移动端", width: "375px" },
];

export function PreviewMode({ files, isDark, framework = "react" }: PreviewModeProps) {
  const fwConfig = getFrameworkConfig(framework);
  const template = (fwConfig?.sandpackTemplate || "react") as SandpackPredefinedTemplate;
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "desktop";
    return (localStorage.getItem("sketch-view-mode") as ViewMode) || "desktop";
  });

  useEffect(() => {
    localStorage.setItem("sketch-view-mode", viewMode);
  }, [viewMode]);

  // For miniprogram: convert WXML files to HTML for preview
  let previewFiles = { ...files };
  if (framework === "miniprogram") {
    const convertedFiles: Record<string, string> = {};
    for (const [path, content] of Object.entries(files)) {
      if (path.endsWith(".wxml")) {
        // Convert to HTML and create as index.html
        convertedFiles["/index.html"] = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }</style>
</head>
<body>
${convertWxmlToHtml(content)}
</body>
</html>`;
      } else if (path.endsWith(".wxss")) {
        convertedFiles["/styles.css"] = content;
      }
    }
    // If no index.html was generated, fall back to original files
    if (Object.keys(convertedFiles).length > 0) {
      previewFiles = convertedFiles;
    }
  }

  // For HTML framework: ensure proper template setup
  if (framework === "html") {
    // HTML files should already be complete, use vanilla template
  }

  const dependencies: Record<string, string> = {
    ...(framework === "react" ? { "lucide-react": "^0.292.0", "@stitches/react": "^1.2.8", "react": "^18.2.0", "react-dom": "^18.2.0" } : {}),
    ...(framework === "vue" ? { "lucide-vue-next": "^0.344.0", "vue": "^3.3.0" } : {}),
    ...(fwConfig?.extraDependencies || {}),
  };

  // For miniprogram and html, use vanilla template with no deps
  const isVanilla = framework === "miniprogram" || framework === "html";

  const currentWidth = VIEW_MODES.find((m) => m.id === viewMode)?.width || "100%";

  return (
    <div className="h-full w-full flex flex-col relative group">
      {/* Responsive toggle bar */}
      <div className={`flex items-center justify-center gap-1 p-2 border-b shrink-0 transition-colors ${isDark ? "bg-black/40 border-white/10" : "bg-gray-50 border-gray-200"}`}>
        {VIEW_MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === id
                ? isDark
                  ? "bg-white/15 text-white shadow-sm"
                  : "bg-gray-900 text-white shadow-sm"
                : isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
      {/* Preview wrapper with responsive width */}
      <div className="flex-1 overflow-auto flex justify-center transition-all duration-300">
        <div
          className="h-full transition-all duration-300 ease-in-out"
          style={{
            width: currentWidth,
            maxWidth: "100%",
            minWidth: viewMode === "mobile" ? "375px" : undefined,
          }}
        >
          <SandpackProvider
            template={template}
            theme={isDark ? "dark" : "light"}
            files={previewFiles}
            options={{
              externalResources: ["https://cdn.tailwindcss.com"],
              initMode: "user-visible", 
              recompileMode: "delayed",
              recompileDelay: 300,
            }}
            customSetup={
              !isVanilla
                ? { dependencies }
                : undefined
            }
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
      </div>
    </div>
  );
}
