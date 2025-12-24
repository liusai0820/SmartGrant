/**
 * @file ProjectSidebar.tsx
 * @input projects[], activeProjectId, CRUD 回调函数
 * @output 项目列表侧边栏 - tweakcn 风格设计
 * @pos 导航组件 - 项目选择与管理入口
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileText, FolderOpen, Layout, Sparkles, Settings, HelpCircle } from 'lucide-react';
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
  onViewDashboard?: () => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onViewDashboard,
}) => {
  return (
    <div className="sidebar h-full flex flex-col">
      {/* Logo & 品牌 */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground leading-tight">智评系统</h1>
            <p className="text-xs text-muted-foreground">SmartGrant</p>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="px-3 py-3">
        <button
          onClick={onCreateProject}
          className="sidebar-item active w-full mb-1"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>

        {onViewDashboard && (
          <button
            onClick={onViewDashboard}
            className="sidebar-item w-full"
          >
            <Layout className="w-4 h-4" />
            项目看板
          </button>
        )}
      </div>

      {/* 分隔线 + 标签 */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            项目列表
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-muted-foreground"
            >
              <FolderOpen className="w-10 h-10 opacity-30 mb-3" />
              <span className="text-sm">暂无项目</span>
            </motion.div>
          ) : (
            <div className="space-y-1">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "group relative flex items-center gap-3",
                    "px-3 py-2.5 rounded-lg cursor-pointer",
                    "transition-all duration-150",
                    project.id === activeProjectId
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                  )}
                  onClick={() => onSelectProject(project.id)}
                >
                  <FileText className={cn(
                    "w-4 h-4 shrink-0",
                    project.id === activeProjectId
                      ? "text-primary"
                      : "text-muted-foreground"
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(project.updatedAt).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个项目吗？')) {
                        onDeleteProject(project.id);
                      }
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100",
                      "p-1.5 rounded-md",
                      "text-muted-foreground hover:text-destructive",
                      "hover:bg-destructive/10",
                      "transition-all"
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部菜单 */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="space-y-1">
          <button className="sidebar-item w-full">
            <Settings className="w-4 h-4" />
            设置
          </button>
          <button className="sidebar-item w-full">
            <HelpCircle className="w-4 h-4" />
            帮助
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;
