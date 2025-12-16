'use client';

import React from 'react';
import { Plus, Trash2, FileText, Layout, Cloud, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectItem {
  id: string;
  name: string;
  updatedAt: number;
  materialsCount: number;
}

interface ProjectSidebarProps {
  projects: ProjectItem[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  return (
    <div className="w-72 bg-zinc-950 text-zinc-400 flex flex-col h-full border-r border-zinc-800 flex-shrink-0 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-primary/10 rounded-xl p-2.5">
            <Layout className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight leading-none">智评系统</h1>
            <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-wider">SmartGrant Reviewer</p>
          </div>
        </div>

        <button
          onClick={onCreateProject}
          className="group w-full bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-zinc-900/20 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
          新建评审项目
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-3">
          项目档案 ({projects.length})
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-700 space-y-3">
            <FolderOpen className="h-10 w-10 opacity-20" />
            <span className="text-xs">暂无项目</span>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "group relative flex items-center justify-between px-3 py-3.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                project.id === activeProjectId
                  ? "bg-zinc-900 text-zinc-100 border-zinc-800 shadow-sm"
                  : "hover:bg-zinc-900/50 hover:text-zinc-200 hover:border-zinc-800/50"
              )}
              onClick={() => onSelectProject(project.id)}
            >
              {project.id === activeProjectId && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}

              <div className="flex-1 min-w-0 ml-1">
                <div className="flex items-center space-x-2">
                  <FileText className={cn("h-4 w-4 shrink-0", project.id === activeProjectId ? "text-primary" : "text-zinc-600 group-hover:text-zinc-500")} />
                  <h3 className="text-sm font-medium truncate">{project.name}</h3>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 pl-6">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('确定要删除这个项目档案吗？')) onDeleteProject(project.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-zinc-600 transition-all"
                title="删除项目"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-zinc-900">
        <div className="flex items-center space-x-2 text-xs text-zinc-600 bg-zinc-900/50 py-2 px-3 rounded-lg border border-zinc-900">
          <Cloud className="h-3 w-3" />
          <span>数据已云端同步</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;
