-- ===========================================
-- 评审模板表 (review_templates)
-- ===========================================

CREATE TABLE IF NOT EXISTS review_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'national', 'provincial', 'enterprise', 'custom'
  
  -- 评审维度配置
  focus_a TEXT NOT NULL DEFAULT '风险控制、合规性与逻辑严密性',
  focus_b TEXT NOT NULL DEFAULT '技术创新、前沿性与研发实力',
  focus_c TEXT NOT NULL DEFAULT '商业落地、团队资质与资源保障',
  
  -- 合规性检查清单 (JSON)
  compliance_checklist JSONB DEFAULT '[]',
  
  -- 评分标准 (JSON)
  scoring_criteria JSONB DEFAULT '{}',
  
  -- 报告模板
  report_template TEXT,
  
  -- 是否为系统预设
  is_system BOOLEAN DEFAULT false,
  
  -- 创建者
  created_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_templates_category ON review_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_system ON review_templates(is_system);

-- 插入预设模板
INSERT INTO review_templates (name, description, category, focus_a, focus_b, focus_c, compliance_checklist, is_system) VALUES
(
  '国家自然科学基金',
  '适用于国家自然科学基金各类项目申报评审',
  'national',
  '科学问题的创新性、研究方案的可行性、申请人资质',
  '研究内容的前沿性、技术路线的科学性、预期成果的学术价值',
  '研究基础与条件、团队结构合理性、经费预算合理性',
  '[
    {"item": "申请人是否具有高级职称或博士学位", "required": true},
    {"item": "是否符合限项规定", "required": true},
    {"item": "研究期限是否符合要求", "required": true},
    {"item": "经费预算是否在限额内", "required": true},
    {"item": "是否有合作单位承诺函", "required": false}
  ]',
  true
),
(
  '科技部重点研发计划',
  '适用于国家重点研发计划项目申报',
  'national',
  '是否符合指南方向、考核指标响应度、知识产权归属',
  '技术创新性、国内外对比分析、产业化前景',
  '牵头单位资质、项目负责人经历、配套资金比例',
  '[
    {"item": "牵头单位注册资金是否达标", "required": true},
    {"item": "项目负责人年龄是否符合要求", "required": true},
    {"item": "是否有省级以上研发平台", "required": true},
    {"item": "配套资金比例是否达到2:1", "required": true},
    {"item": "考核指标是否量化可考核", "required": true}
  ]',
  true
),
(
  '省级科技计划项目',
  '适用于各省科技厅科技计划项目',
  'provincial',
  '是否符合省内产业发展方向、地方配套政策',
  '技术先进性、解决的关键问题、预期经济效益',
  '在省内的产业基础、地方政府支持力度、就业带动',
  '[
    {"item": "申报单位是否在本省注册", "required": true},
    {"item": "项目是否符合省重点产业方向", "required": true},
    {"item": "是否有地方配套资金承诺", "required": false}
  ]',
  true
),
(
  '企业技术中心认定',
  '适用于国家/省级企业技术中心认定申报',
  'enterprise',
  '研发投入强度、研发人员占比、研发场地面积',
  '专利数量与质量、标准制定参与度、产学研合作',
  '近三年营收增长、新产品销售占比、行业地位',
  '[
    {"item": "研发投入占营收比例是否达标", "required": true},
    {"item": "研发人员占比是否达标", "required": true},
    {"item": "是否有独立研发场所", "required": true},
    {"item": "近三年是否有发明专利授权", "required": true}
  ]',
  true
),
(
  '通用评审模板',
  '适用于一般性项目评审，可自定义调整',
  'custom',
  '风险控制、合规性与逻辑严密性',
  '技术创新、前沿性与研发实力',
  '商业落地、团队资质与资源保障',
  '[]',
  true
);

-- RLS 策略
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates" ON review_templates
  FOR SELECT USING (is_system = true);

CREATE POLICY "Users can view own templates" ON review_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create templates" ON review_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND is_system = false);

CREATE POLICY "Users can update own templates" ON review_templates
  FOR UPDATE USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY "Users can delete own templates" ON review_templates
  FOR DELETE USING (created_by = auth.uid() AND is_system = false);
