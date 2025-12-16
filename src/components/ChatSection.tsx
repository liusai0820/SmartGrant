'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, FileInput } from '@/types';
import { Sparkles, User, Send, MessageCircle } from 'lucide-react';

interface ChatSectionProps {
  projectId: string;
  proposalInputs: FileInput[];
  guidelinesInputs: FileInput[];
  finalReportContent: string;
  chatHistory: ChatMessage[];
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({ projectId, proposalInputs, guidelinesInputs, finalReportContent, chatHistory, onUpdateHistory }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now(),
    };

    const newHistory = [...chatHistory, userMsg];
    onUpdateHistory(newHistory);
    setInputText('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: inputText,
          history: chatHistory,
          materials: proposalInputs,
          guidelines: guidelinesInputs,
          finalReport: finalReportContent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: result.response,
          timestamp: Date.now(),
        };
        onUpdateHistory([...newHistory, aiMsg]);
      }
    } catch (error) {
      console.error('Chat error', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold text-lg">有什么可以帮您？</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md leading-relaxed">
              我可以基于您上传的项目材料和评审报告回答问题，解释细节，或提供修改建议。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["这个项目有什么风险？", "如何优化申报材料？", "专家的主要顾虑是什么？"].map(q => (
                <button key={q} onClick={() => setInputText(q)} className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300 font-medium">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed
                ${msg.role === 'user'
                ? 'bg-zinc-900 text-white rounded-br-sm'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 rounded-bl-sm shadow-sm'
              }`}>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-xs" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => <th className="bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400" {...props} />,
                    td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-700" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center ml-3 mt-1 flex-shrink-0 text-zinc-600 dark:text-zinc-300">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            className="w-full pl-5 pr-14 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 focus:border-transparent transition-all font-medium placeholder:text-zinc-400"
            placeholder="输入您的问题..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-zinc-900 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-3">
          AI 可能会产生不准确的信息，请以正式报告为准
        </p>
      </div>
    </div>
  );
};

export default ChatSection;
