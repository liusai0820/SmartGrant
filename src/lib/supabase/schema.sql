-- ===========================================
-- SmartGrant 智评系统 - Supabase 数据库 Schema
-- ===========================================
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------
-- 1. 项目表 (projects)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '新项目',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- -------------------------------------------
-- 2. 项目材料表 (project_materials)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('material', 'guideline')),
  file_type TEXT NOT NULL CHECK (file_type IN ('text', 'file')),
  content TEXT NOT NULL,           -- 解析后的纯文本内容
  mime_type TEXT,
  file_name TEXT,
  r2_key TEXT,                     -- Cloudflare R2 存储 key
  r2_url TEXT,                     -- R2 公开访问 URL
  file_size INTEGER,               -- 原始文件大小 (bytes)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON project_materials(project_id);

-- -------------------------------------------
-- 3. 评审结果表 (review_results)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS review_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('REVIEWER_A', 'REVIEWER_B', 'REVIEWER_C', 'SYNTHESIZER', 'EXPERT_HUNTER')),
  status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'THINKING', 'COMPLETED', 'ERROR')),
  content TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, agent_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON review_results(project_id);

-- -------------------------------------------
-- 4. 聊天历史表 (chat_history)
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_project_id ON chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_history(created_at);

-- -------------------------------------------
-- 5. 自动更新 updated_at 触发器
-- -------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 projects 表添加触发器
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 review_results 表添加触发器
DROP TRIGGER IF EXISTS update_reviews_updated_at ON review_results;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON review_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------
-- 6. Row Level Security (RLS) 策略
-- -------------------------------------------
-- 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 项目表策略 (用户只能访问自己的项目)
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 材料表策略
CREATE POLICY "Users can manage materials of own projects" ON project_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_materials.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- 评审结果策略
CREATE POLICY "Users can manage reviews of own projects" ON review_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = review_results.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- 聊天历史策略
CREATE POLICY "Users can manage chat of own projects" ON chat_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_history.project_id 
      AND (projects.user_id = auth.uid() OR projects.user_id IS NULL)
    )
  );

-- -------------------------------------------
-- 7. 示例：插入测试项目
-- -------------------------------------------
-- INSERT INTO projects (name) VALUES ('测试项目 - 固态电池研发');
