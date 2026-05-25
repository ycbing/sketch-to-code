"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  PenTool,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared: Brand Side Panel (Left Column)                            */
/* ------------------------------------------------------------------ */
function BrandPanel() {
  return (
    <div className="hidden md:flex md:w-1/2 flex-col justify-between relative overflow-hidden bg-[#0a0a0a] p-12 lg:p-16">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow blob */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />

      {/* Top: Logo + Tagline */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <PenTool className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Sketch to Code
          </span>
        </Link>
        <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-white">
          Transform sketches
          <br />
          into production code
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
          Draw your UI ideas on a canvas and let AI generate clean, production-ready
          React components in seconds.
        </p>
      </div>

      {/* Center: Mock code editor */}
      <div className="relative z-10 my-8">
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] shadow-2xl shadow-black/40">
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/60" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <span className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-gray-500 font-mono">
              App.tsx
            </span>
          </div>
          {/* Code content */}
          <pre className="p-5 font-mono text-[13px] leading-6 text-gray-300 overflow-hidden">
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

      {/* Bottom: Trust badge */}
      <div className="relative z-10">
        <p className="text-xs text-gray-500">
          Trusted by{" "}
          <span className="font-medium text-gray-300">10,000+</span>{" "}
          developers worldwide
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Page                                                        */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱地址");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的邮箱格式");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Left: Brand */}
      <BrandPanel />

      {/* Right: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-[#111111] px-6 py-12 md:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-10 text-center md:hidden">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <PenTool className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                Sketch to Code
              </span>
            </Link>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-semibold text-white">登录</h2>
          <p className="mt-1.5 text-sm text-gray-400">
            输入你的账号以继续
          </p>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                邮箱
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full rounded-lg border border-gray-800 bg-[#1a1a1a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                密码
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full rounded-lg border border-gray-800 bg-[#1a1a1a] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
                />
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="#"
                className="text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                忘记密码？
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-400 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-xs text-gray-600">or</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-400">
            还没有账号？{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
