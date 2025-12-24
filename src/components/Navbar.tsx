/**
 * @file Navbar.tsx
 * @input projectName, updatedAt, onUpdateName 回调
 * @output 顶部导航栏组件，包含项目名编辑、主题切换、状态指示
 * @pos 布局组件 - 应用顶部固定导航栏
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

import React, { useEffect, useState } from 'react';
import { Bot, Clock, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface NavbarProps {
    projectName: string;
    updatedAt: string | number;
    onUpdateName: (name: string) => void;
    onToggleSidebar?: () => void;
    isSidebarCollapsed?: boolean;
    className?: string;
}

const Navbar: React.FC<NavbarProps> = ({
    projectName,
    updatedAt,
    onUpdateName,
    onToggleSidebar,
    isSidebarCollapsed,
    className
}) => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className={cn("h-16 flex items-center justify-between px-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10", className)}>
            <div className="flex-1 flex items-center gap-4">
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                )}

                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => onUpdateName(e.target.value)}
                            className="text-lg font-semibold bg-transparent border-none focus:ring-0 p-0 text-foreground placeholder:text-muted-foreground w-full max-w-lg focus:outline-none hover:bg-accent/30 focus:bg-accent/50 px-2 py-1 -ml-2 rounded-md transition-colors"
                            placeholder="输入项目名称..."
                            title="点击编辑项目名称"
                        />
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden group-hover:inline">
                            可编辑
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5 ml-0">
                        <Clock className="w-3 h-3" />
                        <span>上次更新: {new Date(updatedAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>OpenRouter Connected</span>
                </div>

                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="w-4 h-4" />
                </div>

                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="切换主题"
                    >
                        {theme === 'dark' ? (
                            <Moon className="h-4 w-4" />
                        ) : (
                            <Sun className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
        </header>
    );
};

export default Navbar;
