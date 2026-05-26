"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, Clock, Sparkles, ArrowRight, Home, X, Loader2, Settings, LayoutTemplate } from "lucide-react";
import { getAllProjects, deleteProject, createProject, startPeriodicSync, stopPeriodicSync } from "@/lib/db";
import type { Project } from "@/lib/types";
import { TEMPLATES, TEMPLATE_CATEGORIES, type CategoryConfig } from "@/lib/templates";
import { Button, Card, Logo, SiteHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);

  useEffect(() => {
    loadProjects();
    startPeriodicSync();
    return () => stopPeriodicSync();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteProject(showDeleteConfirm);
      setProjects((prev) => prev.filter((p) => p.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleCreateNew = useCallback(async () => {
    if (!projectName.trim()) return;
    setIsCreating(true);
    try {
      const newProject = await createProject(projectName.trim(), projectDescription.trim() || undefined);
      setProjects((prev) => [newProject, ...prev]);
      setProjectName("");
      setProjectDescription("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setIsCreating(false);
    }
  }, [projectName, projectDescription]);

  const handleOpenCreateModal = () => {
    setProjectName("");
    setProjectDescription("");
    setShowCreateModal(true);
  };

  const filteredTemplates =
    activeCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setIsCreatingFromTemplate(true);
    try {
      const newProject = await createProject(template.name, template.description);
      window.location.href = `/editor/${newProject.id}?template=${encodeURIComponent(templateId)}`;
    } catch (error) {
      console.error("Failed to create project from template:", error);
      setIsCreatingFromTemplate(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <SiteHeader>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Home className="w-5 h-5" />
          </Link>
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="AI 模型设置">
            <Settings className="w-5 h-5" />
          </Link>
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="w-4 h-4" /> 新建项目
          </Button>
        </div>
      </SiteHeader>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">从模板开始</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 ml-11">选择预设模板，一键生成专业页面设计</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {TEMPLATE_CATEGORIES.map((cat: CategoryConfig) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col"
              >
                <div className={`relative h-32 bg-gradient-to-br ${template.gradient} flex items-center justify-center`}>
                  <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{template.emoji}</span>
                  <div className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 bg-white/10 rounded-full" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">{template.description}</p>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={isCreatingFromTemplate}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isCreatingFromTemplate ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 创建中...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> 使用</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-sm text-gray-400 dark:text-gray-500">我的项目</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">我的项目</h1>
          <p className="text-gray-600 dark:text-gray-400">管理并继续处理您的草图设计</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">还没有项目</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">创建第一个项目开始绘图</p>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="w-4 h-4" /> 创建项目
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} hover className="p-6 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(project.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
                <Link
                  href={`/editor/${project.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  打开编辑器 <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">新建项目</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如：登录页面设计"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && projectName.trim()) handleCreateNew(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  项目描述 <span className="text-gray-400">(可选)</span>
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="简要描述这个项目的用途..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" size="md" onClick={() => setShowCreateModal(false)}>取消</Button>
                <Button className="flex-1" size="md" onClick={handleCreateNew} disabled={!projectName.trim() || isCreating}>
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> 创建中...</> : <><Plus className="w-4 h-4" /> 创建项目</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">确认删除项目</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">此操作将永久删除该项目及其所有历史记录，无法恢复。</p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" size="md" onClick={() => setShowDeleteConfirm(null)}>取消</Button>
                <Button variant="danger" className="flex-1" size="md" onClick={confirmDelete}>确认删除</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
