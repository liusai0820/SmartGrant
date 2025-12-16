// ===========================================
// 评审模板类型定义
// ===========================================

export interface ComplianceCheckItem {
  item: string;
  required: boolean;
  checked?: boolean;
}

export interface ScoringCriteria {
  dimension: string;
  weight: number;
  description: string;
}

export interface ReviewTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'national' | 'provincial' | 'enterprise' | 'custom';
  focusA: string;
  focusB: string;
  focusC: string;
  complianceChecklist: ComplianceCheckItem[];
  scoringCriteria: ScoringCriteria[];
  reportTemplate?: string;
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 模板分类
export const TEMPLATE_CATEGORIES = {
  national: { label: '国家级项目', icon: '🏛️' },
  provincial: { label: '省级项目', icon: '🏢' },
  enterprise: { label: '企业认定', icon: '🏭' },
  custom: { label: '自定义', icon: '✏️' },
} as const;
