'use client';

import { useState, useEffect, useCallback } from 'react';
import ProjectSidebar from '@/components/ProjectSidebar';
import Navbar from '@/components/Navbar';
import InputSection from '@/components/InputSection';
import AgentCard from '@/components/AgentCard';
import FinalReport from '@/components/FinalReport';
import ChatSection from '@/components/ChatSection';
import ReviewDashboard from '@/components/ReviewDashboard'; // Import new component
import ExpertSelection from '@/components/ExpertSelection';
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

export default function Home() {
  const [projects, setProjects] = useState<{ id: string; name: string; updated_at: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectState | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'report' | 'chat' | 'expert'>('agents');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载
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

  // 加载活动项目详情
  useEffect(() => {
    if (!activeProjectId) return;

    const loadProject = async () => {
      const project = await loadFullProject(activeProjectId);
      if (project) {
        setActiveProject(project);
      }
    };
    loadProject();
  }, [activeProjectId]);

  // 创建新项目
  const handleCreateProject = async () => {
    const newProject = await createProject(`新项目 ${new Date().toLocaleDateString()}`);
    if (newProject) {
      setProjects(prev => [{
        id: newProject.id,
        name: newProject.name,
        updated_at: newProject.updated_at
      }, ...prev]);
      setActiveProjectId(newProject.id);
      setActiveTab('agents');
    }
  };

  // 删除项目
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

  // 更新项目名称
  const handleUpdateProjectName = async (name: string) => {
    if (!activeProjectId || !activeProject) return;
    await updateProject(activeProjectId, { name });
    setActiveProject(prev => prev ? { ...prev, name } : null);
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, name } : p
    ));
  };

  // 更新材料 + 自动提取项目元数据
  const handleUpdateMaterials = async (materials: FileInput[]) => {
    if (!activeProjectId || !activeProject) return;
    await saveMaterials(activeProjectId, materials, 'material');
    setActiveProject(prev => prev ? { ...prev, materials } : null);

    // 如果项目名称还是默认的"新项目"格式，尝试从材料中自动提取
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
            // 更新项目名称
            await handleUpdateProjectName(data.fullName);
            console.log('[自动提取] 项目名称已更新:', data.fullName);
          }
        }
      } catch (error) {
        console.error('[自动提取] 元数据提取失败:', error);
      }
    }
  };

  // 更新指南
  const handleUpdateGuidelines = async (guidelines: FileInput[]) => {
    if (!activeProjectId || !activeProject) return;
    await saveMaterials(activeProjectId, guidelines, 'guideline');
    setActiveProject(prev => prev ? { ...prev, guidelines } : null);
  };

  // State for sidebar collapse
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  // 启动评审
  const startReview = useCallback(async () => {
    if (!activeProject || !activeProjectId) return;

    setIsAnalyzing(true);
    setActiveTab('agents');

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
      console.log('[Frontend] Review API Response:', result);

      // Update state from API response - even if success is false, we may have partial results
      if (result.reviews) {
        setActiveProject(prev => {
          if (!prev) return null;
          const newAgents = { ...prev.agents };

          // Update Reviewers
          result.reviews.forEach((r: any) => {
            newAgents[r.type as AgentType] = {
              ...newAgents[r.type as AgentType],
              status: r.status || AgentStatus.COMPLETED,
              content: r.content,
              error: r.error
            };
          });

          // Update Synthesizer
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
          setActiveTab('report');
          setIsInputCollapsed(true); // Auto collapse input section on efficiency
        }
      }
    } catch (error) {
      console.error('Review error:', error);
      // ERROR HANDLING: Reset status if API call fails entirely
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

  // 专家遴选
  const startExpertSelection = async () => {
    if (!activeProject || !activeProjectId) return;

    // 更新状态
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-500">正在初始化项目...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden text-foreground selection:bg-primary/10 selection:text-primary">
      {/* Sidebar */}
      <ProjectSidebar
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          updatedAt: new Date(p.updated_at).getTime(),
          materialsCount: 0,
        }))}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
      />

      <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
        <Navbar
          projectName={activeProject.name}
          updatedAt={activeProject.updatedAt}
          onUpdateName={handleUpdateProjectName}
          onToggleSidebar={() => setIsInputCollapsed(!isInputCollapsed)}
          isSidebarCollapsed={isInputCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden px-6 py-6 max-w-[1920px] mx-auto w-full">
          <div className="flex gap-6 h-full">
            {/* Left Column: Input */}
            <div className={`transition-all duration-300 ease-in-out h-full overflow-hidden ${isInputCollapsed ? 'w-0 opacity-0' : 'w-full lg:w-1/3 xl:w-1/4 min-w-[350px] opacity-100'
              }`}>
              <InputSection
                proposalInputs={activeProject.materials}
                setProposalInputs={handleUpdateMaterials}
                guidelinesInputs={activeProject.guidelines}
                setGuidelinesInputs={handleUpdateGuidelines}
                onStartReview={startReview}
                isAnalyzing={isAnalyzing}
              />
            </div>

            {/* Right Column: Output */}
            <div className="flex-1 h-full min-w-0 flex flex-col rounded-2xl border border-border/40 overflow-hidden bg-muted/10">
              {/* Tabs */}
              <div className="flex items-center space-x-1 border-b border-border/40 bg-background p-1.5 backdrop-blur z-10">
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'agents'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  专家评审团
                </button>
                <button
                  onClick={() => setActiveTab('report')}
                  disabled={activeProject.agents[AgentType.SYNTHESIZER].status !== AgentStatus.COMPLETED}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'report'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                  综合决议
                </button>
                <button
                  onClick={() => setActiveTab('expert')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'expert'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  专家遴选
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'chat'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  AI 助手
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'agents' && (
                  <div className="h-full bg-background p-4">
                    <ReviewDashboard agents={activeProject.agents} />
                  </div>
                )}

                {activeTab === 'report' && (
                  <div className="h-full pb-2 bg-background">
                    <FinalReport
                      agent={activeProject.agents[AgentType.SYNTHESIZER]}
                      projectName={activeProject.name}
                    />
                  </div>
                )}

                {activeTab === 'expert' && (
                  <div className="h-full pb-2 bg-background">
                    <ExpertSelection
                      agent={activeProject.agents[AgentType.EXPERT_HUNTER]}
                      proposals={activeProject.materials}
                      onStartSelection={startExpertSelection}
                      projectName={activeProject.name}
                    />
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="h-full pb-2 bg-background">
                    <ChatSection
                      projectId={activeProjectId!}
                      proposalInputs={activeProject.materials}
                      guidelinesInputs={activeProject.guidelines}
                      finalReportContent={activeProject.agents[AgentType.SYNTHESIZER].content}
                      chatHistory={activeProject.chatHistory}
                      onUpdateHistory={(msgs) =>
                        setActiveProject(prev => prev ? { ...prev, chatHistory: msgs } : null)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
