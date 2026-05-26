"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, ImageOff, Clock } from "lucide-react";
import { Button, Card, Logo, SiteHeader, SiteFooter } from "@/components/ui";

interface GalleryProject {
  id: string;
  name: string;
  description?: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
  thumbnail: string | null;
}

export default function GalleryPage() {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch("/api/gallery");
        if (res.ok) setProjects(await res.json());
      } catch { /* silently fail */ } finally { setLoading(false); }
    }
    loadGallery();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20 dark:from-white/5 dark:via-transparent dark:to-white/5" />
      </div>

      <SiteHeader>
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <Link href="/gallery" className="text-sm text-gray-900 dark:text-white font-medium">Gallery</Link>
          <Button size="sm" href="/dashboard">
            开始使用 <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </SiteHeader>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">作品画廊</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">探索由 Sketch-to-Code 生成的精彩作品</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ImageOff className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无分享作品</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8">成为第一个分享作品的人吧！在编辑器中点击分享按钮即可展示你的作品。</p>
            <Button size="lg" href="/dashboard">
              开始创作 <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/share/${project.shareToken}`} className="group">
                <Card hover className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Sketch-to-Code — 将想法转化为代码</p>
        </div>
      </SiteFooter>
    </div>
  );
}
