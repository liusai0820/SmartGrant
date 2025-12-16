'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertCircle, Loader2, Bot, User, Search, FileText } from 'lucide-react';
import { AgentResult, AgentStatus, AgentType } from '@/types';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: AgentResult;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand if completed or thinking (optional UX choice, maybe just keep closed by default or open if active)
  // For now, let's keep manual control but maybe default open if thinking?

  const getStatusConfig = () => {
    switch (agent.status) {
      case AgentStatus.IDLE:
        return { icon: null, text: '待机', color: 'text-muted-foreground bg-muted', border: 'border-muted' };
      case AgentStatus.THINKING:
        return { icon: <Loader2 className="w-3 h-3 animate-spin mr-1" />, text: '思考中...', color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100' };
      case AgentStatus.COMPLETED:
        return { icon: <CheckCircle2 className="w-3 h-3 mr-1" />, text: '已完成', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' };
      case AgentStatus.ERROR:
        return { icon: <AlertCircle className="w-3 h-3 mr-1" />, text: '异常', color: 'text-red-600 bg-red-50', border: 'border-red-100' };
    }
  };

  const getAgentIcon = () => {
    switch (agent.type) {
      case AgentType.REVIEWER_A:
        return <div className="h-10 w-10 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm"><Search className="w-5 h-5" /></div>;
      case AgentType.REVIEWER_B:
        return <div className="h-10 w-10 rounded-full bg-purple-100/50 flex items-center justify-center text-purple-600 border border-purple-200 shadow-sm"><FileText className="w-5 h-5" /></div>;
      case AgentType.REVIEWER_C:
        return <div className="h-10 w-10 rounded-full bg-orange-100/50 flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm"><Bot className="w-5 h-5" /></div>;
      case AgentType.EXPERT_HUNTER:
        return <div className="h-10 w-10 rounded-full bg-sky-100/50 flex items-center justify-center text-sky-600 border border-sky-200 shadow-sm"><User className="w-5 h-5" /></div>;
      default:
        return <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm"><Bot className="w-5 h-5" /></div>;
    }
  };

  const statusConfig = getStatusConfig();
  const content = agent.content || '';

  return (
    <div
      className={cn(
        "bg-card border rounded-xl shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden",
        agent.status === AgentStatus.THINKING && "ring-2 ring-primary/5 border-primary/20"
      )}
    >
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {getAgentIcon()}
            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <h3 className="text-sm font-bold text-card-foreground">{agent.title}</h3>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", statusConfig.color, statusConfig.border)}>
                  {statusConfig.icon}
                  {statusConfig.text}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{agent.description}</p>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pl-[4.5rem]">
              <div className="pt-4 border-t border-border/50 text-sm text-foreground/90 prose prose-sm max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground/90 prose-ul:text-muted-foreground">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <div className="py-2 text-muted-foreground/60 text-xs italic flex items-center">
                    {agent.status === AgentStatus.THINKING ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                        正在生成分析报告...
                      </>
                    ) : (
                      '等待任务启动...'
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentCard;
