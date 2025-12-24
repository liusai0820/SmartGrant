/**
 * @file layout.tsx
 * @input next/font, ThemeProvider, globals.css
 * @output 根布局组件 - 注入字体、主题、全局样式
 * @pos 布局层 - 应用的 HTML 骨架
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

// Inter 字体 - Clean Slate 主题推荐
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: '智评系统 - SmartGrant',
  description: 'AI 驱动的科研项目智能评审平台',
  keywords: ['科研评审', 'AI评审', '项目评估', '专家遴选'],
};

import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* TweakCN Live Preview - 可选，用于实时主题调试 */}
        <Script
          src="https://tweakcn.com/live-preview.min.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </head>
      <body className={cn(
        fontSans.variable,
        "min-h-screen bg-background font-sans antialiased"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
