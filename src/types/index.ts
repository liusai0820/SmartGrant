// ===========================================
// 核心类型定义
// ===========================================

export enum AgentStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum AgentType {
  REVIEWER_A = 'REVIEWER_A',
  REVIEWER_B = 'REVIEWER_B',
  REVIEWER_C = 'REVIEWER_C',
  SYNTHESIZER = 'SYNTHESIZER',
  EXPERT_HUNTER = 'EXPERT_HUNTER',
}

export interface FileInput {
  id: string;
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  fileName?: string;
  timestamp: number;
}

export interface AgentResult {
  type: AgentType;
  title: string;
  description: string;
  content: string;
  status: AgentStatus;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// 数据库模型 (对应 Supabase 表结构)
export interface Project {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMaterial {
  id: string;
  project_id: string;
  type: 'material' | 'guideline';
  file_type: 'text' | 'file';
  content: string;
  mime_type?: string;
  file_name?: string;
  created_at: string;
}

export interface ReviewResult {
  id: string;
  project_id: string;
  agent_type: AgentType;
  status: AgentStatus;
  content?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistory {
  id: string;
  project_id: string;
  role: 'user' | 'model';
  text: string;
  created_at: string;
}

// 前端状态类型 (兼容旧结构)
export interface ProjectState {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  materials: FileInput[];
  guidelines: FileInput[];
  agents: Record<AgentType, AgentResult>;
  chatHistory: ChatMessage[];
}

export const INITIAL_AGENTS_STATE: Record<AgentType, AgentResult> = {
  [AgentType.REVIEWER_A]: {
    type: AgentType.REVIEWER_A,
    title: '评审专家 A',
    description: '独立进行全方位评审，侧重于风险控制与合规细节',
    content: '',
    status: AgentStatus.IDLE,
  },
  [AgentType.REVIEWER_B]: {
    type: AgentType.REVIEWER_B,
    title: '评审专家 B',
    description: '独立进行全方位评审，侧重于技术创新性与应用前景',
    content: '',
    status: AgentStatus.IDLE,
  },
  [AgentType.REVIEWER_C]: {
    type: AgentType.REVIEWER_C,
    title: '评审专家 C',
    description: '独立进行全方位评审，侧重于团队资质与资源保障',
    content: '',
    status: AgentStatus.IDLE,
  },
  [AgentType.SYNTHESIZER]: {
    type: AgentType.SYNTHESIZER,
    title: '首席评审官',
    description: '汇总三份独立评审意见，进行交叉验证，生成最终决议',
    content: '',
    status: AgentStatus.IDLE,
  },
  [AgentType.EXPERT_HUNTER]: {
    type: AgentType.EXPERT_HUNTER,
    title: '智能专家遴选',
    description: '基于项目技术领域，全网搜索并推荐匹配的权威专家',
    content: '',
    status: AgentStatus.IDLE,
  },
};
