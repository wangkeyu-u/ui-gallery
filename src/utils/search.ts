import type { UIProject, SearchResult } from '../types';

// ============================================================
// Natural Language Search Engine
// Client-side, synonym-aware, diversity-controlled
// ============================================================

interface SearchIndex {
  projects: Array<{
    id: string;
    text: string;
    styleFamily: string;
    mood: string[];
    materials: string[];
    industry: string[];
    isDark: boolean;
    density: string;
  }>;
  synonyms: Record<string, string[]>;
  adjacentStyles: Record<string, string[]>;
  styleFamilies: Array<{
    key: string;
    name: string;
    nameZh: string;
    description: string;
    keywords: string[];
    mood: string[];
    materials: string[];
  }>;
}

let cachedIndex: SearchIndex | null = null;
let cachedProjects: UIProject[] | null = null;

async function loadIndex(): Promise<{ index: SearchIndex; projects: UIProject[] }> {
  if (cachedIndex && cachedProjects) {
    return { index: cachedIndex, projects: cachedProjects };
  }
  const [indexRes, projectsRes] = await Promise.all([
    fetch('./src/data/search-index.json').then(r => r.json()),
    fetch('./src/data/ui-projects.json').then(r => r.json()),
  ]);
  cachedIndex = indexRes;
  cachedProjects = projectsRes;
  return { index: indexRes, projects: projectsRes };
}

// Also try loading from the bundled data (Vite will handle this)
import indexData from '../data/search-index.json';
import projectsData from '../data/ui-projects.json';

function getIndex(): { index: SearchIndex; projects: UIProject[] } {
  return {
    index: indexData as SearchIndex,
    projects: projectsData as UIProject[],
  };
}

// ============================================================
// Query Parsing
// ============================================================

interface ParsedQuery {
  positive: string[];
  negative: string[];
  materials: string[];
  mood: string[];
  industry: string[];
  pageType: string[];
  density: string | null;
  isDark: boolean | null;
  raw: string;
}

// Negative constraint markers
const NEGATIVE_MARKERS = ['不要', '别', '排除', 'not', 'without', 'no ', 'except', '避免', '去掉'];
// Intensity / temperature modifiers
const TEMPERATURE_MAP: Record<string, string> = {
  '冷': 'cold',
  'cold': 'cold',
  '冷峻': 'cold',
  '温暖': 'warm',
  'warm': 'warm',
  '暖': 'warm',
};
const INTENSITY_MAP: Record<string, string> = {
  '高级': 'elegant',
  'premium': 'elegant',
  'luxury': 'elegant',
  '奢华': 'elegant',
  '克制': 'minimal',
  'restrained': 'minimal',
  '大胆': 'bold',
  'bold': 'bold',
  '极简': 'minimal',
  'minimal': 'minimal',
  '未来': 'futuristic',
  'future': 'futuristic',
};

export function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();
  const result: ParsedQuery = {
    positive: [],
    negative: [],
    materials: [],
    mood: [],
    industry: [],
    pageType: [],
    density: null,
    isDark: null,
    raw: query,
  };

  if (!lower) return result;

  // Split by negative markers
  const parts: { text: string; negative: boolean }[] = [];
  let remaining = lower;
  
  for (const marker of NEGATIVE_MARKERS) {
    const idx = remaining.indexOf(marker);
    if (idx >= 0) {
      const before = remaining.slice(0, idx).trim();
      const after = remaining.slice(idx + marker.length).trim();
      if (before) parts.push({ text: before, negative: false });
      if (after) {
        // Split "after" at commas or spaces to get just the negative part
        const negPart = after.split(/[,，]/)[0].trim();
        parts.push({ text: negPart, negative: true });
        const rest = after.slice(negPart.length).replace(/^[,，]\s*/, '').trim();
        if (rest) parts.push({ text: rest, negative: false });
      }
      remaining = '';
      break;
    }
  }
  
  if (parts.length === 0) {
    parts.push({ text: lower, negative: false });
  }

  const { index } = getIndex();
  const synonyms = index.synonyms;

  for (const part of parts) {
    const words = part.text.split(/[\s,，、]+/).filter(Boolean);
    for (const word of words) {
      // Expand synonyms
      const expanded = synonyms[word] || synonyms[word.toLowerCase()] || [word];
      
      for (const term of expanded) {
        if (part.negative) {
          result.negative.push(term);
        } else {
          result.positive.push(term);
        }

        // Categorize
        if (isMaterial(term)) result.materials.push(term);
        if (isMood(term)) result.mood.push(term);
        if (isIndustry(term)) result.industry.push(term);
        if (isPageType(term)) result.pageType.push(term);
        if (TEMPERATURE_MAP[term]) result.mood.push(TEMPERATURE_MAP[term]);
        if (INTENSITY_MAP[term]) result.mood.push(INTENSITY_MAP[term]);
      }
    }
  }

  // Detect dark/light preference
  if (lower.includes('暗') || lower.includes('dark') || lower.includes('黑')) {
    result.isDark = true;
  } else if (lower.includes('浅') || lower.includes('light') || lower.includes('白')) {
    result.isDark = false;
  }

  // Detect density
  if (lower.includes('密集') || lower.includes('dense') || lower.includes('信息量大')) {
    result.density = 'rich';
  } else if (lower.includes('留白') || lower.includes('sparse') || lower.includes('极简')) {
    result.density = 'minimal';
  }

  return result;
}

