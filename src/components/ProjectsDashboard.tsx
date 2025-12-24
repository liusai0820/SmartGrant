/**
 * @file ProjectsDashboard.tsx
 * @input projects[], onSelectProject, onCreateProject
 * @output 项目总览看板 - 类似 tweakcn Dashboard 风格
 * @pos 核心视图组件 - 项目全局管理视图
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Trash2,
    FolderOpen,
    TrendingUp,
    Users,
    BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentStatus, AgentType, AgentResult } from '@/types';

interface ProjectCardData {
    id: string;
    name: string;
    updatedAt: number;
    createdAt?: number;
    materialsCount: number;
    guidelinesCount: number;
    status: 'draft' | 'reviewing' | 'completed' | 'error';
    agents?: Record<AgentType, AgentResult>;
}

interface ProjectsDashboardProps {
    projects: ProjectCardData[];
    onSelectProject: (id: string) => void;
    onCreateProject: () => void;
    onDeleteProject: (id: string) => void;
}

const STATUS_CONFIG = {
    draft: {
        label: '草稿',
        icon: FileText,
        color: 'text-muted-foreground',
    },
    reviewing: {
        label: '评审中',
        icon: Loader2,
        color: 'text-warning',
    },
    completed: {
        label: '已完成',
        icon: CheckCircle2,
        color: 'text-success',
    },
    error: {
        label: '异常',
        icon: AlertCircle,
        color: 'text-destructive',
    },
};

const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
    projects,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
}) => {
    const stats = {
        total: projects.length,
        completed: projects.filter(p => p.status === 'completed').length,
        reviewing: projects.filter(p => p.status === 'reviewing').length,
        draft: projects.filter(p => p.status === 'draft').length,
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* 顶部标题区 */}
            <div className="px-6 py-5 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">项目看板</h1>
                        <p className="text-sm text-muted-foreground mt-1">管理和跟踪所有评审项目</p>
                    </div>
                    <button
                        onClick={onCreateProject}
                        className="btn btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        新建项目
                    </button>
                </div>
            </div>

            {/* 统计卡片区域 */}
            <div className="px-6 py-4 border-b border-border bg-muted/30">
                <div className="grid grid-cols-4 gap-4">
                    {/* 全部项目 */}
                    <div className="stat-card flex items-center justify-between">
                        <div>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">全部项目</div>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/10">
                            <BarChart3 className="w-6 h-6 text-primary" />
                        </div>
                    </div>

                    {/* 已完成 */}
                    <div className="stat-card flex items-center justify-between">
                        <div>
                            <div className="stat-value text-success">{stats.completed}</div>
                            <div className="stat-label">已完成</div>
                        </div>
                        <div className="p-3 rounded-xl bg-success/10">
                            <CheckCircle2 className="w-6 h-6 text-success" />
                        </div>
                    </div>

                    {/* 评审中 */}
                    <div className="stat-card flex items-center justify-between">
                        <div>
                            <div className="stat-value text-warning">{stats.reviewing}</div>
                            <div className="stat-label">评审中</div>
                        </div>
                        <div className="p-3 rounded-xl bg-warning/10">
                            <Users className="w-6 h-6 text-warning" />
                        </div>
                    </div>

                    {/* 草稿 */}
                    <div className="stat-card flex items-center justify-between">
                        <div>
                            <div className="stat-value">{stats.draft}</div>
                            <div className="stat-label">草稿</div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 项目列表 */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <FolderOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">暂无项目</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            创建您的第一个评审项目，开始使用 AI 智能评审系统
                        </p>
                        <button
                            onClick={onCreateProject}
                            className="btn btn-primary"
                        >
                            <Plus className="w-4 h-4" />
                            创建项目
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projects.map((project, index) => {
                            const statusConfig = STATUS_CONFIG[project.status];
                            const StatusIcon = statusConfig.icon;
                            const isCompleted = project.status === 'completed';
                            const isReviewing = project.status === 'reviewing';

                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="card card-hover cursor-pointer"
                                    onClick={() => onSelectProject(project.id)}
                                >
                                    <div className="p-5">
                                        {/* 头部：状态 + 操作 */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={cn(
                                                "badge",
                                                isCompleted && "badge-success",
                                                isReviewing && "badge-warning",
                                                !isCompleted && !isReviewing && "bg-muted text-muted-foreground"
                                            )}>
                                                <StatusIcon className={cn(
                                                    "w-3.5 h-3.5",
                                                    isReviewing && "animate-spin"
                                                )} />
                                                {statusConfig.label}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('确定要删除这个项目吗？')) {
                                                        onDeleteProject(project.id);
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* 项目名称 */}
                                        <h3 className="text-base font-semibold text-foreground mb-3 line-clamp-2">
                                            {project.name}
                                        </h3>

                                        {/* 元信息 */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5" />
                                                {project.materialsCount || 0} 份材料
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(project.updatedAt).toLocaleDateString('zh-CN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsDashboard;
