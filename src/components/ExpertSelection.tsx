/**
 * @file ExpertSelection.tsx
 * @input AgentResult (专家遴选结果), FileInput[] (项目材料), projectName
 * @output 专家遴选面板 UI，支持卡片展示与 CSV 导出
 * @pos 核心交互组件 - 专家推荐结果的展示与管理界面
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { AgentResult, AgentStatus, FileInput } from '@/types';
import { User, Building2, Target, Award, Search, ExternalLink, Download } from 'lucide-react';

interface ExpertSelectionProps {
  agent: AgentResult;
  proposals: FileInput[];
  onStartSelection: () => void;
  projectName?: string; // 项目名称，用于导出文件命名
}

interface ExpertInfo {
  name: string;
  org: string;
  title: string;
  field: string;
  reason: string;
  tier: 'local' | 'regional' | 'national';
}

/**
 * 验证是否为有效的中文人名
 * - 必须是2-4个中文字符
 * - 不能是职称、描述词或占位符
 */
function isValidChineseName(str: string): boolean {
  if (!str || str.length < 2 || str.length > 4) return false;

  // 必须全是中文字符
  const chineseOnly = /^[\u4e00-\u9fa5]+$/;
  if (!chineseOnly.test(str)) return false;

  // 排除常见的非人名词汇
  const invalidNames = [
    '教授', '研究员', '副教授', '讲师', '博士', '硕士',
    '院士', '主任', '总监', '经理', '工程师', '专家',
    '评审', '维度', '创新', '可行', '能力', '成本',
    '技术', '产线', '建设', '指标', '团队', '财务',
    '管理', '待定', '暂无', '未知', '其他', '备选',
  ];

  for (const invalid of invalidNames) {
    if (str.includes(invalid)) return false;
  }

  return true;
}

// Helper to parse Markdown with grouped sections
const parseExpertsFromMarkdown = (content: string): ExpertInfo[] | null => {
  try {
    const lines = content.split('\n');
    const experts: ExpertInfo[] = [];
    let currentTier: 'local' | 'regional' | 'national' = 'local';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect section headers for tier
      if (line.includes('深圳') || line.includes('本地')) {
        currentTier = 'local';
        continue;
      }
      if (line.includes('广东') || line.includes('省内') || line.includes('区域')) {
        currentTier = 'regional';
        continue;
      }
      if (line.includes('全国') || line.includes('外地') || line.includes('特殊') || line.includes('其他')) {
        currentTier = 'national';
        continue;
      }

      // Skip non-table lines
      if (!line.startsWith('|')) continue;
      if (line.includes('---')) continue;
      if (line.includes('姓名') || line.includes('单位') || line.includes('职称')) continue; // Skip headers

      // Parse table row
      const cells = line.split('|')
        .slice(1, -1)
        .map(c => c.trim().replace(/\*\*/g, '').replace(/\*/g, ''));

      if (cells.length >= 3) {
        const name = cells[0] || '';

        // Strict validation: name must be valid Chinese name
        if (!isValidChineseName(name)) {
          console.log(`[专家解析] 跳过无效姓名: "${name}"`);
          continue;
        }

        // Also validate org is not empty placeholder
        const org = cells[1] || '';
        if (!org || org === '...' || org.length < 2) continue;

        experts.push({
          name,
          org,
          title: cells[2] || '',
          field: cells[3] || '',
          reason: cells[4] || '',
          tier: currentTier,
        });
      }
    }

    console.log(`[专家解析] 成功解析 ${experts.length} 位专家`);
    return experts.length > 0 ? experts : null;
  } catch (e) {
    console.error("[专家解析] 解析错误", e);
    return null;
  }
};

