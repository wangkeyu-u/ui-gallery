/**
 * UI Gallery AI Backend — Cloudflare Worker
 * 
 * Provides three endpoints:
 * POST /api/chat   — Natural language design conversation
 * POST /api/theme  — Extract theme DNA from a reference UI
 * POST /api/generate — Generate runnable HTML from a theme
 * GET  /api/health — Health check (used by frontend to detect AI availability)
 * 
 * API keys are stored as Workers Secrets (never in code):
 *   LLM_API_KEY   — Your LLM provider API key
 *   LLM_BASE_URL  — Base URL (default: https://api.openai.com/v1)
 *   LLM_MODEL     — Model name (default: gpt-4o-mini)
 * 
 * Deploy:
 *   npm install -g wrangler
 *   wrangler login
 *   wrangler secret put LLM_API_KEY
 *   wrangler deploy
 */

// ============================================================
// CORS — allow GitHub Pages and localhost
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function corsResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

// ============================================================
// System Prompts — enforce "find → deconstruct → replicate → adapt"
// ============================================================

const CHAT_SYSTEM_PROMPT = `你是一个 UI 设计总监。你的职责是帮客户找到目标 UI，准确拆解它，再尽可能忠实地复刻和迁移。

## 核心原则
1. 客户决定目标。你不能替客户改变目标。
2. 一旦客户选定某个 UI，目标就锁定。此后不擅自换字体、调配色、改结构。
3. 拆解的是事实，不是感觉。给出具体数值：颜色 hex、字号 px、间距 px、动画时长 ms。
4. 迁移内容，不改变设计语法。只做内容映射，保持参考的构图、比例、排版、色彩。
5. 无法一比一复刻时，明确指出缺失项和替代项，保持替代范围最小。

## 工作方式
- 客户描述模糊想法时，从画廊中推荐 2-3 个明显不同的方向。
- 每个推荐说明：名称、风格家族、为什么接近、关键设计特征。
- 客户反馈"太科技"/"太廉价"/"字体不对"时，只修正对应部分，不改动已锁定的部分。
- 被排除的设计模式不会重新出现。

## 返回格式
返回 JSON：
{
  "reply": "你的自然语言回复",
  "recommendations": [
    { "id": "项目ID", "name": "名称", "reason": "推荐原因", "styleFamily": "风格家族" }
  ],
  "actions": ["search:关键词", "detail:项目ID", "theme:项目ID"]
}`;

const THEME_SYSTEM_PROMPT = `你是一个设计 DNA 提取器。从客户选定的参考 UI 中提取结构化设计规范。

## 提取规则
- 颜色记录为真实 hex 值，不用"差不多的灰色"。
- 字体记录家族、字号、字重、行高、字距。
- 间距记录具体 px 值。
- 动画记录时长、缓动函数、触发条件。
- 组件记录默认/hover/active/focus/disabled 状态。

## 返回格式
返回 JSON，字段：
{
  "themeName": "主题名称",
  "coreMood": "核心气质",
  "useCase": "使用场景",
  "colorSystem": "背景 #xxx, 强调 #xxx, 文字 #xxx, 次级文字 #xxx, 边框 #xxx",
  "typeHierarchy": "标题: 字体/字号/字重, 正文: 字体/字号/行高",
  "spacing": "8px 网格, 卡片间距 20px, 内边距 24px",
  "borderRadius": "卡片 4px, 按钮 2px, 输入框 4px",
  "borderRules": "1px solid var(--border)",
  "shadowRules": "sm: 0 1px 2px, md: 0 4px 12px, lg: 0 8px 24px",
  "materialExpression": "材质表现",
  "artDirection": "图片艺术方向",
  "pageComposition": "页面构图",
  "componentForm": "组件形态",
  "interactionStates": "hover: translateY(-4px), focus: ring 2px",
  "animationRhythm": "scroll-reveal 0.6s, hover 0.3s",
  "responsiveRules": "桌面优先, 768px 断点, 移动端单列",
  "accessibility": "WCAG 2.1 AA, 焦点可见, 颜色对比 ≥ 4.5:1",
  "forbiddenPatterns": "不使用紫色渐变、模板化 Bento、过度毛玻璃",
  "references": "参考来源"
}`;

const GENERATE_SYSTEM_PROMPT = `你是一个高保真 UI 生成器。根据主题 DNA 生成可运行的单文件 HTML。

## 生成规则
1. 输出单个自包含 HTML 文件，内联 CSS 和 JS，无外部依赖。
2. 使用主题 DNA 中的精确 hex 颜色和字体。不近似、不替换。
3. 保持主题的构图、比例、排版、色彩、组件形态、交互节奏。
4. 动画使用主题 DNA 中的时长和缓动函数。
5. 目标 1280px 桌面视口，桌面优先。
6. 无 console 错误，无溢出。
7. 不发明未描述的区块。
8. 图标用内联 SVG 或纯 CSS。

## 内容映射
将主题的视觉结构应用到给定内容上，只做内容替换，不改变设计语法。

返回 JSON：
{
  "html": "完整的 HTML 文件内容",
  "notes": "生成说明，包括与参考的差异和替代项"
}`;

// ============================================================
// LLM API Call (OpenAI-compatible format)
// ============================================================

async function callLLM(env, systemPrompt, userMessage, context = '') {
  const baseUrl = env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const model = env.LLM_MODEL || 'gpt-4o-mini';
  const apiKey = env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error('LLM_API_KEY not configured');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({ role: 'system', content: `Context:\n${context}` });
  }

  messages.push({ role: 'user', content: userMessage });

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

// ============================================================
// Load gallery data for context
// ============================================================

async function loadGalleryContext(env) {
  // Try to load from KV or static data
  // For now, return a summary that the frontend will send
  return '';
}

// ============================================================
// Route Handler
// ============================================================

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/api/health') {
      return corsResponse({
        status: 'ok',
        aiEnabled: !!env.LLM_API_KEY,
        model: env.LLM_MODEL || 'gpt-4o-mini',
      });
    }

    // All other routes require POST
    if (request.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await request.json();
      const { message, context, projects } = body;

      // Build context from gallery data
      let fullContext = context || '';
      if (projects && projects.length > 0) {
        const projectSummaries = projects.map(p => 
          `- ${p.id}: ${p.name} | ${p.styleFamilyNameZh} | ${p.mood?.join(',')} | ${p.description}`
        ).join('\n');
        fullContext += `\n\n## 画廊中的项目\n${projectSummaries}`;
      }

      if (path === '/api/chat') {
        const result = await callLLM(env, CHAT_SYSTEM_PROMPT, message, fullContext);
        return corsResponse({ success: true, data: JSON.parse(result) });
      }

      if (path === '/api/theme') {
        const result = await callLLM(env, THEME_SYSTEM_PROMPT, message, fullContext);
        return corsResponse({ success: true, data: JSON.parse(result) });
      }

      if (path === '/api/generate') {
        const result = await callLLM(env, GENERATE_SYSTEM_PROMPT, message, fullContext);
        return corsResponse({ success: true, data: JSON.parse(result) });
      }

      return corsResponse({ error: 'Not found' }, 404);

    } catch (error) {
      return corsResponse({
        success: false,
        error: error.message,
        aiEnabled: !!env.LLM_API_KEY,
      }, 500);
    }
  },
};
