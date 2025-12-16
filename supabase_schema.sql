-- ==============================================================================
-- SmartGrant 核心数据库 Schema Setup
-- ==============================================================================

-- 1. 项目表 (Projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 项目材料表 (Project Materials)
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('material', 'guideline')),
  file_type TEXT DEFAULT 'text',
  content TEXT,
  mime_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 评审结果表 (Review Results)
CREATE TABLE IF NOT EXISTS review_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  status TEXT NOT NULL,
  content TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, agent_type)
);

-- 4. 聊天历史表 (Chat History)
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- Row Level Security (RLS) 设置
-- 说明：本项目为演示版本，暂无用户认证系统，因此开放公开读写权限。
-- ==============================================================================

-- 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 创建策略 (允许匿名访问)

-- Projects Policies
CREATE POLICY "Public Access Projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- Materials Policies
CREATE POLICY "Public Access Materials" ON project_materials
  FOR ALL USING (true) WITH CHECK (true);

-- Review Results Policies
CREATE POLICY "Public Access Results" ON review_results
  FOR ALL USING (true) WITH CHECK (true);

-- Chat History Policies
CREATE POLICY "Public Access Chat" ON chat_history
  FOR ALL USING (true) WITH CHECK (true);
