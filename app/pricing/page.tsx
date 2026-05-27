import Link from "next/link";
import { Check, X, ArrowRight, Star, Zap, Shield } from "lucide-react";
import { Button, Card, Badge, Logo, SiteHeader, SiteFooter } from "@/components/ui";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "¥0",
    period: "永久免费",
    description: "适合个人体验和试用",
    highlighted: false,
    features: [
      { text: "注册赠送 200 积分", included: true },
      { text: "手绘画板 + 截图识别", included: true },
      { text: "React 框架输出", included: true },
      { text: "在线预览与代码编辑", included: true },
      { text: "单文件下载", included: true },
      { text: "多框架输出", included: false },
      { text: "ZIP 打包导出", included: false },
      { text: "优先生成队列", included: false },
      { text: "API 访问", included: false },
    ],
  },
  {
    name: "Pro",
    price: "¥49",
    period: "/月",
    description: "适合设计师和独立开发者",
    highlighted: true,
    badge: "推荐",
    features: [
      { text: "每月 2,000 积分", included: true },
      { text: "手绘画板 + 截图识别", included: true },
      { text: "React / Vue / 小程序 / HTML", included: true },
      { text: "在线预览与代码编辑", included: true },
      { text: "ZIP 打包导出所有文件", included: true },
      { text: "多框架输出", included: true },
      { text: "优先生成队列", included: true },
      { text: "项目分享 & Gallery 展示", included: true },
      { text: "API 访问", included: false },
    ],
  },
  {
    name: "Enterprise",
    price: "¥199",
    period: "/月",
    description: "适合团队和企业级使用",
    highlighted: false,
    features: [
      { text: "无限积分", included: true },
      { text: "全部框架输出 + 自定义模板", included: true },
      { text: "在线预览与代码编辑", included: true },
      { text: "ZIP 打包 + 一键部署", included: true },
      { text: "优先生成队列", included: true },
      { text: "项目分享 & 团队协作", included: true },
      { text: "API 访问", included: true },
      { text: "自定义部署", included: true },
      { text: "专属技术支持", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <SiteHeader>
        <Logo size="md" />
        <nav className="flex items-center gap-6">
          <Link href="/#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">功能特性</Link>
          <Link href="/gallery" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">作品展示</Link>
          <Link href="/pricing" className="text-sm text-gray-900 dark:text-white font-medium">定价</Link>
          <Button size="sm" href="/dashboard">
            开始使用 <ArrowRight className="w-4 h-4" />
          </Button>
        </nav>
      </SiteHeader>

      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          <Star className="w-4 h-4" />
          <span>按需付费，随时取消</span>
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-6 mb-4 text-gray-900 dark:text-white">
          选择适合你的{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">方案</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          从个人试用到企业级部署，灵活的定价满足不同需求
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col transition-all hover:shadow-xl",
                plan.highlighted
                  ? "bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/10 scale-105"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
              )}
            >
              {plan.badge && (
                <Badge variant="gradient" className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-lg">
                  {plan.badge}
                </Badge>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <X className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                      </div>
                    )}
                    <span className={feature.included ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "gradient" : "primary"}
                className="w-full"
                size="md"
                href={plan.name === "Free" ? "/register" : "/dashboard"}
              >
                {plan.name === "Free" ? "免费开始" : "立即升级"}
                {plan.name !== "Free" && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>安全支付</span></div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4" /><span>即时生效</span></div>
          <div className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /><span>随时取消</span></div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4" /><span>7天无理由退款</span></div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">常见问题</h2>
        <div className="space-y-4">
          {[
            { q: "积分用完了怎么办？", a: "你可以购买额外积分包（100积分/¥9），或者升级到 Pro 套餐获得每月自动充值。Enterprise 套餐积分无限。" },
            { q: "可以随时取消订阅吗？", a: "当然可以。Pro 和 Enterprise 套餐随时取消，已支付的当月费用不会退还，下月起自动停止扣费。" },
            { q: "免费版有什么限制？", a: "免费版包含 200 积分（约10次生成），仅支持 React 框架输出，单文件下载。升级后解锁全部功能。" },
            { q: "支持哪些付款方式？", a: "支持微信支付、支付宝和银行卡。" },
          ].map((item) => (
            <Card key={item.q} className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>基于 Next.js 和 Vercel AI SDK 构建</p>
        </div>
      </SiteFooter>
    </div>
  );
}
