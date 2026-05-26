"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button, Input, Logo } from "@/components/ui";
import { cn } from "@/lib/utils";

function getPasswordStrength(pw: string) {
  if (!pw) return { label: "", score: 0, color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "弱", score: 1, color: "bg-red-500" };
  if (score <= 3) return { label: "中", score: 2, color: "bg-yellow-500" };
  return { label: "强", score: 3, color: "bg-green-500" };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength.score ? strength.color : "bg-gray-200 dark:bg-gray-700",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        密码强度：
        <span
          className={cn(
            strength.score === 1 && "text-red-500",
            strength.score === 2 && "text-yellow-500",
            strength.score === 3 && "text-green-500",
          )}
        >
          {strength.label}
        </span>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("请输入邮箱地址"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("请输入有效的邮箱格式"); return; }
    if (!password) { setError("请输入密码"); return; }
    if (password.length < 6) { setError("密码至少需要 6 个字符"); return; }
    if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "注册失败"); return; }

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error) { router.push("/login"); }
      else { router.push("/dashboard"); }
    } catch {
      setError("注册失败，请稍后重试");
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

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">创建账号</h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">注册以开始将草图转换为代码</p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                昵称 <span className="font-normal text-gray-400">(可选)</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的昵称"
                icon={<User className="h-4 w-4" />}
              />
            </div>

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
                placeholder="至少 6 个字符"
                icon={<Lock className="h-4 w-4" />}
              />
              <PasswordStrengthBar password={password} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">确认密码</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                icon={<Lock className="h-4 w-4" />}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="md">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 注册中...</>
              ) : (
                <>注册 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-500 dark:hover:text-blue-300">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
