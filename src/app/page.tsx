/**
 * @file page.tsx
 * @input 所有子组件, db 函数, types, 新布局组件
 * @output 主页面组件 - SmartGrant 专业评审工作台
 * @pos 应用入口层 - 编排所有组件，管理全局状态，调度 API 请求
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProjectSidebar from '@/components/ProjectSidebar';
import InputSection from '@/components/InputSection';
import FinalReport from '@/components/FinalReport';
import ChatSection from '@/components/ChatSection';
import ReviewDashboard from '@/components/ReviewDashboard';
import ExpertSelection from '@/components/ExpertSelection';
import WorkflowStepper, { WorkflowStage } from '@/components/WorkflowStepper';
import ProjectHeader from '@/components/ProjectHeader';
import SplitExpertView from '@/components/SplitExpertView';
import ProjectsDashboard from '@/components/ProjectsDashboard';
import {
  ProjectState,
  AgentType,
  AgentStatus,
  INITIAL_AGENTS_STATE,
  FileInput
} from '@/types';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject as deleteProjectFromDB,
  loadFullProject,
  saveMaterials
} from '@/lib/db';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Sparkles,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  // ══════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════
  const [projects, setProjects] = useState<{ id: string; name: string; updated_at: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 布局状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 工作流阶段 (UI 状态)
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('prepare');

  // 实际完成的阶段 (数据状态)
  const [completedStages, setCompletedStages] = useState<WorkflowStage[]>([]);

  // 视图模式：dashboard (项目看板) 或 workspace (工作区)
  const [viewMode, setViewMode] = useState<'dashboard' | 'workspace'>('workspace');

  // ══════════════════════════════════════════════════════════════
  // 核心计算逻辑：自动推导当前项目的状态
  // ══════════════════════════════════════════════════════════════
  const computedProjectStatus = useMemo((): WorkflowStage => {
    if (!activeProject) return 'prepare';

    const hasMaterials = activeProject.materials.length > 0;
    const hasGuidelines = activeProject.guidelines.length > 0;
    const synthesizerCompleted = activeProject.agents[AgentType.SYNTHESIZER]?.status === AgentStatus.COMPLETED;
    const anyReviewerThinking = [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C]
      .some(t => activeProject.agents[t]?.status === AgentStatus.THINKING);
    const anyReviewerCompleted = [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C]
      .some(t => activeProject.agents[t]?.status === AgentStatus.COMPLETED);

    if (synthesizerCompleted) return 'complete'; // 也可以映射到 synthesis
    if (anyReviewerThinking) return 'review';
    // 只要有评审结果，且没有开始最后的综合，依然是在 review 阶段
    if (anyReviewerCompleted && !synthesizerCompleted) return 'review';
    if (isAnalyzing) return 'review';

    // 如果专家猎头已完成或正在思考，进入 selection 阶段
    const hunterStatus = activeProject.agents[AgentType.EXPERT_HUNTER]?.status;
    if (hunterStatus === AgentStatus.COMPLETED || hunterStatus === AgentStatus.THINKING) {
      // 如果还没开始评审，才停留在 selection。一旦开始评审了(anyReviewerThinking)，就去 review 了
      if (!anyReviewerThinking && !anyReviewerCompleted) {
        return 'selection';
      }
    }

    // 如果有材料和指南，准备工作就算初步完成，可以进入 selection
    // 这里我们保持 prepare，直到用户点击“开始评审”
    return 'prepare';
  }, [activeProject, isAnalyzing]);

  // 监听项目状态变化，更新已完成阶段
  useEffect(() => {
    const newCompleted: WorkflowStage[] = [];
    if (activeProject?.materials.length && activeProject?.guidelines.length) {
      newCompleted.push('prepare');
    }
    if ([AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C]
      .some(t => activeProject?.agents[t]?.status === AgentStatus.COMPLETED)) {
      newCompleted.push('review');
    }
    if (activeProject?.agents[AgentType.SYNTHESIZER]?.status === AgentStatus.COMPLETED) {
      newCompleted.push('synthesis', 'complete');
    }
    // 简单的阶段完成判断：有上传文件 -> prepare 完成
    if (activeProject?.materials?.length > 0 && activeProject?.guidelines?.length > 0) {
      if (!newCompleted.includes('prepare')) newCompleted.push('prepare');
    }
    // 专家猎头完成 -> selection 完成
    if (activeProject?.agents[AgentType.EXPERT_HUNTER]?.status === AgentStatus.COMPLETED) {
      if (!newCompleted.includes('selection')) newCompleted.push('selection');
    }

    setCompletedStages(newCompleted);

    // 只有在第一次加载或者状态发生重大变更时，才自动跳转当前阶段
    // 我们这里做一个策略：如果是刚加载项目，跳到最新进度
    // 如果是用户自己在点，就不乱跳
    // 简化策略：加载项目时，根据 status 设定 currentStage
  }, [activeProject]);

  // ══════════════════════════════════════════════════════════════
  // 初始化和数据加载
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const init = async () => {
      try {
        const loadedProjects = await getProjects();
        if (loadedProjects.length > 0) {
          setProjects(loadedProjects.map(p => ({
            id: p.id,
            name: p.name,
            updated_at: p.updated_at
          })));
          setActiveProjectId(loadedProjects[0].id);
        } else {
          await handleCreateProject();
        }
      } catch (e) {
        console.error('Failed to load projects', e);
        await handleCreateProject();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;

    const loadProject = async () => {
      const project = await loadFullProject(activeProjectId);
      if (project) {
        setActiveProject(project);

        // 加载项目时，自动定位到合适的阶段
        // 规则：
        // 1. 如果还在草稿，去 prepare
        // 2. 如果正在评审或有评审结果，去 review
        // 3. 如果已经有总结报告，去 synthesis
        const synthesizerCompleted = project.agents[AgentType.SYNTHESIZER]?.status === AgentStatus.COMPLETED;
        const hasReviewResults = [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C]
          .some(t => project.agents[t]?.status === AgentStatus.COMPLETED);

        if (synthesizerCompleted) {
          setCurrentStage('synthesis');
        } else if (hasReviewResults) {
          setCurrentStage('review');
        } else if (project.agents[AgentType.EXPERT_HUNTER]?.status === AgentStatus.COMPLETED) {
          // 如果专家已经选好了，去专家页或者直接去评审页？
          // 这里假设用户可能想确认专家，所以去 selection
          setCurrentStage('selection');
        } else {
          setCurrentStage('prepare');
        }
      }
    };
    loadProject();
  }, [activeProjectId]);

  // ══════════════════════════════════════════════════════════════
  // 项目 CRUD 操作
  // ══════════════════════════════════════════════════════════════
  const handleCreateProject = async () => {
    const newProject = await createProject(`新项目 ${new Date().toLocaleDateString()}`);
    if (newProject) {
      setProjects(prev => [{
        id: newProject.id,
        name: newProject.name,
        updated_at: newProject.updated_at
      }, ...prev]);
      setActiveProjectId(newProject.id);
      setCurrentStage('prepare'); // 新项目默认在准备阶段
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProjectFromDB(id);
    setProjects(prev => {
      const remaining = prev.filter(p => p.id !== id);
      if (activeProjectId === id && remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
      } else if (remaining.length === 0) {
        handleCreateProject();
      }
      return remaining;
    });
  };

  const handleUpdateProjectName = async (name: string) => {
    if (!activeProjectId || !activeProject) return;
    await updateProject(activeProjectId, { name });
    setActiveProject(prev => prev ? { ...prev, name } : null);
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, name } : p
    ));
  };

  // ══════════════════════════════════════════════════════════════
  // 材料管理
  // ══════════════════════════════════════════════════════════════
  const handleUpdateMaterials = async (materials: FileInput[]) => {
    if (!activeProjectId || !activeProject) return;
    await saveMaterials(activeProjectId, materials, 'material');
    setActiveProject(prev => prev ? { ...prev, materials } : null);

    // 自动提取项目元数据
    if (materials.length > 0 && activeProject.name.startsWith('新项目')) {
      try {
        const content = materials.map(m => m.content).join('\n');
        const response = await fetch('/api/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.slice(0, 5000) }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.fullName && data.fullName !== '新项目') {
            await handleUpdateProjectName(data.fullName);
          }
        }
      } catch (error) {
        console.error('[自动提取] 元数据提取失败:', error);
      }
    }
  };

  const handleUpdateGuidelines = async (guidelines: FileInput[]) => {
    if (!activeProjectId || !activeProject) return;
    await saveMaterials(activeProjectId, guidelines, 'guideline');
    setActiveProject(prev => prev ? { ...prev, guidelines } : null);
  };

  // ══════════════════════════════════════════════════════════════
  // 评审流程
  // ══════════════════════════════════════════════════════════════
  const startReview = useCallback(async () => {
    if (!activeProject || !activeProjectId) return;

    setIsAnalyzing(true);
    setCurrentStage('review'); // 切换视图到评审页面

    // 重置 agents 状态
    const resetAgents = JSON.parse(JSON.stringify(INITIAL_AGENTS_STATE));
    setActiveProject(prev => prev ? { ...prev, agents: resetAgents } : null);

    try {
      // 更新为 thinking 状态
      const thinkingAgents = { ...resetAgents };
      [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C].forEach(type => {
        thinkingAgents[type].status = AgentStatus.THINKING;
      });
      setActiveProject(prev => prev ? { ...prev, agents: thinkingAgents } : null);

      // 调用 API
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          materials: activeProject.materials,
          guidelines: activeProject.guidelines,
        }),
      });

      const result = await response.json();

      if (result.reviews) {
        setActiveProject(prev => {
          if (!prev) return null;
          const newAgents = { ...prev.agents };

          result.reviews.forEach((r: any) => {
            newAgents[r.type as AgentType] = {
              ...newAgents[r.type as AgentType],
              status: r.status || AgentStatus.COMPLETED,
              content: r.content,
              error: r.error
            };
          });

          if (result.finalReport) {
            newAgents[AgentType.SYNTHESIZER] = {
              ...newAgents[AgentType.SYNTHESIZER],
              status: result.finalReport.status || AgentStatus.COMPLETED,
              content: result.finalReport.content || result.finalReport
            };
          }

          return { ...prev, agents: newAgents };
        });

        if (result.success) {
          // 评审完成，但这不意味着流程结束，用户可能还想看评审结果
          // 只有当 synthesize 也完成了，才算真的 complete
          // 这里保持 currentStage 不变，让用户看结果
        }
      }
    } catch (error) {
      console.error('Review error:', error);
      setActiveProject(prev => {
        if (!prev) return null;
        const errorAgents = { ...prev.agents };
        [AgentType.REVIEWER_A, AgentType.REVIEWER_B, AgentType.REVIEWER_C, AgentType.SYNTHESIZER].forEach(type => {
          errorAgents[type].status = AgentStatus.ERROR;
        });
        return { ...prev, agents: errorAgents };
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeProject, activeProjectId]);

  // ══════════════════════════════════════════════════════════════
  // 专家遴选
  // ══════════════════════════════════════════════════════════════
  const startExpertSelection = async () => {
    if (!activeProject || !activeProjectId) return;

    setActiveProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        agents: {
          ...prev.agents,
          [AgentType.EXPERT_HUNTER]: {
            ...prev.agents[AgentType.EXPERT_HUNTER],
            status: AgentStatus.THINKING,
            content: '',
          },
        },
      };
    });

    try {
      const response = await fetch('/api/expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          materials: activeProject.materials,
        }),
      });

      const result = await response.json();

      setActiveProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          agents: {
            ...prev.agents,
            [AgentType.EXPERT_HUNTER]: {
              ...prev.agents[AgentType.EXPERT_HUNTER],
              status: result.success ? AgentStatus.COMPLETED : AgentStatus.ERROR,
              content: result.content || '',
              error: result.error,
            },
          },
        };
      });
    } catch (error: any) {
      setActiveProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          agents: {
            ...prev.agents,
            [AgentType.EXPERT_HUNTER]: {
              ...prev.agents[AgentType.EXPERT_HUNTER],
              status: AgentStatus.ERROR,
              error: error.message,
            },
          },
        };
      });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 加载状态
  // ══════════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">正在加载工作台...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 主渲染逻辑 - 根据 Stage 渲染不同页面
  // ══════════════════════════════════════════════════════════════
  const renderStageContent = () => {
    if (!activeProject) return null;

    switch (currentStage) {
      case 'prepare':
        // 准备阶段：宽屏上传区域
        return (
          <div className="flex flex-col items-center justify-start p-8 min-h-full">
            <div className="w-full max-w-[1600px] bg-card/60 backdrop-blur-sm rounded-xl border border-border/50 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">项目准备</h2>
                  <p className="text-muted-foreground">配置评审所需的申报材料与评审指南</p>
                </div>
              </div>
              <InputSection
                proposalInputs={activeProject.materials}
                setProposalInputs={handleUpdateMaterials}
                guidelinesInputs={activeProject.guidelines}
                setGuidelinesInputs={handleUpdateGuidelines}
                onStartReview={() => {
                  // 准备阶段完成，进入专家遴选
                  setCurrentStage('selection');
                }}
                isAnalyzing={false} // 准备阶段不进行分析
              />
            </div>
          </div>
        );

      case 'selection':
        return (
          <div className="flex flex-col items-center justify-start p-8 min-h-full">
            <div className="w-full max-w-[1600px] bg-card/60 rounded-xl border border-border/50 p-8 shadow-sm">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-1">专家遴选</h2>
                <p className="text-muted-foreground">系统根据材料自动匹配最合适的评审专家阵容</p>
              </div>
              <ExpertSelection
                agent={activeProject.agents[AgentType.EXPERT_HUNTER]}
                proposals={activeProject.materials}
                onStartSelection={startExpertSelection}
                projectName={activeProject.name}
              />

              {/* 提供一个进入下一阶段的按钮 */}
              {activeProject.agents[AgentType.EXPERT_HUNTER]?.status === AgentStatus.COMPLETED && (
                <div className="mt-8 flex justify-end border-t border-border/40 pt-6">
                  <button
                    onClick={() => startReview()}
                    className="btn btn-primary px-8 py-2.5 text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    确认阵容并开始评审
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        // 评审阶段：专家对比视图
        // 这里不需要额外的 padding，因为 SplitExpertView 内部会处理，或者我们给个基础容器
        // 重点：高度不再限制，允许页面滚动
        return (
          <div className="w-full min-h-full">
            <SplitExpertView agents={activeProject.agents} />
          </div>
        );

      case 'synthesis':
      case 'complete':
        // 决议阶段：综合报告
        // 如果没有生成报告，就显示生成按钮或者提示
        const hasReport = activeProject.agents[AgentType.SYNTHESIZER]?.status === AgentStatus.COMPLETED;
        return hasReport ? (
          <div className="h-full bg-muted/20">
            <FinalReport
              agent={activeProject.agents[AgentType.SYNTHESIZER]}
              projectName={activeProject.name}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">暂无决议报告</h3>
              <p className="text-muted-foreground mb-4">专家评审尚未完成或尚未生成综合决议，请先完成专家评审环节。</p>
              <button onClick={() => setCurrentStage('review')} className="btn btn-primary">
                查看评审进度
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  if (!activeProject) {
    return <div className="min-h-screen flex items-center justify-center">正在初始化项目...</div>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 侧边栏 */}
      <AnimatePresence mode="wait">
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full border-r border-border bg-sidebar overflow-hidden shrink-0"
          >
            <ProjectSidebar
              projects={projects.map(p => ({
                id: p.id,
                name: p.name,
                updatedAt: new Date(p.updated_at).getTime(),
                materialsCount: 0,
              }))}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                setViewMode('workspace');
              }}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onViewDashboard={() => setViewMode('dashboard')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 折叠按钮 */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={cn(
          "relative z-20 w-4 hover:w-6 transition-all h-12 self-center -ml-3 bg-card border border-border rounded-r-lg shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground",
          isSidebarCollapsed && "ml-0"
        )}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-background">
        {viewMode === 'dashboard' ? (
          <ProjectsDashboard
            projects={projects.map(p => ({
              id: p.id,
              name: p.name,
              updatedAt: new Date(p.updated_at).getTime(),
              createdAt: new Date(p.updated_at).getTime(),
              materialsCount: 0,
              guidelinesCount: 0,
              status: 'draft' as const,
            }))}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setViewMode('workspace');
            }}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          /* 工作区模式 */
          <>
            {/* 顶部导航栏：Header + Stepper */}
            <header className="sticky top-0 z-20 flex-none bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
              <div className="flex items-center justify-between px-6 py-3">
                <ProjectHeader
                  projectName={activeProject.name}
                  updatedAt={activeProject.updatedAt}
                  // currentStage={currentStage} // Removed as WorkflowStepper handles this
                  onUpdateName={handleUpdateProjectName}
                />

                {/* Stepper 直接嵌入 Header 右侧或中间 */}
                <WorkflowStepper
                  currentStage={currentStage}
                  completedStages={completedStages}
                  onStageClick={(stage) => setCurrentStage(stage)}
                  className="ml-auto"
                />
              </div>
            </header>

            {/* 核心内容区 - 允许页面整体滚动 */}
            <div className="flex-1 overflow-y-auto bg-muted/10 relative scroll-smooth">
              {renderStageContent()}
            </div>
          </>
        )}
      </div >

      {/* AI 助手部分保持不变... (因为篇幅原因和不需要改成这部分，略微简化展示，实际代码保留) */}
      <AnimatePresence>
        {
          isChatOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[600px] z-30 bg-card border-l border-border shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI 评审助手</h3>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="h-[calc(100%-65px)]">
                <ChatSection
                  projectId={activeProjectId!}
                  proposalInputs={activeProject!.materials}
                  guidelinesInputs={activeProject!.guidelines}
                  finalReportContent={activeProject!.agents[AgentType.SYNTHESIZER].content}
                  chatHistory={activeProject!.chatHistory}
                  onUpdateHistory={(msgs) =>
                    setActiveProject(prev => prev ? { ...prev, chatHistory: msgs } : null)
                  }
                />
              </div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed right-6 bottom-6 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}

      {/* 确保 InputSection 里面不要有自己的 overflow，而是在外部控制，或者 InputSection 内部自适应 */}
    </div >
  );
}
