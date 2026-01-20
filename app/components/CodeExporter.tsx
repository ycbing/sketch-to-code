// app/components/CodeExporter.tsx
'use client';

import { useState } from 'react';
import { Download, FileCode, Package, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CodeExporterProps {
  code: string;
}

export default function CodeExporter({ code }: CodeExporterProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 提取组件名
  const componentName = code.match(/(?:function|const)\s+(\w+)/)?.[1] || 'Component';

  // 生成 package.json
  const generatePackageJson = () => ({
    name: `${componentName.toLowerCase()}-component`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      next: '^14.0.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      autoprefixer: '^10.4.0',
      postcss: '^8.4.0',
      tailwindcss: '^3.4.0',
    },
  });

  // 生成 tailwind.config.js
  const generateTailwindConfig = () => `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

  // 生成 tsconfig.json
  const generateTsConfig = () => ({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  });

  // 生成 README.md
  const generateReadme = () => `# ${componentName} Component

这是一个由 AI 生成的 React 组件。

## 快速开始

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
\`\`\`

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 技术栈

- **React 18** - UI 框架
- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式工具

## 组件使用

\`\`\`tsx
import ${componentName} from '@/components/${componentName}'

export default function Page() {
  return <${componentName} />
}
\`\`\`

## 自定义

你可以根据需要修改组件样式和功能：

1. 编辑 \`components/${componentName}.tsx\` 修改组件逻辑
2. 调整 Tailwind CSS 类名来改变样式
3. 在 \`tailwind.config.js\` 中扩展主题

## 部署

\`\`\`bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
\`\`\`

推荐部署到 [Vercel](https://vercel.com/) 平台。

---

由 AI 生成 @ ${new Date().toLocaleDateString('zh-CN')}
`;

  // 生成 globals.css
  const generateGlobalsCss = () => `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`;

  // 生成 app/page.tsx
  const generateAppPage = () => `import ${componentName} from '@/components/${componentName}'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <${componentName} />
    </main>
  )
}`;

  // 生成 app/layout.tsx
  const generateAppLayout = () => `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${componentName} Component',
  description: 'AI 生成的 React 组件',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;

  // 导出为 Next.js 项目
  const exportAsNextProject = async () => {
    setExporting(true);

    try {
      const zip = new JSZip();

      // 根目录文件
      zip.file('package.json', JSON.stringify(generatePackageJson(), null, 2));
      zip.file('tsconfig.json', JSON.stringify(generateTsConfig(), null, 2));
      zip.file('tailwind.config.js', generateTailwindConfig());
      zip.file('postcss.config.js', `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);
      zip.file('next.config.js', `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig`);
      zip.file('README.md', generateReadme());
      zip.file('.gitignore', `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`);

      // app 目录
      const appFolder = zip.folder('app');
      appFolder?.file('layout.tsx', generateAppLayout());
      appFolder?.file('page.tsx', generateAppPage());
      appFolder?.file('globals.css', generateGlobalsCss());

      // components 目录
      const componentsFolder = zip.folder('components');
      componentsFolder?.file(`${componentName}.tsx`, code);

      // public 目录
      zip.folder('public');

      // 生成并下载 zip
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${componentName.toLowerCase()}-nextjs-project.zip`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 导出为单个组件文件
  const exportAsSingleFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${componentName}.tsx`);
  };

  // 复制代码
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">导出选项</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {componentName}
        </span>
      </div>

      <div className="space-y-3">
        {/* 复制代码 */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-between p-3 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            {copied ? (
              <Check size={20} className="text-green-600" />
            ) : (
              <Copy size={20} className="text-gray-400 group-hover:text-blue-600" />
            )}
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">
                {copied ? '已复制到剪贴板' : '复制代码'}
              </div>
              <div className="text-xs text-gray-500">
                复制组件代码到剪贴板
              </div>
            </div>
          </div>
        </button>

        {/* 下载单个文件 */}
        <button
          onClick={exportAsSingleFile}
          className="w-full flex items-center justify-between p-3 border-2 border-gray-200 hover:border-blue-400 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <FileCode size={20} className="text-gray-400 group-hover:text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">
                下载组件文件
              </div>
              <div className="text-xs text-gray-500">
                下载 {componentName}.tsx
              </div>
            </div>
          </div>
          <Download size={16} className="text-gray-400 group-hover:text-blue-600" />
        </button>

        {/* 下载完整项目 */}
        <button
          onClick={exportAsNextProject}
          disabled={exporting}
          className="w-full flex items-center justify-between p-3 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-sm text-gray-900">
                {exporting ? '正在导出...' : '导出 Next.js 项目'}
              </div>
              <div className="text-xs text-gray-600">
                包含完整配置和依赖
              </div>
            </div>
          </div>
          <Download size={16} className="text-blue-600" />
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex gap-2">
          <div className="text-2xl">💡</div>
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">使用提示：</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>单文件：直接复制到现有项目中</li>
              <li>完整项目：解压后运行 npm install 安装依赖</li>
              <li>需要 Node.js 18+ 和 npm/yarn/pnpm</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
