/**
 * @file openrouter.ts
 * @input FileInput, ChatMessage, AgentType (from @/types), Tavily 搜索结果
 * @output AI 评审函数: runComprehensiveReview, runSynthesizerAgent, runChatSession, runExpertRecommendation, extractProjectMetadata
 * @pos 核心 AI 能力层 - 封装所有与 OpenRouter/LLM 的交互，是评审系统的大脑
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

// ===========================================
// OpenRouter API 统一调用层
// ===========================================

import { FileInput, ChatMessage, AgentType } from '@/types';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 三个不同的评审专家模型配置
const MODELS = {
  reviewerA: process.env.MODEL_REVIEWER_A || 'anthropic/claude-sonnet-4',
  reviewerB: process.env.MODEL_REVIEWER_B || 'google/gemini-2.5-flash-preview',
  reviewerC: process.env.MODEL_REVIEWER_C || 'openai/gpt-4o',
  synthesizer: process.env.MODEL_SYNTHESIZER || 'anthropic/claude-sonnet-4',
  chat: process.env.MODEL_CHAT || 'anthropic/claude-haiku-4',
  // Claude handles structured table output more reliably than Gemini
  expertSearch: process.env.MODEL_EXPERT_SEARCH || 'anthropic/claude-sonnet-4',
};

// 根据 AgentType 获取对应模型
export function getModelForAgent(agentType: AgentType): string {
  switch (agentType) {
    case AgentType.REVIEWER_A: return MODELS.reviewerA;
    case AgentType.REVIEWER_B: return MODELS.reviewerB;
    case AgentType.REVIEWER_C: return MODELS.reviewerC;
    case AgentType.SYNTHESIZER: return MODELS.synthesizer;
    case AgentType.EXPERT_HUNTER: return MODELS.expertSearch;
    default: return MODELS.chat;
  }
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
}


// 通用 OpenRouter 调用函数
async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number = 0.4
): Promise<string> {
  // -------------------------------------------------------------
  // MOCK MODE: 如果没有 API Key，返回模拟数据以支持演示模式
  // -------------------------------------------------------------
  if (!OPENROUTER_API_KEY) {
    console.warn('⚠️ 未检测到 OPENROUTER_API_KEY，使用模拟数据模式');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟网络延迟

    const lastMsg = messages[messages.length - 1].content;

    // 简单的模拟响应逻辑
    if (model === MODELS.expertSearch) {
      return `| 专家姓名 | 所属单位 | 职称 | 研究方向匹配度 | 相关链接 |
|---|---|---|---|---|
| 张教授 | 清华大学 | 教授/博导 | ⭐⭐⭐⭐⭐ (完全匹配) | [主页](https://example.com) |
| 李研究员 | 中科院计算所 | 研究员 | ⭐⭐⭐⭐ (高度相关) | [主页](https://example.com) |
| 王教授 | 上海交通大学 | 教授 | ⭐⭐⭐⭐ (高度相关) | [主页](https://example.com) |`;
    }

    if (model === MODELS.synthesizer) {
      return `# 专家组综合评审决议

## 一、专家组综合结论
**[建议支持]**

专家组经综合研判，认为该项目技术路线清晰，创新性较强，团队基础扎实。虽在商业化路径上存在一定不确定性，但整体具备较好的培育价值。

## 二、意见一致性分析
1. **技术可行性**：三位专家均认可项目提出的核心算法架构，认为其具有较高的学术价值和落地潜力。
2. **团队资质**：一致认为团队配置合理，核心成员在相关领域具有深厚的研究积累。

## 三、分歧点分析
*   **市场前景**：专家C对短期内的市场渗透率持保留态度，而专家B认为应着眼于长期的技术壁垒构建。专家组最终认为，项目初期应聚焦于示范应用，逐步拓展市场。

## 四、项目核心优势
1.  **技术领先**：提出的异构融合架构在国内处于领先水平。
2.  **场景明确**：针对特定工业场景的优化方案具有很强的针对性。
3.  **产学研结合**：依托高校科研力量与企业工程化能力的结合。

## 五、关键问题清单
*   **数据安全**：需进一步完善数据隐私保护机制（专家A）。
*   **成本控制**：大规模部署时的硬件成本需进一步通过算法优化来降低（专家C）。

## 六、最终修改建议
建议申请方在实施方案中补充详细的数据安全合规性说明，并制定具体的年度成本下降路线图。`;
    }

    // 默认评审意见
    return `# 项目评审意见

## 1. 合规性与形式审查
项目申报材料齐全，符合申报指南的基本要求。技术指标设定清晰，预算编制基本合理。
*   **符合度**：符合
*   **完整性**：完整

## 2. 技术创新与先进性
该项目提出了一种新的解决方案，具有一定的创新性。
*   **技术路线**：逻辑清晰，可行性较高。
*   **对比分析**：相比传统方法，在效率上有约 15%-20% 的提升预期。

## 3. 团队与资源保障
团队结构合理，包含技术专家和工程实施人员。依托单位具备相应的实验条件。

## 4. 问题与风险点
*   **风险 1**：市场推广难度可能被低估。
*   **风险 2**：部分核心部件依赖进口，存在供应链风险。

## 5. 评审结论
**[有条件推荐]**

建议进一步细化产业化实施路径。`;
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_APP_NAME ? encodeURIComponent(process.env.NEXT_PUBLIC_APP_NAME) : 'SmartGrant',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter API Error:', error);
    throw new Error(`OpenRouter API 调用失败: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content?.trim() || '未能生成有效内容';
}

// 构建上下文内容 (从文件解析后的文本)
function buildContextContent(proposals: FileInput[], guidelines: FileInput[]): string {
  let context = '';

  context += '\n\n【附件集合1：项目申报指南/政策要求】\n';
  if (guidelines.length === 0) {
    context += '（未提供具体指南文件）\n';
  } else {
    guidelines.forEach((file, index) => {
      context += `\n[指南文件 ${index + 1}: ${file.fileName || '文本内容'}]\n`;
      context += file.content + '\n';
    });
  }

  context += '\n\n【附件集合2：项目申报材料/商业计划书/附件】\n';
  if (proposals.length === 0) {
    context += '（未提供项目申报材料）\n';
  } else {
    proposals.forEach((file, index) => {
      context += `\n[申报材料 ${index + 1}: ${file.fileName || '文本内容'}]\n`;
      context += file.content + '\n';
    });
  }

  return context;
}


/**
 * 综合评审 Agent - 使用指定的模型
 */
