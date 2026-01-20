// app/components/HistoryPanel.tsx
"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import {
  getAllProjects,
  createProject,
  deleteProject as dbDeleteProject,
  getProjectVersions,
  createVersion,
  getVersion,
  deleteVersion as dbDeleteVersion,
} from "@/lib/db";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");
import {
  History,
  Clock,
  Trash2,
  ChevronRight,
  FolderPlus,
  Save,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  versions: Version[];
}

interface Version {
  id: string;
  versionNum: number;
  sketchImage: string;
  requirements?: string;
  createdAt: string;
}

interface HistoryPanelProps {
  currentSketchData?: string;
  currentSketchImage?: string;
  currentCode?: string;
  currentRequirements?: string;
  onLoadVersion: (version: {
    sketchData: string;
    sketchImage: string;
    generatedCode: string;
  }) => void;
}

export default function HistoryPanel({
  currentSketchData,
  currentSketchImage,
  currentCode,
  currentRequirements,
  onLoadVersion,
}: HistoryPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // 加载项目列表
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(
        data.map((p) => ({
          ...p,
          updatedAt: new Date(p.updatedAt).toISOString(),
          versions: [],
        })),
      );
    } catch (error) {
      console.error("加载项目失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 加载项目版本
  const loadProjectVersions = async (project: Project) => {
    setSelectedProject(project);

    try {
      const data = await getProjectVersions(project.id);
      setVersions(
        data.map((v) => ({
          ...v,
          createdAt: new Date(v.createdAt).toISOString(),
        })),
      );
    } catch (error) {
      console.error("加载版本失败:", error);
    }
  };

  // 创建新项目
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const project = await createProject(newProjectName);
      const projectWithVersions = {
        ...project,
        updatedAt: new Date(project.updatedAt).toISOString(),
        versions: [],
      };
      setProjects([projectWithVersions, ...projects]);
      setSelectedProject(projectWithVersions);
      setVersions([]);
      setShowNewProject(false);
      setNewProjectName("");
    } catch (error) {
      console.error("创建项目失败:", error);
    }
  };

  // 保存当前版本
  const handleSaveVersion = async () => {
    if (!selectedProject || !currentSketchData || !currentCode) return;

    setSaving(true);

    try {
      const version = await createVersion(selectedProject.id, {
        sketchData: currentSketchData,
        sketchImage: currentSketchImage || "",
        generatedCode: currentCode,
        requirements: currentRequirements,
      });
      setVersions([
        {
          ...version,
          createdAt: new Date(version.createdAt).toISOString(),
        },
        ...versions,
      ]);
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setSaving(false);
    }
  };

  // 加载版本
  const handleLoadVersion = async (version: Version) => {
    try {
      const data = await getVersion(version.id);
      if (data) {
        onLoadVersion({
          sketchData: data.sketchData,
          sketchImage: data.sketchImage,
          generatedCode: data.generatedCode,
        });
      }
    } catch (error) {
      console.error("加载版本失败:", error);
    }
  };

  // 删除版本
  const handleDeleteVersion = async (version: Version, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("确定要删除这个版本吗？")) return;

    try {
      await dbDeleteVersion(version.id);
      setVersions(versions.filter((v) => v.id !== version.id));
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  // 删除项目
  const handleDeleteProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`确定要删除项目 "${project.name}" 吗？所有版本都将被删除。`)) {
      return;
    }

    try {
      await dbDeleteProject(project.id);
      setProjects(projects.filter((p) => p.id !== project.id));

      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        setVersions([]);
      }
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <History size={18} />
          <span className="font-medium">历史记录</span>
        </div>

        {selectedProject && (
          <button
            onClick={handleSaveVersion}
            disabled={saving || !currentCode}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            保存版本
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 项目列表 */}
        <div className="w-1/2 border-r overflow-auto">
          <div className="p-2 border-b">
            {showNewProject ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="项目名称"
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateProject();
                    if (e.key === "Escape") setShowNewProject(false);
                  }}
                />
                <button
                  onClick={handleCreateProject}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  创建
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewProject(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
              >
                <FolderPlus size={16} />
                新建项目
              </button>
            )}
          </div>

          <div className="divide-y">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => loadProjectVersions(project)}
                className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedProject?.id === project.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dayjs(project.updatedAt).toNow()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(project, e)}
                  className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            ))}

            {projects.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <History size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无项目</p>
                <p className="text-xs">点击上方创建新项目</p>
              </div>
            )}
          </div>
        </div>

        {/* 版本列表 */}
        <div className="w-1/2 overflow-auto">
          {selectedProject ? (
            <>
              <div className="p-3 bg-gray-50 border-b">
                <div className="font-medium text-sm">
                  {selectedProject.name}
                </div>
                <div className="text-xs text-gray-500">
                  {versions.length} 个版本
                </div>
              </div>

              <div className="divide-y">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    onClick={() => handleLoadVersion(version)}
                    className="group p-3 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      {/* 缩略图 */}
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {version.sketchImage && (
                          <img
                            src={version.sketchImage}
                            alt={`版本 ${version.versionNum}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            版本 {version.versionNum}
                          </span>
                          <button
                            onClick={(e) => handleDeleteVersion(version, e)}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {version.requirements && (
                          <div className="text-xs text-gray-600 truncate mt-0.5">
                            {version.requirements}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock size={12} />
                          {dayjs(version.createdAt).toNow()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {versions.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <RotateCcw size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无版本</p>
                    <p className="text-xs">生成代码后点击保存</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChevronRight size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">选择一个项目查看版本</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
