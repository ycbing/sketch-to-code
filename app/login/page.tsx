"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button, Input, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("请输入邮箱地址"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("请输入有效的邮箱格式"); return; }
    if (!password) { setError("请输入密码"); return; }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error) { setError("邮箱或密码错误"); }
      else { router.push("/dashboard"); }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex md:w-1/2 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 p-12 lg:p-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-[100px]" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" /></svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Sketch to Code
            </span>
          </Link>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-white">
            将草图转化为
            <br />
            生产级代码
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
            在画布上绘制 UI 设计，或上传设计稿截图，AI 即刻生成可运行的 React 组件。
          </p>
        </div>

        <div className="relative z-10 my-8">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <span className="h-3 w-3 rounded-full bg-green-400/60" />
              <span className="ml-3 text-xs text-white/40 font-mono">App.tsx</span>
            </div>
            <pre className="p-5 font-mono text-[13px] leading-6 text-white/70 overflow-hidden">
{`export default function App() {
  return (
    <div className="min-h-screen">
      <Hero title="Welcome" />
      <Features count={3} />
    </div>
  )
}`}
            </pre>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-blue-200/60">
            AI 驱动 • 多框架支持 • 即时预览
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-white dark:bg-gray-950 px-6 py-12 md:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center md:hidden">
            <Logo size="lg" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">登录</h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">输入你的账号以继续</p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                icon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!email.trim()) { setError("请先输入邮箱"); return; }
                  try {
                    await fetch("/api/auth/reset-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: email.trim() }),
                    });
                    alert("如果该邮箱已注册，重置链接将发送至您的邮箱");
                  } catch { setError("请求失败"); }
                }}
                className="text-xs text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
              >
                忘记密码？
              </button>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="md">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 登录中...</>
              ) : (
                <>登录 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-600">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            使用 GitHub 登录
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-500 dark:hover:text-blue-300">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
