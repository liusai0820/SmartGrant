import React from 'react';
import { Check, CircleDot, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkflowStage = 'prepare' | 'selection' | 'review' | 'synthesis' | 'complete';

interface WorkflowStepperProps {
    currentStage: WorkflowStage;
    completedStages: WorkflowStage[];
    onStageClick?: (stage: WorkflowStage) => void;
    className?: string; // 允许从外部传入样式，方便定位
}

const STAGES: { id: WorkflowStage; label: string }[] = [
    { id: 'prepare', label: '准备' },
    { id: 'selection', label: '遴选' }, // 新增阶段
    { id: 'review', label: '评审' },
    { id: 'synthesis', label: '决议' },
    { id: 'complete', label: '完成' },
];

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
    currentStage,
    completedStages,
    onStageClick,
    className,
}) => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
                {STAGES.map((stage, index) => {
                    const isCompleted = completedStages.includes(stage.id);
                    const isCurrent = stage.id === currentStage;
                    // 允许点击已完成的，或者当前阶段，或者下一个即将进行的阶段（方便调试或查看）
                    // 在实际业务中，可能需要更严格的限制，这里为了灵活性稍微放宽
                    const isClickable = true;

                    return (
                        <button
                            key={stage.id}
                            onClick={() => isClickable && onStageClick?.(stage.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                isCurrent
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
                                !isClickable && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isCompleted && !isCurrent ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                            ) : isCurrent ? (
                                <CircleDot className="w-3.5 h-3.5 text-primary animate-pulse" />
                            ) : (
                                <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold border border-current rounded-full opacity-40">
                                    {index + 1}
                                </span>
                            )}
                            {stage.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkflowStepper;
