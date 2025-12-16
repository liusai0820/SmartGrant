'use client';

import React, { useState, useEffect } from 'react';
import { ReviewTemplate, TEMPLATE_CATEGORIES } from '@/types/template';
import { supabase } from '@/lib/supabase/client';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: ReviewTemplate | null) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<ReviewTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('review_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        focusA: t.focus_a,
        focusB: t.focus_b,
        focusC: t.focus_c,
        complianceChecklist: t.compliance_checklist || [],
        scoringCriteria: t.scoring_criteria || [],
        reportTemplate: t.report_template,
        isSystem: t.is_system,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTemplates(mapped);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // 按分类分组
  const groupedTemplates = templates.reduce((acc, template) => {
    const cat = template.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, ReviewTemplate[]>);

  return (
    <div className="relative">
      {/* 选择按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">
            {selectedTemplate 
              ? TEMPLATE_CATEGORIES[selectedTemplate.category].icon 
              : '📋'}
          </span>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-900">
              {selectedTemplate?.name || '选择评审模板'}
            </p>
            <p className="text-xs text-zinc-500">
              {selectedTemplate?.description || '使用预设模板可提高评审准确性'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉列表 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">加载中...</div>
          ) : (
            <>
              {/* 不使用模板选项 */}
              <button
                onClick={() => {
                  onSelectTemplate(null);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100
                  ${!selectedTemplateId ? 'bg-zinc-50' : ''}`}
              >
                <p className="text-sm font-medium text-zinc-700">不使用模板</p>
                <p className="text-xs text-zinc-500">使用默认评审维度</p>
              </button>

              {/* 分类展示 */}
              {Object.entries(groupedTemplates).map(([category, temps]) => (
                <div key={category}>
                  <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-500 uppercase">
                      {TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]?.icon}{' '}
                      {TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]?.label}
                    </span>
                  </div>
                  {temps.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        onSelectTemplate(template);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-zinc-50 border-b border-zinc-100
                        ${selectedTemplateId === template.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{template.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
                        </div>
                        {template.isSystem && (
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded">
                            系统预设
                          </span>
                        )}
                      </div>
                      {/* 合规检查项预览 */}
                      {template.complianceChecklist.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template.complianceChecklist.slice(0, 3).map((item, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded"
                            >
                              {item.item.slice(0, 15)}...
                            </span>
                          ))}
                          {template.complianceChecklist.length > 3 && (
                            <span className="text-[10px] text-zinc-400">
                              +{template.complianceChecklist.length - 3}项
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* 选中模板的详情 */}
      {selectedTemplate && (
        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs font-medium text-indigo-800 mb-2">评审维度配置：</p>
          <div className="space-y-1 text-xs text-indigo-700">
            <p>• 专家A: {selectedTemplate.focusA}</p>
            <p>• 专家B: {selectedTemplate.focusB}</p>
            <p>• 专家C: {selectedTemplate.focusC}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
