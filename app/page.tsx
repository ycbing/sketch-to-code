import Link from "next/link";
import { ArrowRight, Sparkles, Code2, Zap, ImagePlus, Layers, Share2, Monitor, Tablet, Smartphone, Quote } from "lucide-react";

const STATS = [
  { value: "免费", label: "开始使用", suffix: "" },
  { value: "4", label: "支持框架", suffix: "种" },
  { value: "AI", label: "代码生成", suffix: "" },
  { value: "∞", label: "创意可能", suffix: "" },
];

const TESTIMONIALS = [
  {
    name: "张小明",
    role: "前端工程师",
    content: "从手绘线框到可运行的代码，只需几秒钟。这个工具彻底改变了我的原型开发流程。",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "李文静",
    role: "UI 设计师",
    content: "作为设计师，我终于可以直接把截图变成代码给开发看了。再也不用手动标注每个间距和颜色了。",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "王大伟",
    role: "独立开发者",
    content: "一个人做全栈项目，这个工具帮我省了大量写 UI 的时间。多框架支持太实用了，React 和 Vue 都能生成。",
    color: "from-orange-500 to-red-500",
  },
];

const FEATURES = [
  { icon: ImagePlus, title: "截图识别", desc: "上传设计稿截图，AI 精准还原为代码。支持 PNG、JPG、WebP。" },
  { icon: Sparkles, title: "AI 智能生成", desc: "先进的 AI 模型分析您的草图，即时生成生产级组件代码。" },
  { icon: Layers, title: "多框架输出", desc: "支持 React、Vue、小程序、HTML 等主流框架一键切换。" },
  { icon: Monitor, title: "实时预览", desc: "桌面/平板/手机三种预览模式，实时查看生成效果。" },
  { icon: Code2, title: "代码编辑", desc: "内置代码编辑器，支持语法高亮和多文件浏览。" },
  { icon: Share2, title: "分享协作", desc: "一键生成分享链接，展示你的作品到 Gallery。" },
];

function CodeDemoBlock() {
  const lines = [
    { color: "", text: 'import { Header } from \x27./components\x27;' },
    { color: "", text: "" },
    { color: "", text: 'export default function Page() {' },
    { color: "", text: '  return (' },
    { color: "", text: '    <div className="container">' },
    { color: "", text: '      <Header />' },
    { color: "", text: '      <div className="grid">' },
    { color: "text-gray-600", text: '        {/* component */}' },
    { color: "", text: '      </div>' },
    { color: "", text: '    </div>' },
    { color: "", text: '  );' },
    { color: "", text: '}' },
  ];

  return (
    <div className="text-gray-300">
      {lines.map((line, i) => (
        <div key={i} className={line.color}>{line.text}</div>
      ))}
      <p className="text-center text-gray-500 mt-3 text-[10px]">✨ 生成的高质量代码</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/50 dark:bg-black/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-lg tracking-tight">智能绘图</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">功能特性</Link>
            <Link href="/gallery" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">作品展示</Link>
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">定价</Link>
            <Link href="/dashboard" className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center gap-2">
              开始使用 <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm mb-6">
            <Zap className="w-4 h-4" />
            <span>AI 驱动 • 截图转代码 • 多框架支持</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
            将草图转化为{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">生产级代码</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            手绘线框、上传截图，AI 即刻生成 React / Vue / 小程序代码。告别从零开始的手动编码。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center gap-2 shadow-lg">
              免费开始 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#demo" className="px-8 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              查看演示
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-3 text-xs text-gray-400 dark:text-gray-600 font-mono">sketch-to-code.ai/editor</span>
            </div>
            {/* Demo Content: Sketch → AI → Code */}
            <div className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-4 md:gap-6 items-center">
                {/* Left: Wireframe */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 space-y-4 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                  <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="flex gap-3">
                    <div className="h-10 w-24 bg-blue-200 dark:bg-blue-900/40 rounded-lg"></div>
                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">📷 你的设计稿 / 手绘</p>
                </div>

                {/* Center: AI Arrow */}
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">AI 分析</span>
                  <div className="flex flex-col items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <span>结构识别 → 代码生成</span>
                    <span>响应式 + 多框架</span>
                  </div>
                </div>

                {/* Right: Code Preview */}
                <div className="bg-gray-900 dark:bg-black rounded-xl p-5 font-mono text-xs leading-relaxed overflow-hidden">
                  <CodeDemoBlock />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">快速构建所需的一切</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">强大的功能，简化您的设计到代码工作流</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow group">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${feat.icon === Sparkles ? "bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50" : feat.icon === ImagePlus ? "bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50" : feat.icon === Layers ? "bg-cyan-100 dark:bg-cyan-900/30 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50" : feat.icon === Monitor ? "bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50" : feat.icon === Code2 ? "bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50" : "bg-pink-100 dark:bg-pink-900/30 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50"}`}>
                <feat.icon className={`w-6 h-6 ${feat.icon === Sparkles ? "text-blue-600 dark:text-blue-400" : feat.icon === ImagePlus ? "text-purple-600 dark:text-purple-400" : feat.icon === Layers ? "text-cyan-600 dark:text-cyan-400" : feat.icon === Monitor ? "text-green-600 dark:text-green-400" : feat.icon === Code2 ? "text-orange-600 dark:text-orange-400" : "text-pink-600 dark:text-pink-400"}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">用户怎么说</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <Quote className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">{t.content}</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">准备好加速构建了吗？</h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              用 AI 加速你的前端开发流程。免费开始，无需信用卡。
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/register" className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all shadow-lg">
                免费开始 <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20">
                查看定价方案
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-400 rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white dark:text-black" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">基于 Next.js 和 Vercel AI SDK 构建</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/gallery" className="hover:text-gray-900 dark:hover:text-white transition-colors">作品展示</Link>
            <Link href="/pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">定价</Link>
            <Link href="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">注册</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
