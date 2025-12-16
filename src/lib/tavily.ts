// ===========================================
// Tavily 搜索 API 封装
// ===========================================
// 用于专家遴选的外部搜索功能

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
}

/**
 * 调用 Tavily 搜索 API
 */
export async function searchWithTavily(
  query: string,
  options: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    includeDomains?: string[];
  } = {}
): Promise<TavilyResponse> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY 未配置');
  }

  // 支持多个 API Key 轮询 (用逗号分隔)
  const apiKeys = TAVILY_API_KEY.split(',').map(k => k.trim());
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: options.searchDepth || 'advanced',
      max_results: options.maxResults || 10,
      include_answer: options.includeAnswer ?? true,
      include_domains: options.includeDomains || [],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Tavily API Error:', error);
    throw new Error(`Tavily 搜索失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 搜索专家信息
 * 针对中国高校和科研院所的专家进行搜索
 */
export async function searchExperts(keywords: string[]): Promise<TavilySearchResult[]> {
  const allResults: TavilySearchResult[] = [];

  // 构建搜索查询 - 优化为更精准的搜索策略
  const queries = [
    // 深圳本地专家搜索
    ...keywords.slice(0, 2).map(keyword =>
      `${keyword} 专家 教授 深圳大学 OR 南方科技大学 OR 哈工大深圳 OR 清华深圳研究院`
    ),
    // 产业界专家搜索
    ...keywords.slice(0, 2).map(keyword =>
      `${keyword} CTO OR 技术总监 OR 首席科学家 深圳 企业`
    ),
    // 广东省内专家搜索
    keywords[0] ? `${keywords[0]} 专家 教授 中山大学 OR 华南理工 OR 暨南大学` : '',
  ].filter(Boolean);

  // 并行搜索多个关键词
  const searchPromises = queries.slice(0, 4).map(query =>
    searchWithTavily(query, {
      searchDepth: 'advanced',
      maxResults: 5,
      includeDomains: [
        'edu.cn',      // 中国高校
        'cas.cn',      // 中科院
        'baike.baidu.com', // 百度百科
        'scholar.google.com', // Google Scholar
        'researchgate.net',
        'linkedin.cn',
      ],
    }).catch(err => {
      console.error('搜索失败:', err);
      return { results: [], query };
    })
  );

  const results = await Promise.all(searchPromises);

  results.forEach(res => {
    allResults.push(...res.results);
  });

  // 去重 (按 URL)
  const uniqueResults = allResults.filter((result, index, self) =>
    index === self.findIndex(r => r.url === result.url)
  );

  return uniqueResults;
}

/**
 * AI 深度分析提取技术关键词
 * 使用 LLM 深入理解项目背景，提取精准的技术领域关键词
 */
export async function extractKeywordsWithAI(content: string): Promise<{
  keywords: string[];
  domains: string[];
  searchQueries: string[];
}> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    // 降级到简单提取
    console.log('[关键词提取] API Key 未配置，使用简单提取');
    return {
      keywords: extractKeywordsSimple(content),
      domains: [],
      searchQueries: [],
    };
  }

  const prompt = `# 任务
请深入分析以下科研项目申报材料，提取用于专家遴选的精准技术关键词。

# 分析要点
1. **核心技术领域**：项目涉及的主要技术方向（如：固态电解质、锂离子电池正极材料）
2. **细分研究方向**：具体的研究子领域（如：硫化物电解质、高镍三元材料）
3. **应用场景**：技术的目标应用领域（如：新能源汽车、储能系统）
4. **学科交叉**：涉及的交叉学科（如：材料科学、电化学、纳米技术）

# 输出格式（严格JSON）
{
  "keywords": ["关键词1", "关键词2", ...],  // 5-8个精准技术关键词
  "domains": ["领域1", "领域2", ...],       // 2-3个一级学科领域
  "searchQueries": ["查询1", "查询2", ...]  // 3-4个用于搜索专家的查询语句
}

# 项目材料
${content.slice(0, 4000)}`;

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
        model: 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content_text = data.choices?.[0]?.message?.content || '';

    // 提取 JSON
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[AI关键词提取] 成功:', parsed);
      return {
        keywords: parsed.keywords || [],
        domains: parsed.domains || [],
        searchQueries: parsed.searchQueries || [],
      };
    }

    throw new Error('无法解析AI返回的JSON');
  } catch (error) {
    console.error('[AI关键词提取] 失败，降级到简单提取:', error);
    return {
      keywords: extractKeywordsSimple(content),
      domains: [],
      searchQueries: [],
    };
  }
}

/**
 * 简单关键词提取（降级方案）
 */
function extractKeywordsSimple(content: string): string[] {
  const techPatterns = [
    /固态电池|锂电池|电解质|正极|负极|隔膜|电芯/g,
    /人工智能|机器学习|深度学习|大模型|神经网络|NLP|计算机视觉/g,
    /新能源|光伏|风电|储能|氢能|碳中和/g,
    /芯片|半导体|集成电路|封装|EDA|制程/g,
    /生物医药|基因|蛋白质|细胞|抗体|mRNA|CAR-T/g,
    /量子计算|量子通信|量子密钥|量子纠缠/g,
    /机器人|自动驾驶|传感器|激光雷达|SLAM/g,
    /5G|6G|物联网|边缘计算|云计算/g,
  ];

  const keywords: string[] = [];

  techPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      keywords.push(...matches);
    }
  });

  return [...new Set(keywords)].slice(0, 8);
}

/**
 * 从项目材料中提取技术关键词（兼容旧接口）
 */
export function extractKeywords(content: string): string[] {
  return extractKeywordsSimple(content);
}