function isMaterial(term: string): boolean {
  const materials = ['metal', 'gold', 'glass', 'liquid', 'paper', 'concrete', 'marble', 'fabric', 'particle', 'chrome', 'steel', 'titanium', '金属', '金', '玻璃', '液态', '纸质', '大理石'];
  return materials.some(m => term.toLowerCase().includes(m));
}

function isMood(term: string): boolean {
  const moods = ['dark', 'elegant', 'bold', 'playful', 'minimal', 'futuristic', 'organic', 'cold', 'warm', 'raw', 'calm', 'refined'];
  return moods.some(m => term.toLowerCase().includes(m));
}

function isIndustry(term: string): boolean {
  const industries = ['luxury', 'automotive', 'fashion', 'music', 'finance', 'creative', 'technology', 'art', '汽车', '时尚', '音乐', '金融', '创意', '科技', '电商', '教育', '医疗'];
  return industries.some(i => term.toLowerCase().includes(i));
}

function isPageType(term: string): boolean {
  const types = ['landing', 'dashboard', 'portfolio', 'product', 'login', 'mobile', '落地页', '仪表盘', '作品集', '产品', '登录', '移动'];
  return types.some(t => term.toLowerCase().includes(t));
}

// ============================================================
// Scoring
// ============================================================

function scoreProject(
  project: UIProject,
  parsed: ParsedQuery,
  index: SearchIndex
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const searchText = project.searchText;
  const projectIndex = index.projects.find(p => p.id === project.id);

  // Positive matches
  for (const term of parsed.positive) {
    const termLower = term.toLowerCase();
    if (searchText.includes(termLower)) {
      score += 10;
      
      // Bonus for matching specific fields
      if (project.styleFamilyNameZh.includes(term) || project.styleFamilyName.toLowerCase().includes(termLower)) {
        score += 15;
        reasons.push(`风格匹配：${project.styleFamilyNameZh}`);
      }
      if (project.mood.some(m => m.includes(termLower))) {
        score += 8;
        reasons.push(`情绪匹配：${term}`);
      }
      if (project.materials.some(m => m.includes(termLower))) {
        score += 8;
        reasons.push(`材质匹配：${term}`);
      }
      if (project.industry.some(i => i.includes(termLower))) {
        score += 8;
        reasons.push(`行业匹配：${term}`);
      }
      if (project.interactions.some(i => i.includes(termLower))) {
        score += 5;
      }
      if (project.animations.some(a => a.includes(termLower))) {
        score += 5;
      }
    }
  }

  // Negative matches — heavily penalize
  for (const term of parsed.negative) {
    const termLower = term.toLowerCase();
    if (searchText.includes(termLower)) {
      score -= 30;
      reasons.push(`排除项命中：${term}`);
    }
  }

  // Dark/light preference
  if (parsed.isDark !== null) {
    if (projectIndex) {
      if (parsed.isDark === projectIndex.isDark) {
        score += 5;
      } else {
        score -= 15;
      }
    }
  }

  // Density preference
  if (parsed.density && project.density === parsed.density) {
    score += 5;
  }

  // Prompt availability bonus (more useful results)
  if (project.prompt && project.prompt.length > 100) {
    score += 2;
  }

  // Deduplicate reasons
  const uniqueReasons = [...new Set(reasons)];

  return { score, reasons: uniqueReasons };
}

// ============================================================
// Diversity Control
// ============================================================

