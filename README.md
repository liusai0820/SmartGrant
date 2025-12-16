# 🧠 SmartGrant 智评系统

<p align="center">
  <strong>基于多 AI Agent 协同的科研项目智能评审平台</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-green?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenRouter-Multi--Model-purple?style=flat-square" alt="OpenRouter" />
</p>

---

## 📋 目录

- [项目背景](#-项目背景)
- [解决的痛点](#-解决的痛点)
- [设计理念](#-设计理念)
- [核心功能](#-核心功能)
- [技术架构](#-技术架构)
- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [部署指南](#-部署指南)

---

## 🎯 项目背景

在科研项目申报评审工作中，评审专家需要花费大量时间阅读和分析项目材料，包括：
- 核对项目是否符合申报指南的硬性指标要求
- 评估技术创新性和可行性
- 审查团队资质和资源保障
- 识别潜在风险和问题

传统人工评审存在以下局限：
1. **效率低下** - 单个专家需要数小时才能完成一份详细评审
2. **标准不一** - 不同专家的评审标准和关注点可能差异很大
3. **遗漏风险** - 人工审核容易遗漏细节问题
4. **专家难寻** - 匹配合适领域的评审专家需要大量人脉和时间

**SmartGrant 智评系统** 应运而生，旨在借助 AI 技术提升科研项目评审的效率和质量。

---

## 💡 解决的痛点

### 痛点 1：评审效率低
**传统方式**：专家需要 2-4 小时逐字阅读项目材料  
**智评方案**：AI 在几分钟内完成全面初筛，专家只需复核关键结论

### 痛点 2：合规审查繁琐
**传统方式**：人工逐项比对指南要求与申报材料  
**智评方案**：AI 自动提取硬性指标，用结构化表格呈现符合性

### 痛点 3：评审意见参差不齐
**传统方式**：不同专家输出格式和深度差异大  
**智评方案**：统一输出格式，确保每份评审意见结构完整、内容详实

### 痛点 4：专家遴选困难
**传统方式**：依赖人脉网络，匹配效率低  
**智评方案**：基于项目技术栈自动匹配专家，优先推荐本地专家降低邀请成本

### 痛点 5：评审文档不规范
**传统方式**：手工整理评审意见，格式不统一  
**智评方案**：一键导出符合 GB/T 9704-2012 公文标准的 Word 文档

---

## 🏗️ 设计理念

### 1. 多 Agent 协同评审

系统采用 **Multi-Agent 架构**，模拟真实专家组的工作模式：

| Agent | 角色定位 | AI 模型 |
|-------|---------|--------|
| 评审专家 A | 合规性与风险审查 | Claude Sonnet |
| 评审专家 B | 技术创新与先进性分析 | Gemini 2.5 Pro |
| 评审专家 C | 商业可行性与落地评估 | GPT-4o |
| 首席评审官 | 综合各方意见，形成最终决议 | Claude Sonnet |

这种设计确保：
- **多元视角** - 不同模型有不同的知识背景和推理偏好
- **交叉验证** - 多个专家从不同维度审视同一项目
- **综合决策** - 首席评审官整合分歧，形成平衡结论

### 2. 结构化输出

所有评审意见采用 **统一的 Markdown 结构**：

```markdown
# 项目评审意见书

评审专家：评审专家A (Claude)
评审日期：2025-12-17
项目名称：xxx
申报单位：xxx

## 一、合规性与形式审查
### 1.1 硬性指标核查
| 审查项目 | 指南要求 | 实际情况 | 符合性 |
|----------|----------|----------|--------|
| 负责人年龄 | ≤55周岁 | 57岁 | ❌ 不符合 |

## 二、技术创新与先进性
## 三、团队与资源保障
## 四、问题与风险
## 五、综合评审结论
```

### 3. 智能警示

系统对关键风险进行 **标红高亮**：
- `不符合`、`不合格`、`不推荐` 等负面结论自动标红
- 高风险项在表格中醒目标识
- 帮助决策者快速定位问题

### 4. 专家遴选策略

采用 **三级地域优先策略**：
1. **深圳本地** (5-6人) - 优先邀请，差旅成本最低
2. **广东省内** (3-4人) - 区域资源，便于沟通
3. **全国专家** (2-3人) - 特定领域权威

同时确保专家类型多元化：
- 高校/科研院所 50%
- 产业界人士 40%
- 协会/智库专家 10%

---

## ⚡ 核心功能

### 🔍 智能评审
- 上传项目申报材料和评审指南
- 多 AI Agent 并行评审
- 统一格式的结构化评审意见
- 首席评审官综合决议

### 📊 合规性审查
- 自动提取指南硬性指标
- 逐项比对申报材料
- 用表格清晰呈现符合性
- ✅/❌ 一目了然

### 🧑‍🔬 专家遴选
- AI 分析项目技术领域
- 自动匹配专家库
- 地域优先排序
- 导出 CSV 专家名单

### 💬 AI 助手
- 基于项目材料的智能问答
- 支持追问和深入探讨
- 上下文感知

### 📄 文档导出
- Markdown 格式导出
- **GB/T 9704-2012 公文格式** Word 导出
  - 标准页边距 (上37mm 下35mm 左28mm 右26mm)
  - 方正小标宋简体/仿宋字体
  - 红头文件样式
  - 落款和版记

---

## 🛠️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Next.js 14)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │评审面板  │ │专家遴选  │ │综合决议  │ │AI 助手  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│       └───────────┴───────────┴───────────┘                 │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                  API Routes (Next.js)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │/review  │ │/expert  │ │/chat    │ │/extract │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
├───────┴───────────┴───────────┴───────────┴─────────────────┤
│                     OpenRouter API                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Claude Sonnet│ │Gemini 2.5   │ │GPT-4o       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                     Supabase (Postgres)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │projects │ │materials│ │reviews  │ │chat     │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Next.js 14 (App Router) | React 服务端渲染 |
| UI 组件 | Tailwind CSS + Lucide Icons | 现代化设计系统 |
| 状态管理 | React Hooks | 轻量级状态管理 |
| AI 接口 | OpenRouter | 统一多模型访问 |
| 数据库 | Supabase (PostgreSQL) | 云端持久化 |
| 文档生成 | docx + file-saver | Word 公文导出 |
| 部署 | Vercel / Docker | 云端部署 |

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/smartgrant-reviewer.git
cd smartgrant-reviewer/next-migration
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# OpenRouter API (必填)
OPENROUTER_API_KEY=your_openrouter_key

# Supabase (必填)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Tavily Search API (可选，用于专家搜索)
TAVILY_API_KEY=your_tavily_key

# 自定义模型配置 (可选)
MODEL_REVIEWER_A=anthropic/claude-sonnet-4
MODEL_REVIEWER_B=google/gemini-2.5-pro-preview
MODEL_REVIEWER_C=openai/gpt-4o
MODEL_SYNTHESIZER=anthropic/claude-sonnet-4
```

### 4. 初始化数据库

在 Supabase Dashboard → SQL Editor 执行：
```sql
-- 执行 src/lib/supabase/schema.sql 中的 SQL
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

---

## 📁 项目结构

```
next-migration/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── chat/          # AI 对话
│   │   │   ├── review/        # 项目评审
│   │   │   ├── expert/        # 专家遴选
│   │   │   └── extract-metadata/ # 元数据提取
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 主页面
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── ReviewDashboard.tsx   # 评审面板
│   │   ├── ExpertSelection.tsx   # 专家遴选
│   │   ├── FinalReport.tsx       # 综合决议
│   │   ├── ChatSection.tsx       # AI 助手
│   │   ├── Navbar.tsx            # 顶部导航
│   │   └── ProjectSidebar.tsx    # 项目侧边栏
│   ├── lib/                   # 核心库
│   │   ├── openrouter.ts      # AI API 封装
│   │   ├── wordExport.ts      # Word 公文导出
│   │   ├── tavily.ts          # 专家搜索
│   │   ├── db.ts              # 数据库操作
│   │   └── supabase/          # Supabase 客户端
│   └── types/                 # TypeScript 类型
├── .env.example               # 环境变量模板
├── package.json
└── README.md
```

---

## 🗄️ 数据库表结构

| 表名 | 说明 |
|------|------|
| `projects` | 项目基本信息（名称、创建时间等） |
| `project_materials` | 项目材料（申报书、指南） |
| `review_results` | 各 Agent 的评审结果 |
| `chat_history` | AI 对话历史 |

---

## 🚢 部署指南

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署

### Docker 部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t smartgrant .
docker run -p 3000:3000 --env-file .env.local smartgrant
```

---

## 📝 更新日志

### v1.0.0 (2025-12-17)

- ✅ 多 Agent 协同评审系统
- ✅ 统一的评审意见格式
- ✅ 合规性审查表格化呈现
- ✅ 智能专家遴选（地域优先）
- ✅ GB/T 9704-2012 公文格式 Word 导出
- ✅ CSV 专家名单导出
- ✅ AI 辅助项目元数据提取
- ✅ 关键风险红色高亮标识
- ✅ 深色模式支持
- ✅ 云端数据持久化

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [OpenRouter](https://openrouter.ai) - 统一的多模型 API 访问
- [Supabase](https://supabase.com) - 开源 Firebase 替代方案
- [Next.js](https://nextjs.org) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的 CSS 框架
- [Lucide Icons](https://lucide.dev) - 优雅的图标库
