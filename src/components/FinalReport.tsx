/**
 * @file FinalReport.tsx
 * @input AgentResult (首席评审官结果), projectName
 * @output 综合决议报告 UI，支持 Markdown/Word 公文导出
 * @pos 核心交互组件 - 最终评审结论的展示与导出界面
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgentResult } from '@/types';
import { Download, FileText, Check, FileType, Loader2 } from 'lucide-react';
import { generateGovernmentDocument } from '@/lib/wordExport';

interface FinalReportProps {
  agent: AgentResult;
  projectName?: string;
}

const FinalReport: React.FC<FinalReportProps> = ({ agent, projectName = '项目评审' }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportMarkdown = () => {
    if (!agent.content) return;

    const blob = new Blob([agent.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}_评审决议_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = async () => {
    if (!agent.content) return;
    setIsExporting(true);
    try {
      await generateGovernmentDocument(agent.content, projectName);
    } catch (error) {
      console.error('Word export failed:', error);
      alert('导出Word失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  if (!agent.content)
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="h-14 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-5">
          <FileText className="h-7 w-7 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">等待生成报告</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
          当三位专家完成独立评审后，系统将自动汇总成最终决议报告。
        </p>
      </div>
    );

  return (
    <div className="h-full flex flex-col">
      {/* Report Header */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">综合评审决议</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Consensus Report</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
            <Check className="w-3.5 h-3.5" />
            已生成
          </span>
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
          >
            <Download className="h-4 w-4" />
            MD
          </button>
          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileType className="h-4 w-4" />
            )}
            导出公文
          </button>
        </div>
      </div>

      {/* Report Body */}
      <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 custom-scrollbar">
        <div className="max-w-4xl mx-auto my-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Document Header (公文头) */}
          <div className="border-b-4 border-red-600 px-12 py-8 text-center">
            <h1 className="text-red-600 text-2xl font-bold tracking-[0.5em] mb-2">智 评 系 统</h1>
            <p className="text-zinc-500 text-sm">SmartGrant Intelligent Review System</p>
          </div>

          {/* Document Body */}
          <div className="px-12 py-10">
            <div className="text-center mb-8">
              <p className="text-zinc-400 text-sm mb-4">
                智评字〔{new Date().getFullYear()}〕第{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}号
              </p>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">专家组综合评审决议</h2>
            </div>

            {/* Markdown Content */}
            <article className="text-zinc-700 dark:text-zinc-300 leading-8 text-[15px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-8 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mt-6 mb-3">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-7 text-justify indent-8">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-8 mb-4 space-y-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-8 mb-4 space-y-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-7">{children}</li>
                  ),
                  // Bold text - only apply red to warning keywords
                  strong: ({ children }) => {
                    const text = String(children);
                    const isWarning = /不符合|不合格|不推荐|不通过|高风险|严重|缺失|不足|超标|不满足|警告|问题|风险/.test(text);
                    return (
                      <strong className={isWarning
                        ? "font-bold text-red-600 dark:text-red-400"
                        : "font-bold text-zinc-900 dark:text-zinc-100"
                      }>{children}</strong>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 my-4 rounded-r-lg text-amber-800 dark:text-amber-200">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-zinc-50 dark:bg-zinc-800">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      {children}
                    </td>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
                        <code>{children}</code>
                      </pre>
                    );
                  },
                }}
              >
                {agent.content}
              </ReactMarkdown>
            </article>

            {/* Document Footer */}
            <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-right space-y-2">
                <p className="text-zinc-600 dark:text-zinc-400">SmartGrant 智能评审系统</p>
                <p className="text-zinc-500">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalReport;
