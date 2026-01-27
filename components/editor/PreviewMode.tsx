"use client";

import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackPreview, 
  useSandpack 
} from "@codesandbox/sandpack-react";
import { Loader2, AlertCircle } from "lucide-react";

interface PreviewModeProps {
  code: string;
  isDark: boolean;
}

// 1. 状态管理组件：真正监听 Sandpack 的编译状态
function StatusOverlay() {
  const { sandpack } = useSandpack();
  const { status } = sandpack;
  
  // 状态可能是: 'initial' | 'idle' | 'running' | 'timeout' | 'done'
  const isLoading = status === 'initial' || status === 'running';
  const isError = status === 'timeout'; // 注意：语法错误通常在 editor 中显示，timeout 是环境问题

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

export function PreviewMode({ code, isDark }: PreviewModeProps) {
  return (
    <div className="h-full w-full relative group">
      {/* 2. 使用 SandpackProvider 替代 Sandpack，获得完全控制权 */}
      <SandpackProvider
        template="react"
        theme={isDark ? "dark" : "light"}
        files={{
          "/App.js": code,
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          // 3. 关键配置：懒加载模式，避免隐藏在后台时占用资源
          initMode: "user-visible", 
          recompileMode: "delayed",
          recompileDelay: 300,
        }}
        customSetup={{
          dependencies: {
            // 4. 优化：锁定版本号，不要用 "latest"，提高缓存命中率和加载速度
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
          display: "block" // 强制 block 布局覆盖默认 flex
        }}>
          <div className="relative h-full w-full">
            {/* 加载/错误 遮罩层 */}
            <StatusOverlay />
            
            {/* 5. 必须存在：Preview 组件，用于承载 iframe */}
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