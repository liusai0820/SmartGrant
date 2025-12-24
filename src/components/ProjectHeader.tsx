/**
 * @file ProjectHeader.tsx
 * @input project 信息, currentStage, onUpdateName
 * @output 项目头部区域 - 项目名称编辑、状态指示
 * @pos 布局组件 - 工作区顶部的项目信息展示
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useState } from 'react';
import { Edit3, Check, X, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowStage } from './WorkflowStepper';

interface ProjectHeaderProps {
    projectName: string;
    updatedAt: number;
    currentStage: WorkflowStage;
    onUpdateName: (name: string) => void;
    className?: string;
}

const STAGE_LABELS: Record<WorkflowStage, string> = {
    prepare: '准备中',
    selection: '专家遴选',
    review: '评审中',
    synthesis: '决议中',
    complete: '已完成',
};

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    projectName,
    updatedAt,
    currentStage,
    onUpdateName,
    className,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(projectName);

    const handleSave = () => {
        if (editValue.trim()) {
            onUpdateName(editValue.trim());
        } else {
            setEditValue(projectName);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(projectName);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    const isComplete = currentStage === 'complete';

    return (
        <div className={cn(
            "flex items-center justify-between px-6 py-4",
            "border-b border-border bg-card",
            className
        )}>
            {/* 左侧：项目名称 */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* 状态徽章 */}
                <span className={cn(
                    "badge",
                    isComplete ? "badge-success" : "badge-primary",
                    "shrink-0"
                )}>
                    {!isComplete && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {STAGE_LABELS[currentStage]}
                </span>

                {/* 项目名称 */}
                {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="input flex-1 text-lg font-semibold"
                            placeholder="输入项目名称..."
                        />
                        <button
                            onClick={handleSave}
                            className="btn-ghost p-2 text-success hover:bg-success/10"
                        >
                            <Check className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="btn-ghost p-2 text-muted-foreground hover:bg-muted"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="group flex items-center gap-2 min-w-0 hover:bg-muted/50 rounded-lg px-2 py-1 -ml-2 transition-colors"
                    >
                        <h1 className="text-xl font-semibold text-foreground truncate">
                            {projectName || '未命名项目'}
                        </h1>
                        <Edit3 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                )}
            </div>

            {/* 右侧：元信息 */}
            <div className="flex items-center gap-4">
                {/* 更新时间 */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                        {new Date(updatedAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>

                {/* AI 状态 */}
                <div className="badge badge-success">
                    <Zap className="w-3.5 h-3.5" />
                    AI 就绪
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader;
