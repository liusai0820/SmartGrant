/**
 * @file ReviewDashboard.tsx
 * @input AgentResult 记录 (来自 page.tsx 父组件)
 * @output 评审面板 UI 组件，展示多 Agent 评审进度与 Markdown 内容
 * @pos 核心交互组件 - 评审结果的主要展示界面
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Search,
    FileText,
    CheckCircle2,
    Loader2,
    AlertCircle,
    ChevronRight,
    User,
    BrainCircuit,
    Scale
} from 'lucide-react';
import { AgentResult, AgentStatus, AgentType } from '@/types';
import { cn } from '@/lib/utils';

// Agent Configuration for UI - Muted, professional palette
const AGENT_CONFIG: Record<AgentType, { name: string; role: string; icon: any; color: string; bg: string }> = {
    [AgentType.REVIEWER_A]: {
        name: '评审专家 A',
        role: '合规与风险',
        icon: Scale,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
    },
    [AgentType.REVIEWER_B]: {
        name: '评审专家 B',
        role: '技术与创新',
        icon: BrainCircuit,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
    },
    [AgentType.REVIEWER_C]: {
        name: '评审专家 C',
        role: '商业与落地',
        icon: Bot,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
    },
    [AgentType.SYNTHESIZER]: {
        name: '首席评审官',
        role: '综合决议',
        icon: FileText,
        color: 'text-slate-800',
        bg: 'bg-zinc-900 text-white',
    },
    [AgentType.EXPERT_HUNTER]: {
        name: '专家遴选',
        role: '人才搜索',
        icon: Search,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
    },
};

interface ReviewDashboardProps {
    agents: Record<AgentType, AgentResult>;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ agents }) => {
    // Default to Synthesizer if completed, else Reviewer A
    const [selectedAgent, setSelectedAgent] = useState<AgentType>(AgentType.REVIEWER_A);

    const currentAgent = agents[selectedAgent];
    const config = AGENT_CONFIG[selectedAgent];

    // Helper to render status badge - Muted, professional colors
    const StatusBadge = ({ status }: { status: AgentStatus }) => {
        switch (status) {
            case AgentStatus.THINKING:
                return (
                    <span className="flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        分析中
                    </span>
                );
            case AgentStatus.COMPLETED:
                return (
                    <span className="flex items-center text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                        已完成
                    </span>
                );
            case AgentStatus.ERROR:
                return (
                    <span className="flex items-center text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        异常
                    </span>
                );
            default:
                return (
                    <span className="flex items-center text-[11px] font-medium text-zinc-400 px-2.5 py-1">
                        待机
                    </span>
                );
        }
    };

    return (
        <div className="flex h-full bg-background rounded-2xl overflow-hidden border border-border/40 shadow-sm">
            {/* Left Sidebar: Agent List */}
            <div className="w-64 flex-shrink-0 bg-muted/20 border-r border-border/40 flex flex-col">
                <div className="p-4 border-b border-border/40">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">评审委员会</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {([AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C, AgentType.SYNTHESIZER] as AgentType[])
                        .map((type) => {
                            const agent = agents[type];
                            const conf = AGENT_CONFIG[type];
                            const isSelected = selectedAgent === type;
                            const Icon = conf.icon;

                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedAgent(type)}
                                    className={cn(
                                        "w-full text-left flex items-start p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                        isSelected
                                            ? "bg-background shadow-sm ring-1 ring-border"
                                            : "hover:bg-background/50 hover:shadow-sm"
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}

                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 transition-colors",
                                        isSelected ? conf.bg + " " + conf.color : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={cn("text-sm font-semibold truncate", isSelected ? "text-foreground" : "text-zinc-600")}>
                                                {conf.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate mb-1.5">{conf.role}</div>
                                        <StatusBadge status={agent.status} />
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </div>

            {/* Right Content: Report View */}
            <div className="flex-1 flex flex-col min-w-0 bg-background/50 backdrop-blur-sm">
                {/* Header */}
                <div className="h-16 px-8 flex items-center justify-between border-b border-border/40 bg-background/50">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg, config.color)}>
                            <config.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-foreground">{config.name}</h1>
                            <p className="text-xs text-muted-foreground">{config.role}</p>
                        </div>
                    </div>
                    <StatusBadge status={currentAgent.status} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedAgent}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-3xl mx-auto"
                        >
                            {currentAgent.content ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-6 pb-2 border-b border-border text-primary flex items-center gap-2" {...props} />,
                                        h2: ({ node, ...props }) => (
                                            <div className="mt-8 mb-4 flex items-center gap-2">
                                                <div className="h-6 w-1 bg-primary rounded-full" />
                                                <h2 className="text-lg font-bold text-foreground" {...props} />
                                            </div>
                                        ),
                                        h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-4 mb-2 text-zinc-700 dark:text-zinc-300" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-4 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1 text-zinc-600 dark:text-zinc-400 text-sm" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1 text-zinc-600 dark:text-zinc-400 text-sm" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <div className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-r-lg my-6 text-sm text-zinc-700 dark:text-zinc-300 italic relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                                    <Bot className="w-12 h-12" />
                                                </div>
                                                <blockquote {...props} />
                                            </div>
                                        ),
                                        table: ({ node, ...props }) => (
                                            <div className="overflow-x-auto my-6 rounded-lg border border-border">
                                                <table className="min-w-full divide-y divide-border text-sm" {...props} />
                                            </div>
                                        ),
                                        th: ({ node, ...props }) => <th className="bg-muted/50 px-4 py-3 text-left font-medium text-muted-foreground" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-4 py-3 border-t border-border/50 text-zinc-600 dark:text-zinc-400" {...props} />,
                                        code: ({ node, inline, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !inline ? (
                                                <pre className="bg-zinc-900 text-zinc-50 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono">
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                </pre>
                                            ) : (
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary font-medium" {...props}>
                                                    {children}
                                                </code>
                                            )
                                        },
                                        // Bold text - only apply red to warning keywords
                                        strong: ({ node, children, ...props }) => {
                                            const text = String(children);
                                            // Apply red only to warning/negative content
                                            const isWarning = /不符合|不合格|不推荐|不通过|高风险|严重|缺失|不足|超标|不满足|警告|问题|风险/.test(text);
                                            return (
                                                <strong
                                                    className={isWarning
                                                        ? "font-bold text-red-600 dark:text-red-400"
                                                        : "font-bold text-zinc-900 dark:text-zinc-100"
                                                    }
                                                    {...props}
                                                >
                                                    {children}
                                                </strong>
                                            );
                                        },
                                        em: ({ node, ...props }) => (
                                            <em className="italic text-zinc-700 dark:text-zinc-300" {...props} />
                                        ),
                                    }}
                                >
                                    {currentAgent.content}
                                </ReactMarkdown>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    {currentAgent.status === AgentStatus.THINKING ? (
                                        <>
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                                <div className="bg-background relative p-4 rounded-full border shadow-sm">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                </div>
                                            </div>
                                            <h3 className="mt-6 text-lg font-medium text-foreground">AI 专家正在深度分析中</h3>
                                            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                                                正在阅读申报材料并撰写专业评审意见，请稍候...
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
                                                <config.icon className="w-8 h-8 opacity-50" />
                                            </div>
                                            <h3 className="text-lg font-medium text-muted-foreground">暂无评审内容</h3>
                                            <p className="text-sm text-muted-foreground/60 mt-1">请点击左侧“启动独立评审”开始工作</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ReviewDashboard;
