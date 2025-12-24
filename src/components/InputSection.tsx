/**
 * @file InputSection.tsx
 * @input FileInput[] (材料与指南), onStartReview 回调
 * @output 文件上传区 UI，支持拖拽上传与文本输入
 * @pos 输入组件 - 用户数据输入的入口界面
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

'use client';

import React, { useRef, useState } from 'react';
import { FileInput } from '@/types';
import { TEST_GUIDELINES, TEST_PROPOSALS } from '@/data/testCase';
import { Upload, FileText, Plus, Trash2, File, PlayCircle, Loader2, Sparkles, FolderOpen, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputSectionProps {
  proposalInputs: FileInput[];
  setProposalInputs: (inputs: FileInput[]) => void;
  guidelinesInputs: FileInput[];
  setGuidelinesInputs: (inputs: FileInput[]) => void;
  onStartReview: () => void;
  isAnalyzing: boolean;
}

const MultiFileUploadArea: React.FC<{
  label: string;
  subLabel: string;
  files: FileInput[];
  setFiles: (files: FileInput[]) => void;
  variant: 'primary' | 'secondary';
}> = ({ label, subLabel, files, setFiles, variant }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList) => {
    const newFiles: FileInput[] = [];
    let processedCount = 0;

    Array.from(fileList).forEach((file) => {
      if (file.type === 'application/pdf' || file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const content = file.type === 'application/pdf' ? result.split(',')[1] : result;
          newFiles.push({
            id: Date.now().toString() + Math.random().toString(),
            type: file.type === 'application/pdf' ? 'file' : 'text',
            content: content,
            mimeType: file.type,
            fileName: file.name,
            timestamp: Date.now(),
          });
          processedCount++;
          if (processedCount === fileList.length) {
            setFiles([...files, ...newFiles]);
          }
        };
        if (file.type === 'application/pdf') {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const addTextField = () => {
    const newText: FileInput = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      fileName: '新建文本内容',
      timestamp: Date.now(),
    };
    setFiles([...files, newText]);
  };

  const updateTextContent = (id: string, content: string) => {
    setFiles(files.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  // Simplified styles: No colored borders by default, cleaner look
  const isPrimary = variant === 'primary';

  return (
    <div className="flex flex-col h-full group/area">
      <div className="flex justify-between items-center mb-4 pl-1">
        <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <div className={cn("w-1 h-4 rounded-full", isPrimary ? "bg-primary" : "bg-purple-500")}></div>
          {label}
        </label>
        <button onClick={addTextField} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center opacity-0 group-hover/area:opacity-100 duration-200">
          <Plus className="w-3 h-3 mr-1" />
          输入文本
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-[140px]">
        <div className="flex-1 space-y-3 mb-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
          {files.length === 0 && (
            <div
              className={cn(
                "h-full rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer border border-transparent",
                isDragging
                  ? (isPrimary ? "bg-primary/5 border-primary/20" : "bg-purple-500/5 border-purple-500/20")
                  : "bg-secondary/40 hover:bg-secondary/60 hover:shadow-inner"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={cn("mb-4 p-4 rounded-2xl bg-background shadow-sm transition-transform duration-300",
                isDragging ? "scale-110" : ""
              )}>
                <Upload className={cn("h-5 w-5", isDragging ? (isPrimary ? "text-primary" : "text-purple-500") : "text-muted-foreground/50")} />
              </div>
              <p className="text-sm text-foreground/70 font-medium mb-1.5">点击或拖拽上传</p>
              <p className="text-xs text-muted-foreground/60 max-w-[200px] leading-relaxed">{subLabel}</p>
            </div>
          )}

          {files.map((file) => (
            <div key={file.id} className="relative group animate-in zoom-in-95 duration-200">
              {file.type === 'file' ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/40 hover:border-border/80 hover:shadow-sm transition-all">
                  <div className="flex items-center overflow-hidden">
                    <div className={cn("p-2 rounded-lg mr-3", isPrimary ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-500")}>
                      <File className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground/90">{file.fileName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{file.mimeType?.split('/')[1] || 'FILE'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl p-4 bg-background border border-border/40 hover:border-border/80 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs text-muted-foreground font-medium">
                      <FileText className="w-3 h-3 mr-1.5" />
                      <span>{file.fileName}</span>
                    </div>
                    <button onClick={() => removeFile(file.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      移除
                    </button>
                  </div>
                  <textarea
                    className="w-full text-sm border-none focus:ring-0 resize-none bg-transparent p-0 placeholder:text-muted-foreground/40 font-normal leading-relaxed focus:outline-none text-foreground/80"
                    rows={4}
                    placeholder="在此输入内容..."
                    value={file.content}
                    onChange={(e) => updateTextContent(file.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {files.length > 0 && (
          <div
            className="mt-2 py-3 rounded-xl text-center cursor-pointer hover:bg-secondary/50 transition-colors text-muted-foreground/70 text-xs flex items-center justify-center gap-2 font-medium"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Plus className="w-3 h-3" />
            添加文件
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md" multiple onChange={handleFileSelect} />
      </div>
    </div>
  );
};

const InputSection: React.FC<InputSectionProps> = ({ proposalInputs, setProposalInputs, guidelinesInputs, setGuidelinesInputs, onStartReview, isAnalyzing }) => {
  const isReady = proposalInputs.length > 0 && guidelinesInputs.length > 0;

  const loadDemoData = () => {
    if (confirm('是否加载演示数据？这将清空当前已上传的文件。')) {
      setGuidelinesInputs(TEST_GUIDELINES);
      setProposalInputs(TEST_PROPOSALS);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Clean & Simple */}
      <div className="pb-6 pt-2 flex justify-between items-end px-1">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            项目档案
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-light">
            上传指南与材料，启动智能评审
          </p>
        </div>
        <button
          onClick={loadDemoData}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center bg-secondary/30 hover:bg-secondary/60 px-3 py-1.5 rounded-full"
        >
          <Sparkles className="w-3 h-3 mr-1.5" />
          演示数据
        </button>
      </div>

      {/* Content - Frameless Layout */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
        <div className="min-h-[180px]">
          <MultiFileUploadArea
            label="申报指南"
            subLabel="上传政策文件或评审标准 (PDF/TXT)"
            files={guidelinesInputs}
            setFiles={setGuidelinesInputs}
            variant="secondary"
          />
        </div>

        <div className="min-h-[180px]">
          <MultiFileUploadArea
            label="申报材料"
            subLabel="上传项目书或商业计划书 (PDF/TXT)"
            files={proposalInputs}
            setFiles={setProposalInputs}
            variant="primary"
          />
        </div>
      </div>

      {/* Footer - Floating Action */}
      <div className="pt-6 pb-2 px-1">
        <button
          onClick={onStartReview}
          disabled={isAnalyzing || !isReady}
          className={cn(
            "w-full py-4 px-6 rounded-2xl text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center tracking-wide relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]",
            isAnalyzing || !isReady
              ? "bg-secondary text-muted-foreground cursor-not-allowed shadow-none"
              : "bg-zinc-900 hover:bg-zinc-800 shadow-zinc-900/20"
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4 text-zinc-400" />
              <span className="text-zinc-300">正在组织评审...</span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <PlayCircle className="w-4 h-4 mr-2 opacity-80" />
              启动独立评审
            </>
          )}
        </button>
        {!isReady && !isAnalyzing && (
          <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground/50 gap-1.5 font-light">
            <AlertCircle className="w-3 h-3" />
            <span>请先完善上方资料</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;

