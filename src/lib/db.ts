// ===========================================
// 数据库操作层 (Supabase)
// ===========================================

import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  Project,
  ProjectMaterial,
  ReviewResult,
  ChatHistory,
  ProjectState,
  FileInput,
  AgentType,
  AgentStatus,
  INITIAL_AGENTS_STATE,
  ChatMessage
} from '@/types';

// -------------------------------------------
// LocalStorage 备用方案 (当 Supabase 未配置时)
// -------------------------------------------

const STORAGE_KEYS = {
  PROJECTS: 'smartgrant_projects',
  MATERIALS: 'smartgrant_materials',
  RESULTS: 'smartgrant_results',
  CHAT: 'smartgrant_chat',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// -------------------------------------------
// 项目 CRUD
// -------------------------------------------

export async function createProject(name: string = '新项目'): Promise<Project | null> {
  if (!isSupabaseConfigured) {
    // LocalStorage 备用方案
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS) || [];
    const newProject: Project = {
      id: generateId(),
      name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    projects.unshift(newProject);
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error('Create project error:', error);
    return null;
  }
  return data;
}

export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    // LocalStorage 备用方案
    return getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS) || [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Get projects error:', error);
    return [];
  }
  return data || [];
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS) || [];
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updated_at: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    }
    return true;
  }

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Update project error:', error);
    return false;
  }
  return true;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS) || [];
    const filtered = projects.filter(p => p.id !== id);
    saveToStorage(STORAGE_KEYS.PROJECTS, filtered);
    // Also clean up related data
    const materials = getFromStorage<any>(STORAGE_KEYS.MATERIALS) || {};
    delete materials[id];
    saveToStorage(STORAGE_KEYS.MATERIALS, materials);
    return true;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete project error:', error);
    return false;
  }
  return true;
}

// -------------------------------------------
// 材料管理
// -------------------------------------------

export async function saveMaterials(
  projectId: string,
  materials: FileInput[],
  type: 'material' | 'guideline'
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const allMaterials = getFromStorage<any>(STORAGE_KEYS.MATERIALS) || {};
    if (!allMaterials[projectId]) allMaterials[projectId] = {};
    allMaterials[projectId][type] = materials;
    saveToStorage(STORAGE_KEYS.MATERIALS, allMaterials);
    return true;
  }

  // 先删除旧材料
  await supabase
    .from('project_materials')
    .delete()
    .eq('project_id', projectId)
    .eq('type', type);

  if (materials.length === 0) return true;

  // 插入新材料
  const records = materials.map((m: any) => ({
    project_id: projectId,
    type,
    file_type: m.type,
    content: m.content,
    mime_type: m.mimeType,
    file_name: m.fileName,
  }));

  const { error } = await supabase
    .from('project_materials')
    .insert(records);

  if (error) {
    console.error('Save materials error:', error);
    return false;
  }
  return true;
}

export async function getMaterials(
  projectId: string,
  type: 'material' | 'guideline'
): Promise<FileInput[]> {
  if (!isSupabaseConfigured) {
    const allMaterials = getFromStorage<any>(STORAGE_KEYS.MATERIALS) || {};
    return allMaterials[projectId]?.[type] || [];
  }

  const { data, error } = await supabase
    .from('project_materials')
    .select('*')
    .eq('project_id', projectId)
    .eq('type', type);

  if (error) {
    console.error('Get materials error:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    type: m.file_type as 'text' | 'file',
    content: m.content,
    mimeType: m.mime_type,
    fileName: m.file_name,
    timestamp: new Date(m.created_at).getTime(),
  }));
}

// -------------------------------------------
// 评审结果
// -------------------------------------------

export async function getReviewResults(projectId: string): Promise<Record<AgentType, any>> {
  if (!isSupabaseConfigured) {
    const allResults = getFromStorage<any>(STORAGE_KEYS.RESULTS) || {};
    return allResults[projectId] || { ...INITIAL_AGENTS_STATE };
  }

  const { data, error } = await supabase
    .from('review_results')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Get review results error:', error);
    return { ...INITIAL_AGENTS_STATE };
  }

  const results = { ...INITIAL_AGENTS_STATE };

  (data || []).forEach((r: any) => {
    const agentType = r.agent_type as AgentType;
    if (results[agentType]) {
      results[agentType] = {
        ...results[agentType],
        status: r.status as AgentStatus,
        content: r.content || '',
        error: r.error,
      };
    }
  });

  return results;
}

// -------------------------------------------
// 聊天历史
// -------------------------------------------

export async function getChatHistory(projectId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured) {
    const allChat = getFromStorage<any>(STORAGE_KEYS.CHAT) || {};
    return allChat[projectId] || [];
  }

  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Get chat history error:', error);
    return [];
  }

  return (data || []).map((m: any) => ({
    id: m.id,
    role: m.role as 'user' | 'model',
    text: m.text,
    timestamp: new Date(m.created_at).getTime(),
  }));
}

// -------------------------------------------
// 完整项目状态加载
// -------------------------------------------

export async function loadFullProject(projectId: string): Promise<ProjectState | null> {
  if (!isSupabaseConfigured) {
    const projects = getFromStorage<Project[]>(STORAGE_KEYS.PROJECTS) || [];
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const materials = await getMaterials(projectId, 'material');
    const guidelines = await getMaterials(projectId, 'guideline');
    const agents = await getReviewResults(projectId);
    const chatHistory = await getChatHistory(projectId);

    return {
      id: project.id,
      name: project.name,
      createdAt: new Date(project.created_at).getTime(),
      updatedAt: new Date(project.updated_at).getTime(),
      materials,
      guidelines,
      agents,
      chatHistory: chatHistory.length > 0 ? chatHistory : [{
        id: 'welcome',
        role: 'model',
        text: '你好！我是智能评审顾问。我已经阅读了您上传的项目材料和评审结果。您可以随时向我提问。',
        timestamp: Date.now(),
      }],
    };
  }

  // 并行加载所有数据
  const [projectRes, materials, guidelines, agents, chatHistory] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    getMaterials(projectId, 'material'),
    getMaterials(projectId, 'guideline'),
    getReviewResults(projectId),
    getChatHistory(projectId),
  ]);

  if (projectRes.error || !projectRes.data) {
    console.error('Load project error:', projectRes.error);
    return null;
  }

  const project = projectRes.data;

  return {
    id: project.id,
    name: project.name,
    createdAt: new Date(project.created_at).getTime(),
    updatedAt: new Date(project.updated_at).getTime(),
    materials,
    guidelines,
    agents,
    chatHistory: chatHistory.length > 0 ? chatHistory : [{
      id: 'welcome',
      role: 'model',
      text: '你好！我是智能评审顾问。我已经阅读了您上传的项目材料和评审结果。您可以随时向我提问。',
      timestamp: Date.now(),
    }],
  };
}