export async function runComprehensiveReview(
  proposals: FileInput[],
  guidelines: FileInput[],
  agentType: AgentType,
  reviewerName: string,
  focusArea: string
): Promise<string> {
  const model = getModelForAgent(agentType);

  // 使用更严格的格式要求，确保不同模型输出一致
  const systemPrompt = `你是${reviewerName}，资深科研项目评审专家，专业领域：${focusArea}。

请严格按照以下格式输出评审意见（不要修改格式结构，不要添加额外章节）：

---

# 项目评审意见书

评审专家：${reviewerName}
评审日期：${new Date().toISOString().split('T')[0]}
项目名称：（从材料中提取）
申报单位：（从材料中提取）

---

## 一、合规性与形式审查

### 1.1 硬性指标核查

| 审查项目 | 指南要求 | 实际情况 | 符合性 |
|----------|----------|----------|--------|
| 负责人年龄 | ≤55周岁 | XX岁 | ✅符合/❌不符合 |
| 注册资金 | ≥2000万元 | XXX万元 | ✅符合/❌不符合 |
| 研发平台 | 省级及以上 | XXX | ✅符合/❌不符合 |
| 配套资金比例 | ≥2:1 | X:X | ✅符合/❌不符合 |
| （其他关键指标） | ... | ... | ... |

### 1.2 合规性结论

结论：✅ 合格 / ⚠️ 需补充材料 / ❌ **不合格**

---

## 二、技术创新与先进性

### 2.1 核心创新点
（用2-3句话概括最突出的技术创新）

### 2.2 技术路线评估
（技术路线是否科学可行？存在什么技术风险？）

### 2.3 国内外对标
（与国内外同类技术对比，处于什么水平？领先/持平/落后？）

---

## 三、团队与资源保障

### 3.1 团队能力
（核心成员背景是否匹配？有无关键人才缺失？）

### 3.2 依托单位条件
（研发设施、资金、产业化能力如何？）

---

## 四、问题与风险

> ⚠️ 以下是本项目存在的主要问题和风险：

| 风险类型 | 具体问题 | 严重程度 |
|----------|----------|----------|
| 技术风险 | （描述） | 高/中/低 |
| 团队风险 | （描述） | 高/中/低 |
| 财务风险 | （描述） | 高/中/低 |
| 市场风险 | （描述） | 高/中/低 |

---

## 五、综合评审结论

评审结果：🟢 推荐 / 🟡 有条件推荐 / 🔴 **不推荐**

核心判断依据：
（用2-3句话说明做出此判断的关键理由）

---`;

  const contextContent = buildContextContent(proposals, guidelines);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: contextContent + '\n\n请严格按照上述格式输出评审意见：' },
  ];

  console.log(`[${reviewerName}] 使用模型: ${model}`);
  return callOpenRouter(model, messages, 0.2); // Lower temperature for consistency
}

