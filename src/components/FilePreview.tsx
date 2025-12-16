'use client';

import React, { useState } from 'react';
import { FileInput } from '@/types';

interface FilePreviewProps {
  file: FileInput;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'info'>('content');

  // 高亮搜索词
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  // 统计搜索结果数量
  const matchCount = searchTerm.trim() 
    ? (file.content.match(new RegExp(searchTerm, 'gi')) || []).length 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">{file.fileName || '文本内容'}</h3>
              <p className="text-xs text-zinc-500">
                {file.mimeType || 'text/plain'} · {(file.content.length / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-200">
          {/* Tabs */}
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'content'
                  ? 'bg-white shadow-sm text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              内容预览
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'info'
                  ? 'bg-white shadow-sm text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              文件信息
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <span className="text-xs text-zinc-500">
                找到 {matchCount} 处
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 leading-relaxed">
                {highlightText(file.content, searchTerm)}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="文件名" value={file.fileName || '未命名'} />
                <InfoCard label="文件类型" value={file.mimeType || 'text/plain'} />
                <InfoCard label="内容大小" value={`${(file.content.length / 1024).toFixed(2)} KB`} />
                <InfoCard label="字符数" value={file.content.length.toLocaleString()} />
                <InfoCard label="行数" value={file.content.split('\n').length.toLocaleString()} />
                <InfoCard label="上传时间" value={new Date(file.timestamp).toLocaleString('zh-CN')} />
              </div>
              
              {/* 内容摘要 */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-zinc-700 mb-2">内容摘要</h4>
                <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-lg">
                  {file.content.slice(0, 500)}...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(file.content);
              alert('内容已复制到剪贴板');
            }}
            className="px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors mr-2"
          >
            复制内容
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// 信息卡片组件
const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-zinc-50 p-3 rounded-lg">
    <p className="text-xs text-zinc-500 mb-1">{label}</p>
    <p className="text-sm font-medium text-zinc-900">{value}</p>
  </div>
);

export default FilePreview;
