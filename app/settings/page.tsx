"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Settings, Home, Save, Check, AlertCircle, Sparkles, Key, Server } from "lucide-react";
import { FRAMEWORK_CONFIGS, type Framework } from "@/lib/frameworks";
import { Button, Card, Input, SiteHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AIModelConfig {
  provider: "openai" | "anthropic" | "zhipu" | "siliconflow";
  apiKey: string;
  baseURL?: string;
  model: string;
}

const DEFAULT_CONFIGS: Record<string, Omit<AIModelConfig, "apiKey">> = {
  openai: { provider: "openai", baseURL: "https://api.openai.com/v1", model: "gpt-4o" },
  anthropic: { provider: "anthropic", baseURL: "https://api.anthropic.com", model: "claude-3-5-sonnet-20241022" },
  zhipu: { provider: "zhipu", baseURL: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4v-flash" },
  siliconflow: { provider: "siliconflow", baseURL: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
};

export default function SettingsPage() {
  const [config, setConfig] = useState<AIModelConfig>({
    provider: "zhipu", apiKey: "", baseURL: DEFAULT_CONFIGS.zhipu.baseURL, model: DEFAULT_CONFIGS.zhipu.model,
  });
  const [defaultFramework, setDefaultFramework] = useState<Framework>("react");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function loadConfig() {
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/ai-config");
          if (res.ok) {
            const data = await res.json();
            if (data.provider) {
              setConfig({ provider: data.provider, apiKey: "", baseURL: data.baseURL || DEFAULT_CONFIGS[data.provider]?.baseURL || "", model: data.model || DEFAULT_CONFIGS[data.provider]?.model || "" });
            }
          }
        } catch { /* fallback */ }
      }
      const savedConfig = localStorage.getItem("ai-model-config");
      if (savedConfig && !session?.user?.id) {
        try { setConfig(JSON.parse(savedConfig)); } catch (err) { console.error("Failed to parse saved config:", err); }
      }
      const savedFramework = localStorage.getItem("sketch-framework") as Framework | null;
      if (savedFramework) setDefaultFramework(savedFramework);
    }
    loadConfig();
  }, [session?.user?.id]);

  const handleProviderChange = (provider: "openai" | "anthropic" | "zhipu" | "siliconflow") => {
    const defaultConfig = DEFAULT_CONFIGS[provider];
    setConfig({ provider, apiKey: config.apiKey, baseURL: defaultConfig.baseURL, model: defaultConfig.model });
  };

  const handleSave = async () => {
    if (!config.apiKey.trim()) { setError("请输入 API Key"); return; }
    if (session?.user?.id) {
      try {
        const res = await fetch("/api/ai-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: config.provider, apiKey: config.apiKey, baseURL: config.baseURL, model: config.model }),
        });
        if (!res.ok) { setError("保存到服务器失败"); return; }
      } catch { setError("网络错误，请重试"); return; }
    }
    localStorage.setItem("ai-model-config", JSON.stringify(config));
    localStorage.setItem("sketch-framework", defaultFramework);
    setSaved(true);
    setError(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) { setError("请输入 API Key"); return; }
    setTesting(true);
    setError(null);
    try {
      const response = await fetch("/api/test-model", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      if (!response.ok) throw new Error("测试失败");
      const result = await response.json();
      if (result.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { setError(result.error || "测试失败"); }
    } catch { setError("连接失败，请检查配置"); } finally { setTesting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <SiteHeader>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Home className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-gray-900 dark:text-white">AI 模型配置</span>
          </div>
        </div>
      </SiteHeader>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">模型设置</h1>
          <p className="text-gray-600 dark:text-gray-400">配置您偏好的 AI 模型提供商</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> 选择提供商
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { id: "zhipu", name: "智谱 AI", desc: "GLM-4V 视觉模型" },
              { id: "openai", name: "OpenAI", desc: "GPT-4V 多模态" },
              { id: "anthropic", name: "Anthropic", desc: "Claude 3.5 Sonnet" },
              { id: "siliconflow", name: "硅基流动", desc: "DeepSeek 等多模型" },
            ].map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id as AIModelConfig["provider"])}
                className={cn(
                  "p-4 border-2 rounded-lg text-left transition-all",
                  config.provider === provider.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                )}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{provider.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{provider.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" /> API 配置
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <Input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="输入您的 API Key" className="font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base URL</label>
              <Input type="text" value={config.baseURL || ""} onChange={(e) => setConfig({ ...config, baseURL: e.target.value })} placeholder="API 基础 URL" className="font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">模型名称</label>
              <Input type="text" value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} placeholder="模型名称" className="font-mono text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="flex-1" size="md" onClick={handleSave}>
              {saved ? <><Check className="w-4 h-4" /> 已保存</> : <><Save className="w-4 h-4" /> 保存配置</>}
            </Button>
            <Button variant="secondary" size="md" onClick={handleTest} disabled={testing}>
              {testing ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> 测试中...</> : <><Server className="w-4 h-4" /> 测试连接</>}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">🖥️ 默认输出框架</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">选择 AI 生成代码时的默认框架，也可在编辑器中随时切换</p>
          <div className="grid grid-cols-2 gap-3">
            {FRAMEWORK_CONFIGS.map((fw) => (
              <button
                key={fw.id}
                onClick={() => setDefaultFramework(fw.id)}
                className={cn(
                  "p-4 border-2 rounded-lg text-left transition-all",
                  defaultFramework === fw.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{fw.icon}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fw.name}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{fw.description}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">配置说明</h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p><strong>智谱 AI:</strong> 访问 <a href="https://open.bigmodel.cn" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">open.bigmodel.cn</a> 获取 API Key，支持免费使用 GLM-4V Flash 模型</p>
            <p><strong>OpenAI:</strong> 需要有效的 OpenAI API Key，支持 GPT-4V 等多模态模型</p>
            <p><strong>Anthropic:</strong> 需要 Claude API Key，支持 Claude 3.5 Sonnet</p>
            <p><strong>硅基流动:</strong> 访问 <a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">cloud.siliconflow.cn</a> 获取 API Key，支持 DeepSeek、Qwen 等多种模型</p>
          </div>
        </div>
      </main>
    </div>
  );
}
