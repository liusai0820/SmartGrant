/**
 * @file SplitExpertView.tsx
 * @input agents (评审专家结果记录)
 * @output 分屏多专家观点对比视图
 * @pos 核心交互组件 - 支持同时查看多位专家的评审意见
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Columns2,
    Columns3,
    Scale,
    BrainCircuit,
    Bot,
    CheckCircle2,
    Loader2,
    AlertCircle,
    UserCircle,
    MoreHorizontal,
    UserPlus,
    FileText,
    RefreshCw,
    Trash2,
    ShieldAlert,
    GraduationCap,
    TrendingUp,
    BookOpen
} from 'lucide-react';
import { AgentResult, AgentStatus, AgentType } from '@/types';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SplitExpertViewProps {
    agents: Record<AgentType, AgentResult>;
    onClose?: () => void;
}

const EXPERT_CONFIG = {
    [AgentType.REVIEWER_A]: {
        name: '专家 A',
        fullName: '评审专家 A',
        role: '合规与风险',
        institution: '某985高校/深圳研究院',
        title: '教授/博导',
        tags: ['政策合规', '风险控制', '财务审计'],
        hIndex: 45,
        icon: Scale,
        color: 'text-blue-600',
        borderColor: 'border-blue-200',
        bgColor: 'bg-blue-50',
    },
    [AgentType.REVIEWER_B]: {
        name: '专家 B',
        fullName: '评审专家 B',
        role: '技术与创新',
        institution: '中科院计算所',
        title: '研究员',
        tags: ['人工智能', '算法架构', '前沿技术'],
        hIndex: 52,
        icon: BrainCircuit,
        color: 'text-purple-600',
        borderColor: 'border-purple-200',
        bgColor: 'bg-purple-50',
    },
    [AgentType.REVIEWER_C]: {
        name: '专家 C',
        fullName: '评审专家 C',
        role: '商业与落地',
        institution: '知名创投机构',
        title: '合伙人',
        tags: ['商业模式', '市场分析', '产业化'],
        hIndex: 18,
        icon: Bot,
        color: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
    },
};

const SplitExpertView: React.FC<SplitExpertViewProps> = ({ agents, onClose }) => {
    // 默认展示3列
    const [selectedExperts, setSelectedExperts] = useState<AgentType[]>([
        AgentType.REVIEWER_A,
        AgentType.REVIEWER_B,
        AgentType.REVIEWER_C
    ]);
    const [columns, setColumns] = useState<2 | 3>(3);

    // 交互状态
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteType, setInviteType] = useState<'ai' | 'human'>('ai');

    // 专家资料弹窗
    const [viewingProfile, setViewingProfile] = useState<AgentType | null>(null);

    // 本地状态模拟 (用于重新生成/移除效果)
    const [localAgentStatus, setLocalAgentStatus] = useState<Record<string, AgentStatus>>({});

    // 初始化状态
    useEffect(() => {
        const initialStatus: Record<string, AgentStatus> = {};
        Object.keys(agents).forEach(key => {
            initialStatus[key] = agents[key as AgentType].status;
        });
        setLocalAgentStatus(initialStatus);
    }, [agents]);

    const toggleExpert = (type: AgentType) => {
        if (selectedExperts.includes(type)) {
            // Remove
            if (selectedExperts.length > 1) {
                setSelectedExperts(selectedExperts.filter(t => t !== type));
            }
        } else {
            // Add
            if (selectedExperts.length < columns) {
                setSelectedExperts([...selectedExperts, type]);
            } else {
                // Replace last one
                setSelectedExperts([...selectedExperts.slice(0, -1), type]);
            }
        }
    };

    const handleInviteExpert = () => {
        setIsInviteDialogOpen(false);
        // 模拟：如果有未显示的专家，添加进来；否则重置一个已移除的
        const availableTypes = Object.values(AgentType).filter(
            t => [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C].includes(t) && !selectedExperts.includes(t)
        );

        if (availableTypes.length > 0) {
            toggleExpert(availableTypes[0]);
            // 模拟Toast
            // toast.success("专家已加入评审团");
        } else {
            alert("所有可用 AI 专家均已在席");
        }
    };

    const handleRegenerate = (type: AgentType) => {
        // 模拟重新生成
        setLocalAgentStatus(prev => ({ ...prev, [type]: AgentStatus.THINKING }));
        setTimeout(() => {
            setLocalAgentStatus(prev => ({ ...prev, [type]: AgentStatus.COMPLETED }));
        }, 3000);
    };

    const handleRemove = (type: AgentType) => {
        if (selectedExperts.length <= 1) {
            alert("至少保留一位评审专家");
            return;
        }
        setSelectedExperts(prev => prev.filter(t => t !== type));
    };

    const StatusBadge = ({ status }: { status: AgentStatus }) => {
        switch (status) {
            case AgentStatus.THINKING:
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-blue-600/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        分析中
                    </span>
                );
            case AgentStatus.COMPLETED:
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-emerald-600/20">
                        <CheckCircle2 className="w-3 h-3" />
                        已完成
                    </span>
                );
            case AgentStatus.ERROR:
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-red-600/20">
                        <AlertCircle className="w-3 h-3" />
                        异常
                    </span>
                );
            default:
                return (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">待机</span>
                );
        }
    };

    return (
        <div className="flex flex-col w-full">
            {/* 顶部工具栏 */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border/50 transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <UserCircle className="w-5 h-5 text-primary" />
                            专家观点对比
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            {Object.entries(EXPERT_CONFIG).map(([type, config]) => {
                                const isSelected = selectedExperts.includes(type as AgentType);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => toggleExpert(type as AgentType)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                            isSelected
                                                ? cn("bg-primary/10 text-primary ring-1 ring-primary/20", config.color)
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        {/* @ts-ignore */}
                                        <config.icon className="w-3.5 h-3.5" />
                                        {config.name}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setIsInviteDialogOpen(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-dashed border-border ml-2 transition-colors"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                邀请专家
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                        <button
                            onClick={() => {
                                setColumns(2);
                                if (selectedExperts.length > 2) setSelectedExperts(selectedExperts.slice(0, 2));
                            }}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                columns === 2 ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="双栏对比"
                        >
                            <Columns2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setColumns(3)}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                columns === 3 ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="三栏概览"
                        >
                            <Columns3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 分栏内容区域 */}
            <div className="p-6">
                <div className={cn(
                    "grid gap-6 items-start",
                    columns === 2 ? "grid-cols-2" : "grid-cols-3"
                )}>
                    <AnimatePresence mode="popLayout">
                        {selectedExperts.slice(0, columns).map((type) => {
                            const agent = agents[type];
                            const config = EXPERT_CONFIG[type as keyof typeof EXPERT_CONFIG];
                            if (!config) return null;
                            const Icon = config.icon;
                            const currentStatus = localAgentStatus[type] || agent.status;

                            return (
                                <motion.div
                                    key={type}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-visible"
                                >
                                    {/* 专家卡片头部 */}
                                    <div className={cn("flex-none px-6 py-5 border-b border-border/60 bg-gradient-to-br via-transparent to-transparent from-opacity-20",
                                        type === AgentType.REVIEWER_A ? "from-blue-50/50" :
                                            type === AgentType.REVIEWER_B ? "from-purple-50/50" : "from-emerald-50/50"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={cn("p-3 rounded-xl shadow-sm ring-1 ring-inset ring-black/5 cursor-pointer hover:scale-105 transition-transform", config.bgColor)}
                                                    onClick={() => setViewingProfile(type as AgentType)}
                                                >
                                                    <Icon className={cn("w-6 h-6", config.color)} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-foreground flex items-center gap-2 cursor-pointer hover:underline" onClick={() => setViewingProfile(type as AgentType)}>
                                                        {config.fullName}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{config.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <StatusBadge status={currentStatus} />

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-black/5 rounded-md transition-colors outline-none">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>专家操作</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => setViewingProfile(type as AgentType)}>
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            查看详细资料
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleRegenerate(type as AgentType)}>
                                                            <RefreshCw className="w-4 h-4 mr-2" />
                                                            重新生成意见
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            onClick={() => handleRemove(type as AgentType)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            移除此专家
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 内容区 */}
                                    <div className="p-6 bg-white safe-areas min-h-[500px]">
                                        {currentStatus === AgentStatus.THINKING ? (
                                            <div className="h-60 flex flex-col items-center justify-center space-y-4 pt-12">
                                                <div className={cn("p-4 rounded-full bg-muted/30 animate-pulse", config.color)}>
                                                    <Loader2 className="w-10 h-10 animate-spin" />
                                                </div>
                                                <div className="text-center space-y-1">
                                                    <p className="text-sm font-medium text-foreground">专家正在审阅材料...</p>
                                                    <p className="text-xs text-muted-foreground">正在分析技术路线可行性</p>
                                                </div>
                                            </div>
                                        ) : agent.content ? (
                                            <div className="prose prose-sm prose-slate max-w-none 
                                              prose-headings:font-bold prose-headings:tracking-tight 
                                              prose-h1:text-xl prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b
                                              prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-h2:flex prose-h2:items-center
                                              prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-3
                                              prose-li:text-slate-600 prose-li:my-1.5
                                              prose-strong:text-slate-900 prose-strong:font-semibold
                                              prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                                            ">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        h2: ({ node, ...props }) => (
                                                            <div className="flex items-center gap-3 mt-8 mb-4 group pb-2 border-b border-dashed border-border/60">
                                                                <div className={cn("w-1.5 h-6 rounded-full", config.bgColor.replace('bg-', 'bg-').replace('-50', '-500'))}></div>
                                                                <h2 className="text-lg font-bold text-slate-900 m-0" {...props} />
                                                            </div>
                                                        ),
                                                        table: ({ node, ...props }) => (
                                                            <div className="not-prose overflow-x-auto my-6 rounded-lg border border-border bg-slate-50/30">
                                                                <table className="min-w-full divide-y divide-border text-sm" {...props} />
                                                            </div>
                                                        ),
                                                        th: ({ node, ...props }) => (
                                                            <th className="bg-muted/40 px-4 py-3 text-left font-semibold text-slate-700 w-1/4" {...props} />
                                                        ),
                                                        td: ({ node, ...props }) => (
                                                            <td className="px-4 py-3 border-t border-border/50 text-slate-600 vertical-align-top leading-relaxed" {...props} />
                                                        ),
                                                        strong: ({ node, children, ...props }) => {
                                                            const text = String(children);
                                                            const isNegative = /不符合|不合格|不推荐|高风险|严重|缺失|不足|未满足|拒绝/.test(text);
                                                            const isPositive = /符合|合格|推荐|通过|低风险|优势|充足|满足/.test(text);

                                                            return (
                                                                <strong className={cn(
                                                                    "font-semibold px-1.5 py-0.5 rounded text-[0.95em]",
                                                                    isNegative ? "text-red-700 bg-red-50 ring-1 ring-red-100" :
                                                                        isPositive ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100" :
                                                                            "text-slate-900 bg-slate-100"
                                                                )} {...props}>
                                                                    {children}
                                                                </strong>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {agent.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="h-40 flex flex-col items-center justify-center p-8 opacity-50 pt-12">
                                                <Icon className="w-12 h-12 mb-4 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">暂无评审内容</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* 邀请专家对话框 */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>邀请新的评审专家</DialogTitle>
                        <DialogDescription>
                            添加一位新的专家到评审团，以获得更多维度的意见。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setInviteType('ai')}
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2",
                                    inviteType === 'ai' ? "border-primary bg-primary/5" : "border-muted"
                                )}
                            >
                                <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div className="font-semibold">AI 智能专家</div>
                                <div className="text-xs text-muted-foreground">基于特定角色的 AI 代理</div>
                            </div>

                            <div
                                onClick={() => setInviteType('human')}
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2",
                                    inviteType === 'human' ? "border-primary bg-primary/5" : "border-muted"
                                )}
                            >
                                <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div className="font-semibold">邀请外部专家</div>
                                <div className="text-xs text-muted-foreground">生成链接邀请真人评审</div>
                            </div>
                        </div>

                        {inviteType === 'ai' && (
                            <div className="space-y-3">
                                <label className="text-sm font-medium">设定专家角色</label>
                                <input
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="例如：财务审计专家、行业资深从业者..."
                                />
                            </div>
                        )}

                        {inviteType === 'human' && (
                            <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs flex gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                外部专家只能查看经过脱敏处理的项目信息。
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <button
                            onClick={() => setIsInviteDialogOpen(false)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleInviteExpert}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                        >
                            确认添加
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 专家详情弹窗 (Mock Data) */}
            <Dialog open={!!viewingProfile} onOpenChange={(open) => !open && setViewingProfile(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>专家详细资料</DialogTitle>
                    </DialogHeader>
                    {viewingProfile && EXPERT_CONFIG[viewingProfile] && (
                        <div className="space-y-6">
                            <div className="flex items-start gap-6">
                                <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center shadow-inner", EXPERT_CONFIG[viewingProfile].bgColor)}>
                                    {/* @ts-ignore */}
                                    {React.createElement(EXPERT_CONFIG[viewingProfile].icon, {
                                        className: cn("w-12 h-12", EXPERT_CONFIG[viewingProfile].color)
                                    })}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">{EXPERT_CONFIG[viewingProfile].fullName}</h2>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <GraduationCap className="w-4 h-4" />
                                        <span>{EXPERT_CONFIG[viewingProfile].title}</span>
                                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                        <span>{EXPERT_CONFIG[viewingProfile].institution}</span>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        {EXPERT_CONFIG[viewingProfile].tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/50">
                                <div className="text-center p-3 rounded-lg bg-muted/20">
                                    <div className="text-2xl font-bold text-foreground">{EXPERT_CONFIG[viewingProfile].hIndex}</div>
                                    <div className="text-xs text-muted-foreground mt-1">H-Index (学术影响力)</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/20">
                                    <div className="text-2xl font-bold text-foreground">128</div>
                                    <div className="text-xs text-muted-foreground mt-1">累计评审项目</div>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-muted/20">
                                    <div className="text-2xl font-bold text-foreground">98%</div>
                                    <div className="text-xs text-muted-foreground mt-1">采纳率</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    主要研究领域
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {viewingProfile === AgentType.REVIEWER_B
                                        ? "长期从事人工智能与深度学习算法研究，在计算机视觉、自然语言处理等领域发表顶级会议论文50余篇。近年来专注于大模型在工业垂直领域的落地应用研究。"
                                        : viewingProfile === AgentType.REVIEWER_A
                                            ? "专注于科技政策合规性审查与风险评估，曾参与多项国家级重点研发计划的财务验收与绩效评估工作，对科研经费管理办法有深入研究。"
                                            : "拥有15年硬科技领域投资经验，主导投资了超过20家早期科技企业，其中5家成功上市。擅长判断技术早期的商业价值与市场化路径。"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    评审风格
                                </h3>
                                <div className="flex gap-4">
                                    <div className="flex-1 p-3 rounded-lg border border-border/50 bg-background">
                                        <div className="text-xs text-muted-foreground mb-1">严谨度</div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-3 rounded-lg border border-border/50 bg-background">
                                        <div className="text-xs text-muted-foreground mb-1">创新偏好</div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: viewingProfile === AgentType.REVIEWER_B ? '95%' : '60%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SplitExpertView;
