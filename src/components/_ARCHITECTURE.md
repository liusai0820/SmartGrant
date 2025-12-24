# 📁 /src/components 架构文档

> ⚠️ **自指声明**：一旦我所属的文件夹有所变化，请更新我。

## 极简三行架构

- **输入**：从 page.tsx 接收 props（状态、回调函数）
- **输出**：渲染 UI 组件，触发用户交互事件
- **地位**：视图层核心 —— 所有可复用的 UI 组件

---

## 文件清单

| 文件 | 状态 | 功能 | 系统地位 |
|------|------|------|----------|
| `ReviewDashboard.tsx` | ⭐ 核心 | 评审进度面板 | 多 Agent 结果展示 |
| `ExpertSelection.tsx` | ⭐ 核心 | 专家遴选面板 | 专家推荐与导出 |
| `FinalReport.tsx` | ⭐ 核心 | 综合决议报告 | Markdown/Word 导出 |
| `ChatSection.tsx` | 💬 交互 | AI 对话界面 | 智能问答交互 |
| `InputSection.tsx` | 📥 输入 | 文件上传区 | 用户数据输入入口 |
| `ProjectSidebar.tsx` | 📋 布局 | 项目列表侧栏 | 项目选择与管理 |
| `WorkflowStepper.tsx` | 🆕 导航 | 工作流阶段导航 | 引导用户按流程评审 |
| `ProjectHeader.tsx` | 🆕 布局 | 项目头部信息 | 项目状态与快捷操作 |
| `SplitExpertView.tsx` | ⭐ 核心 | 专家观点分屏对比 | 2/3 列对比，全交互 |
| `ProjectsDashboard.tsx` | 🆕 看板 | 项目总览看板 | 全局项目管理视图 |
| `Navbar.tsx` | 🔝 布局 | 顶部导航栏 | 项目名编辑、状态 |
| `ui/dialog.tsx` | 🧩 基础 | 模态对话框 | Radix UI 封装 |
| `ui/dropdown-menu.tsx` | 🧩 基础 | 下拉菜单 | Radix UI 封装 |
| `theme-provider.tsx` | 🎨 基础 | 主题切换 | 深色/浅色模式 |

---

## 组件依赖关系

```
page.tsx (应用入口)
├── ViewMode: 'dashboard'
│   └── ProjectsDashboard (项目总览看板)
│
└── ViewMode: 'workspace'
    ├── ProjectSidebar (项目导航 - 可折叠)
    ├── ProjectHeader (项目信息 + 状态徽章)
    ├── WorkflowStepper (顶部工作流导航)
    │
    └── 核心内容区 (动态渲染)
        ├── Stage: 'prepare' (准备阶段)
        │   └── InputSection (全屏上传区)
        │
        ├── Stage: 'review' (评审阶段)
        │   └── SplitExpertView (专家对比视图)
        │
        └── Stage: 'synthesis'/'complete' (决议阶段)
            └── FinalReport (综合决议报告)

    └── ChatSection (AI 对话 - 抽屉式)
        └── 右下角浮动按钮打开
```

---

## 设计系统 v2.0 (Clean Slate Theme)

### 主题模式
- **默认**: 浅色模式 (light) - 干净、素雅、专业
- **字体**: Inter (正文), JetBrains Mono (代码)

### 色彩系统 (RGB)
- **Primary**: Indigo/Purple (`rgb(99, 102, 241)`)
- **Success**: Emerald (`rgb(34, 197, 94)`)
- **Warning**: Amber (`rgb(234, 179, 8)`)
- **Error**: Red (`rgb(239, 68, 68)`)

### 核心样式类
- `.card`: 基础卡片 (白底 + 边框 + 阴影)
- `.stat-card`: 统计卡片 (带图标)
- `.badge`: 状态徽章 (圆角 + 背景色 + 文字色)
- `.table`: 清晰的数据表格
- `.prose`: 使用 Tailwind Typography 优化 Markdown 排版

---

**最后更新**: 2025-12-24