const ExpertSelection: React.FC<ExpertSelectionProps> = ({ agent, proposals, onStartSelection, projectName = '项目' }) => {
  const isIdle = agent.status === AgentStatus.IDLE || agent.status === AgentStatus.ERROR;
  const isThinking = agent.status === AgentStatus.THINKING;

  const parsedExperts = useMemo(() => {
    if (!agent.content) return null;
    return parseExpertsFromMarkdown(agent.content);
  }, [agent.content]);

  // CSV 导出功能
  const handleExportCSV = useCallback(() => {
    if (!parsedExperts || parsedExperts.length === 0) return;

    // CSV 表头 - 添加序号列
    const headers = ['序号', '区域', '姓名', '单位', '职称', '研究方向', '推荐理由'];

    // 区域映射
    const tierMap = {
      local: '深圳本地',
      regional: '广东省内',
      national: '全国',
    };

    // 构建 CSV 行 - 添加序号
    const rows = parsedExperts.map((expert, index) => [
      String(index + 1), // 序号
      tierMap[expert.tier],
      expert.name,
      expert.org,
      expert.title,
      expert.field,
      expert.reason.replace(/,/g, '，'), // 避免 CSV 分隔符冲突
    ]);

    // 添加 BOM 以支持中文 Excel 打开
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // 简化项目名称用于文件名（去除特殊字符，截取前20字符）
    const safeProjectName = projectName
      .replace(/[<>:"/\\|?*]/g, '')
      .slice(0, 30)
      .trim() || '项目';

    // 下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeProjectName}_专家推荐名单_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [parsedExperts, projectName]);

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Toolbar */}
      <div className="px-6 py-3 flex justify-end items-center bg-background/50 border-b border-border/40 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* CSV 导出按钮 */}
          {parsedExperts && parsedExperts.length > 0 && !isThinking && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
          )}

          {/* 开始/重新检索按钮 */}
          {!isThinking && (
            <button
              onClick={onStartSelection}
              disabled={proposals.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2
                  ${proposals.length === 0
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30'}`}
            >
              {agent.content ? '重新检索' : '开始自动遴选'}
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {proposals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-600 font-medium">请先上传项目材料</p>
            <p className="text-xs text-zinc-400 mt-2">系统将自动提取关键词并匹配专家库</p>
          </div>
        ) : isThinking ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 border border-zinc-100 shadow-sm h-48 flex flex-col justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-zinc-100 rounded w-2/3" />
                    <div className="h-3 bg-zinc-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                  <div className="h-3 bg-zinc-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : parsedExperts ? (
          <div className="space-y-8">
            {/* Group by tier */}
            {(['local', 'regional', 'national'] as const).map(tier => {
              const tierExperts = parsedExperts.filter(e => e.tier === tier);
              if (tierExperts.length === 0) return null;

              const tierConfig = {
                local: { title: '深圳本地专家', subtitle: '优先邀请，便于协调', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                regional: { title: '广东省内专家', subtitle: '次选，差旅成本较低', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                national: { title: '全国专家', subtitle: '特定领域权威', color: 'text-amber-600 bg-amber-50 border-amber-200' },
              }[tier];

              return (
                <div key={tier}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{tierConfig.title}</h3>
                    <span className="text-xs text-zinc-400">{tierConfig.subtitle}</span>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{tierExperts.length}人</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tierExperts.map((expert, idx) => (
                      <div key={idx} className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="p-4 flex items-start gap-3 border-b border-zinc-100 dark:border-zinc-800">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-sm shrink-0">
                            {expert.name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{expert.name}</h3>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${tierConfig.color}`}>
                                {tier === 'local' ? '本地' : tier === 'regional' ? '省内' : '外地'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">{expert.org}</span>
                            </div>
                            {expert.title && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                <Award className="w-3 h-3" />
                                <span className="truncate">{expert.title}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col gap-3 text-sm">
                          {expert.field && (
                            <div className="flex flex-wrap gap-1.5">
                              {expert.field.split(/[,，、;]/).map((tag, i) => tag.trim() && (
                                <span key={i} className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}

                          {expert.reason && (
                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                              {expert.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !agent.content ? (
          // ... (Empty state remains same)
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-4">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-indigo-50">
              <User className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">AI 智能匹配评审专家</h3>
            <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
              系统将基于申报材料技术栈，自动检索并匹配国内顶尖高校与科研机构的专家列表。
            </p>
            <button onClick={onStartSelection} className="mt-8 px-8 py-3 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-zinc-900/10">
              开始匹配推荐
            </button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none bg-white p-8 rounded-xl border border-border/40 shadow-sm">
            <ReactMarkdown>{agent.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertSelection;