/**
 * 综合报告 Agent (首席评审官)
 */
export async function runSynthesizerAgent(
  reviewA: string,
  reviewB: string,
  reviewC: string
): Promise<string> {
  const prompt = `角色：你是一名首席评审官（Chief Review Officer）。
任务：你收到了三位独立评审专家对同一个项目的评审意见。你的工作是汇总这些意见，进行交叉验证，并生成一份最终的《专家组综合评审决议》。

【专家A 意见】（侧重合规性与风险控制）：
${reviewA}

【专家B 意见】（侧重技术创新与前沿性）：
${reviewB}

【专家C 意见】（侧重商业落地与资源保障）：
${reviewC}

请撰写最终报告，要求：
1. **专家组综合结论**：明确给出最终结论（优先支持/建议支持/建议暂缓/不予支持）。
2. **意见一致性分析**：指出三位专家在哪些方面达成了强烈共识。
3. **分歧点分析**：(如果有) 指出专家意见不一致的地方，并给出你的最终判断。
4. **项目核心优势**：提炼3-4个最大的亮点。
5. **关键问题清单**：汇总所有专家指出的硬伤和风险。
6. **最终修改建议**：给申请方的具体整改建议。

风格：权威、全面、逻辑严密。`;

  const messages: OpenRouterMessage[] = [{ role: 'user', content: prompt }];

  console.log(`[首席评审官] 使用模型: ${MODELS.synthesizer}`);
  return callOpenRouter(MODELS.synthesizer, messages, 0.2);
}


/**
 * 聊天 Agent
 */
