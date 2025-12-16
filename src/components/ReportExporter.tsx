'use client';

import React, { useState } from 'react';
import { AgentResult, AgentType, ProjectState } from '@/types';

interface ReportExporterProps {
  project: ProjectState;
  onClose: () => void;
}

interface ExportConfig {
  format: 'markdown' | 'html' | 'pdf';
  includeAgentReviews: boolean;
  includeFinalReport: boolean;
  includeComplianceCheck: boolean;
  customTitle: string;
  customLogo: string;
  customFooter: string;
}

const ReportExporter: React.FC<ReportExporterProps> = ({ project, onClose }) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'markdown',
    includeAgentReviews: true,
    includeFinalReport: true,
    includeComplianceCheck: true,
    customTitle: '',
    customLogo: '',
    customFooter: '',
  });
  const [isExporting, setIsExporting] = useState(false);

  const generateMarkdown = (): string => {
    const title = config.customTitle || `${project.name} - 评审报告`;
    const date = new Date().toLocaleDateString('zh-CN');
    
    let content = `# ${title}\n\n`;
    content += `**生成时间**: ${date}\n\n`;
    content += `**项目名称**: ${project.name}\n\n`;
    content += `---\n\n`;

    // 专家评审意见
    if (config.includeAgentReviews) {
      content += `## 一、专家组独立评审意见\n\n`;
      
      const reviewers = [
        { type: AgentType.REVIEWER_A, name: '评审专家A' },
        { type: AgentType.REVIEWER_B, name: '评审专家B' },
        { type: AgentType.REVIEWER_C, name: '评审专家C' },
      ];

      reviewers.forEach((reviewer, index) => {
        const agent = project.agents[reviewer.type];
        if (agent.content) {
          content += `### ${index + 1}. ${reviewer.name}意见\n\n`;
          content += agent.content + '\n\n';
          content += `---\n\n`;
        }
      });
    }

    // 综合报告
    if (config.includeFinalReport) {
      const synthesizer = project.agents[AgentType.SYNTHESIZER];
      if (synthesizer.content) {
        content += `## 二、专家组综合评审决议\n\n`;
        content += synthesizer.content + '\n\n';
      }
    }

    // 页脚
    content += `---\n\n`;
    content += `*${config.customFooter || '本报告由 SmartGrant 智评系统自动生成，仅供参考。'}*\n`;
    content += `\n*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;

    return content;
  };

  const generateHTML = (): string => {
    const markdown = generateMarkdown();
    // 简单的 Markdown 转 HTML
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^---$/gim, '<hr>')
      .replace(/\n/gim, '<br>');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${config.customTitle || project.name} - 评审报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
    h2 { color: #2a2a2a; margin-top: 30px; }
    h3 { color: #3a3a3a; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 20px 0; }
    strong { color: #1a1a1a; }
    em { color: #666; }
    .logo { max-width: 200px; margin-bottom: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  ${config.customLogo ? `<img src="${config.customLogo}" class="logo" alt="Logo">` : ''}
  ${html}
  <div class="footer">
    ${config.customFooter || '本报告由 SmartGrant 智评系统自动生成'}
  </div>
</body>
</html>`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (config.format) {
        case 'html':
          content = generateHTML();
          filename = `${project.name}_评审报告_${Date.now()}.html`;
          mimeType = 'text/html;charset=utf-8';
          break;
        case 'pdf':
          // PDF 导出需要调用后端 API
          const response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              html: generateHTML(),
              filename: `${project.name}_评审报告`,
            }),
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${project.name}_评审报告_${Date.now()}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }
          setIsExporting(false);
          onClose();
          return;
        default:
          content = generateMarkdown();
          filename = `${project.name}_评审报告_${Date.now()}.md`;
          mimeType = 'text/markdown;charset=utf-8';
      }

      // 下载文件
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">导出评审报告</h3>
            <p className="text-sm text-zinc-500">自定义报告内容和格式</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* 格式选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'markdown', label: 'Markdown', icon: '📝' },
                { value: 'html', label: 'HTML', icon: '🌐' },
                { value: 'pdf', label: 'PDF', icon: '📄' },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setConfig({ ...config, format: fmt.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.format === fmt.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <span className="text-xl">{fmt.icon}</span>
                  <p className="text-sm font-medium mt-1">{fmt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 内容选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">包含内容</label>
            <div className="space-y-2">
              <CheckboxItem
                checked={config.includeAgentReviews}
                onChange={(v) => setConfig({ ...config, includeAgentReviews: v })}
                label="专家组独立评审意见"
                description="包含三位专家的详细评审意见"
              />
              <CheckboxItem
                checked={config.includeFinalReport}
                onChange={(v) => setConfig({ ...config, includeFinalReport: v })}
                label="综合评审决议"
                description="首席评审官的最终结论"
              />
              <CheckboxItem
                checked={config.includeComplianceCheck}
                onChange={(v) => setConfig({ ...config, includeComplianceCheck: v })}
                label="合规性检查清单"
                description="项目合规性检查结果"
              />
            </div>
          </div>

          {/* 自定义设置 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">自定义设置</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="自定义报告标题（可选）"
                value={config.customTitle}
                onChange={(e) => setConfig({ ...config, customTitle: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Logo URL（可选，仅 HTML/PDF）"
                value={config.customLogo}
                onChange={(e) => setConfig({ ...config, customLogo: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="自定义页脚文字（可选）"
                value={config.customFooter}
                onChange={(e) => setConfig({ ...config, customFooter: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-zinc-200 bg-zinc-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-200 rounded-lg mr-2"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                导出中...
              </>
            ) : (
              <>导出报告</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// 复选框组件
const CheckboxItem: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start space-x-3 p-3 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 text-indigo-600 rounded border-zinc-300"
    />
    <div>
      <p className="text-sm font-medium text-zinc-900">{label}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  </label>
);

export default ReportExporter;