function applyDiversityControl(
  results: SearchResult[],
  maxPerFamily: number = 3
): SearchResult[] {
  const familyCount: Record<string, number> = {};
  const output: SearchResult[] = [];

  // Sort by score descending
  const sorted = [...results].sort((a, b) => b.score - a.score);

  for (const result of sorted) {
    const family = result.project.styleFamily;
    if ((familyCount[family] || 0) < maxPerFamily) {
      output.push(result);
      familyCount[family] = (familyCount[family] || 0) + 1;
    }
  }

  // If we have too few results, add the filtered-out ones
  if (output.length < 12) {
    for (const result of sorted) {
      if (!output.includes(result)) {
        output.push(result);
        if (output.length >= 20) break;
      }
    }
  }

  return output;
}

// ============================================================
// Main Search Function
// ============================================================

export function search(query: string): {
  results: SearchResult[];
  explanation: string;
  parsed: ParsedQuery;
} {
  const { index, projects } = getIndex();
  const parsed = parseQuery(query);

  if (parsed.positive.length === 0 && parsed.negative.length === 0) {
    return {
      results: [],
      explanation: '请描述你想要的 UI 方向，例如「金属质感的汽车产品页」',
      parsed,
    };
  }

  // Score all projects
  const scored = projects.map(project => {
    const { score, reasons } = scoreProject(project, parsed, index);
    return { project, score, reasons } as SearchResult;
  });

  // Filter: only include results with positive score
  const positive = scored.filter(r => r.score > 0);

  // Apply diversity control
  const diverse = applyDiversityControl(positive);

  // Build explanation
  const explanation = buildExplanation(parsed, diverse.length);

  return { results: diverse, explanation, parsed };
}

function buildExplanation(parsed: ParsedQuery, resultCount: number): string {
  const parts: string[] = [];

  if (parsed.positive.length > 0) {
    parts.push(`寻找包含 <strong>${parsed.positive.join('、')}</strong> 的 UI`);
  }
  if (parsed.negative.length > 0) {
    parts.push(`排除 <strong>${parsed.negative.join('、')}</strong>`);
  }
  if (parsed.isDark !== null) {
    parts.push(parsed.isDark ? '偏好<strong>暗色</strong>' : '偏好<strong>浅色</strong>');
  }
  if (parsed.density) {
    parts.push(`偏好<strong>${parsed.density === 'rich' ? '高密度' : '低密度'}</strong>`);
  }

  const base = parts.length > 0 ? parts.join('，') + '。' : '';
  const count = resultCount > 0
    ? `找到 ${resultCount} 个匹配方向，已按风格多样性排序。`
    : '没有找到完全匹配的结果，以下是最接近的方向。';

  return base + count;
}

// ============================================================
// Adjacent Style Recommendations
// ============================================================

export function getAdjacentDirections(projectId: string): UIProject[] {
  const { index, projects } = getIndex();
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];

  const adjacentKeys = index.adjacentStyles[project.styleFamily] || [];
  const adjacent: UIProject[] = [];

  for (const key of adjacentKeys) {
    const candidates = projects.filter(p => p.styleFamily === key && p.id !== projectId);
    if (candidates.length > 0) {
      adjacent.push(candidates[0]);
    }
  }

  return adjacent;
}

export function findSimilar(projectId: string): UIProject[] {
  const { projects } = getIndex();
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];

  return projects
    .filter(p => p.id !== projectId && p.styleFamily === project.styleFamily)
    .slice(0, 6);
}

export function findDifferent(projectId: string): UIProject[] {
  const { projects } = getIndex();
  const project = projects.find(p => p.id === projectId);
  if (!project) return [];

  return projects
    .filter(p => p.id !== projectId && p.styleFamily !== project.styleFamily)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
}

// ============================================================
// Search Suggestions (for autocomplete)
// ============================================================

export function getSuggestions(query: string): string[] {
  if (!query || query.length < 1) {
    return [
      '金属质感的汽车产品页',
      '高端奢侈品牌，暗色',
      '创意机构作品集',
      '极简 SaaS 落地页',
      '3D WebGL 交互体验',
      '温暖但专业的教育产品',
      '东方未来主义',
      '数据密集的金融仪表盘',
    ];
  }

  const { index } = getIndex();
  const lower = query.toLowerCase();
  const suggestions: string[] = [];

  // Match from synonym keys
  for (const [key, values] of Object.entries(index.synonyms)) {
    if (key.includes(lower) || values.some(v => v.includes(lower))) {
      suggestions.push(key);
    }
  }

  // Match from style families
  for (const family of index.styleFamilies) {
    if (family.nameZh.includes(query) || family.name.toLowerCase().includes(lower) ||
        family.keywords.some(k => k.includes(lower))) {
      suggestions.push(family.nameZh);
    }
  }

  return [...new Set(suggestions)].slice(0, 8);
}
