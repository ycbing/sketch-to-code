// app/components/CodePreview.tsx - 优化版
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
// 导入所需图标
import { Code2, Eye, Copy, Check, Download, RefreshCw } from "lucide-react";

interface CodePreviewProps {
  code: string;
  onCodeChange?: (code: string) => void;
}

export default function CodePreview({ code, onCodeChange }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "split">(
    "split",
  );
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // 使用 useMemo 缓存处理后的代码
  const processedCode = useMemo(() => {
    return code.trim();
  }, [code]);

  // 防抖复制函数
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // 防抖刷新函数
  const handleRefresh = useCallback(() => {
    setPreviewKey((prev) => prev + 1);
  }, []);

  // 下载函数
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // 尝试从代码中提取组件名
    const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
    const componentName = componentMatch?.[1] || "Component";
    a.download = `${componentName}.tsx`;

    a.click();
    URL.revokeObjectURL(url);
  }, [code]);

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* 工具栏 */}
      <Toolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCopy={handleCopy}
        onRefresh={handleRefresh}
        onDownload={handleDownload}
        copied={copied}
      />

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" && <CodeView code={processedCode} />}

        {activeTab === "preview" && (
          <PreviewView code={processedCode} previewKey={previewKey} />
        )}

        {activeTab === "split" && (
          <SplitView code={processedCode} previewKey={previewKey} />
        )}
      </div>

      {/* 状态栏 */}
      <StatusBar code={code} />
    </div>
  );
}

// 工具栏组件
function Toolbar({
  activeTab,
  onTabChange,
  onCopy,
  onRefresh,
  onDownload,
  copied,
}: {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onCopy: () => void;
  onRefresh: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
      {/* 视图切换 */}
      <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
        <TabButton
          active={activeTab === "code"}
          onClick={() => onTabChange("code")}
          icon={<Code2 size={16} />}
          label="代码"
        />
        <TabButton
          active={activeTab === "preview"}
          onClick={() => onTabChange("preview")}
          icon={<Eye size={16} />}
          label="预览"
        />
        <TabButton
          active={activeTab === "split"}
          onClick={() => onTabChange("split")}
          icon={<SplitIcon />}
          label="分屏"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1">
        {(activeTab === "preview" || activeTab === "split") && (
          <IconButton
            onClick={onRefresh}
            icon={<RefreshCw size={16} />}
            title="刷新预览"
          />
        )}

        <IconButton
          onClick={onCopy}
          icon={
            copied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} />
            )
          }
          label={copied ? "已复制" : "复制"}
          className={copied ? "text-green-600" : ""}
        />

        <IconButton
          onClick={onDownload}
          icon={<Download size={16} />}
          title="下载代码"
        />
      </div>
    </div>
  );
}

// 标签按钮组件
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// 图标按钮组件
function IconButton({
  onClick,
  icon,
  label,
  title,
  className = "",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors ${className}`}
      title={title}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

// 分割图标
function SplitIcon() {
  return (
    <div className="flex gap-0.5">
      <div className="w-1 h-4 bg-current opacity-60"></div>
      <div className="w-1 h-4 bg-current"></div>
    </div>
  );
}

// 代码视图
function CodeView({ code }: { code: string }) {
  return (
    <div className="h-full overflow-auto bg-gray-900">
      <SyntaxHighlighter
        language="typescript"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1.5rem",
          background: "transparent",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
        showLineNumbers
        lineNumberStyle={{
          minWidth: "3em",
          paddingRight: "1em",
          color: "#6e7681",
          userSelect: "none",
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// 预览视图
function PreviewView({
  code,
  previewKey,
}: {
  code: string;
  previewKey: number;
}) {
  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="p-4">
        <PreviewFrame code={code} key={previewKey} />
      </div>
    </div>
  );
}

// 分屏视图
function SplitView({ code, previewKey }: { code: string; previewKey: number }) {
  return (
    <div className="h-full flex">
      {/* 左侧代码 */}
      <div className="w-1/2 border-r overflow-auto bg-gray-900">
        <SyntaxHighlighter
          language="typescript"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.5",
            height: "100%",
          }}
          showLineNumbers
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "0.75em",
            color: "#6e7681",
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* 右侧预览 */}
      <div className="w-1/2 bg-gray-50 overflow-auto">
        <div className="p-4">
          <PreviewFrame code={code} key={previewKey} />
        </div>
      </div>
    </div>
  );
}

// 预览框架组件
function PreviewFrame({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    try {
      const componentMatch = code.match(/(?:function|const)\s+(\w+)/);
      const componentName = componentMatch?.[1] || "App";

      const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 1rem; 
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      
      componentDidCatch(error, errorInfo) {
        console.error('React Error:', error, errorInfo);
      }
      
      render() {
        if (this.state.hasError) {
          return (
            <div style={{
              padding: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '0.5rem',
              color: '#c00',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <strong>渲染错误:</strong><br/>
              {this.state.error?.toString()}
            </div>
          );
        }
        return this.props.children;
      }
    }
    
    try {
      ${code.replace(/export\s+default\s+/, "")}
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        <ErrorBoundary>
          <${componentName} />
        </ErrorBoundary>
      );
    } catch (error) {
      document.getElementById('root').innerHTML = 
        '<div style="padding:1rem;background:#fee;border:1px solid #fcc;borderRadius:0.5rem;color:#c00;fontFamily:monospace;fontSize:12px">编译错误: ' + 
        error.message + '</div>';
      console.error('Compilation error:', error);
    }
  </script>
</body>
</html>`;

      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setError("");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [code]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <strong>加载错误:</strong>
        <pre className="mt-2 text-xs font-mono">{error}</pre>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full bg-white rounded-lg shadow-sm border"
      style={{ minHeight: "400px", height: "calc(100vh - 200px)" }}
      title="Component Preview"
      sandbox="allow-scripts"
    />
  );
}

// 加载骨架屏
function PreviewSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400">加载预览中...</div>
    </div>
  );
}

// 状态栏
function StatusBar({ code }: { code: string }) {
  const lineCount = code.split("\n").length;
  const charCount = code.length;
  const wordCount = code.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="font-medium">TypeScript</span>
          <span className="text-gray-400">•</span>
          <span>React 18</span>
          <span className="text-gray-400">•</span>
          <span>Tailwind CSS</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span>{lineCount} 行</span>
        <span className="text-gray-400">•</span>
        <span>{wordCount} 词</span>
        <span className="text-gray-400">•</span>
        <span>{charCount} 字符</span>
        <span className="text-gray-400">•</span>
        <span className="inline-flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          就绪
        </span>
      </div>
    </div>
  );
}