export async function runChatSession(
  message: string,
  history: ChatMessage[],
  proposals: FileInput[],
  guidelines: FileInput[],
  finalReportContext: string
): Promise<string> {
  const systemPrompt = `你是一个智能评审助手。用户正在就一个科研项目进行咨询。
请基于用户上传的"项目申报材料"和"申报指南"来回答问题。如果文件中没有提到，请如实告知。

【已有评审结论参考】：
${finalReportContext || '暂无评审结论'}`;

  const contextContent = buildContextContent(proposals, guidelines);

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `以下是项目相关文档：${contextContent}` },
  ];

  // 添加历史对话 (最近4条)
  const recentHistory = history.slice(-4);
  recentHistory.forEach((msg) => {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  messages.push({ role: 'user', content: message });

  return callOpenRouter(MODELS.chat, messages, 0.5);
}


import { searchExperts, extractKeywordsWithAI, TavilySearchResult } from './tavily';

/**
 * 专家遴选 Agent (结合 AI 深度分析 + Tavily 搜索)
 */
export async function runExpertRecommendation(proposals: FileInput[]): Promise<string> {
  // 1. 提取项目内容
  const projectContent = proposals.map(p => p.content).join('\n');

  // 2. 使用 AI 深度分析提取技术关键词
  console.log('[专家遴选] 开始 AI 深度分析项目材料...');
  const analysis = await extractKeywordsWithAI(projectContent);
  const keywords = analysis.keywords;
  const domains = analysis.domains;
  console.log('[专家遴选] AI 提取的关键词:', keywords);
  console.log('[专家遴选] AI 识别的学科领域:', domains);

  // 3. 使用 Tavily 搜索专家信息
  let searchResults: TavilySearchResult[] = [];
  try {
    searchResults = await searchExperts(keywords);
    console.log('[专家遴选] 搜索到结果数:', searchResults.length);
  } catch (error) {
    console.error('[专家遴选] Tavily 搜索失败:', error);
  }

  // 4. 构建 AI 提示词
  const searchContext = searchResults.length > 0
    ? `\n\n【网络搜索结果】：\n${searchResults.slice(0, 8).map((r, i) =>
      `${i + 1}. ${r.title} (${r.url})`
    ).join('\n')}`
    : '';

  // 使用更简洁、更聚焦的 prompt
  const systemPrompt = `你是专家遴选专员。请为以下科研项目推荐 15 位评审专家，建立一个多维度、高水平的评审专家库。

【重要规则】
1. 只输出专家表格，不要输出任何其他内容（不要评论、不要项目分析）
2. 姓名必须是完整的中文人名（2-4个字），不能是职称或描述
3. 每位专家必须填写完整的5列信息
4. 专家背景需要多元化，覆盖学术界、产业界和投资界

【地域分布要求】
- 深圳本地：6 人（重点关注：深圳大学、南科大、鹏城实验室、深圳先进院、华为、腾讯、比亚迪、大疆等）
- 广东省内（非深圳）：5 人（重点关注：中山大学、华南理工、季华实验室、松山湖实验室等）
- 全国知名专家：4 人（行业顶级专家，不限地域）

【专家类型结构】
- 学术界（高校教授/研究员）：约 50%
- 产业界（企业CTO/技术总监/首席科学家）：约 40%
- 投资/行业专家（知名机构合伙人/行业协会专家）：约 10%

【输出格式 - 严格按此格式】

## 深圳本地专家

| 姓名 | 单位 | 职称 | 研究方向 | 推荐理由 |
|------|------|------|----------|----------|
| 王明华 | 南方科技大学 | 教授 | 固态电池材料 | 固态电解质领域专家，主持多项国家级项目 |
| 张伟强 | 比亚迪股份 | 技术总监 | 动力电池 | 负责电池技术研发，了解产业化需求 |
| ... | ... | ... | ... | ... |

## 广东省内专家

| 姓名 | 单位 | 职称 | 研究方向 | 推荐理由 |
|------|------|------|----------|----------|
| ... | ... | ... | ... | ... |

## 全国专家

| 姓名 | 单位 | 职称 | 研究方向 | 推荐理由 |
|------|------|------|----------|----------|
| ... | ... | ... | ... | ... |

【项目技术领域】${keywords.join('、')}
【学科方向】${domains.join('、')}
${searchContext}`;

  let context = '【项目材料摘要】\n';
  proposals.forEach((file) => {
    context += file.content.slice(0, 2500) + '\n';
  });

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: context + '\n\n请按照格式输出专家推荐表格：' },
  ];

  console.log(`[专家遴选] 使用模型: ${MODELS.expertSearch}`);
  return callOpenRouter(MODELS.expertSearch, messages, 0.2); // Lower temperature for consistency
}

/**
 * 从项目材料中提取项目元数据
 * 使用轻量级 AI 模型提取：项目来源方(甲方)、项目名称、项目承担单位
 */
export async function extractProjectMetadata(content: string): Promise<{
  source: string;      // 项目来源方/甲方
  projectName: string; // 项目名称
  organization: string; // 项目承担单位
  fullName: string;    // 完整格式: 甲方-项目名称-承担单位
}> {
  const prompt = `请从以下项目材料中提取关键信息，严格按照JSON格式返回：

{
  "source": "项目来源方或甲方名称（如：深圳市科技创新委员会、国家自然科学基金委等）",
  "projectName": "项目名称（如：面向高安全性的高比能固态锂电池关键材料与技术研发）",
  "organization": "项目承担单位（如：XX科技有限公司、XX大学等）"
}

如果某项信息无法提取，填写"未知"。

项目材料内容：
${content.slice(0, 3000)}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://smartgrant.ai',
        'X-Title': 'SmartGrant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4', // 使用轻量级模型
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const source = parsed.source || '未知';
      const projectName = parsed.projectName || '未知';
      const organization = parsed.organization || '未知';

      // 构建完整名称
      const parts = [source, projectName, organization].filter(p => p && p !== '未知');
      const fullName = parts.length > 0 ? parts.join(' - ') : '新项目';

      console.log('[项目元数据提取] 成功:', { source, projectName, organization, fullName });
      return { source, projectName, organization, fullName };
    }

    throw new Error('无法解析JSON');
  } catch (error) {
    console.error('[项目元数据提取] 失败:', error);
    return {
      source: '未知',
      projectName: '未知',
      organization: '未知',
      fullName: '新项目'
    };
  }
}
