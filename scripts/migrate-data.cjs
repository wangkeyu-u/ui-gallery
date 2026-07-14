/**
 * Data Migration & Enrichment Script
 * 
 * Reads preview-data.json (230 items) and outputs:
 * - src/data/ui-projects.json    (53 award-winning UI projects with aesthetic tags)
 * - src/data/components.json     (177 component libraries with tech metadata)
 * - src/data/style-families.json (style family taxonomy)
 * - src/data/search-index.json   (pre-built search index)
 */

const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'preview-data.json'), 'utf8'));

// ============================================================
// STYLE FAMILY TAXONOMY
// Maps the 170 technical themes to ~15 aesthetic style families
// ============================================================

const STYLE_FAMILIES = {
  '3d-webgl': {
    name: '3D / WebGL',
    nameZh: '三维 / WebGL',
    description: '沉浸式 3D 场景、WebGL 着色器、物理交互',
    keywords: ['3d', 'webgl', 'three.js', 'shader', 'canvas', 'gpu', 'immersive', '3d-webgl'],
    mood: ['futuristic', 'immersive', 'bold'],
    materials: ['digital-light', 'particle', 'liquid-metal'],
  },
  'luxury': {
    name: 'Luxury',
    nameZh: '奢华',
    description: '金色质感、衬线优雅、克制留白、高端品牌',
    keywords: ['luxury', 'lux', 'cartier', 'gucci', 'balenciaga', 'louis vuitton', '奢侈', '珠宝', '高端'],
    mood: ['elegant', 'dark', 'refined', 'exclusive'],
    materials: ['gold', 'silk', 'marble', 'glass'],
  },
  'creative-agency': {
    name: 'Creative Agency',
    nameZh: '创意机构',
    description: '大胆排版、流体动效、实验性交互、品牌叙事',
    keywords: ['creative', 'agency', 'cuberto', 'obys', 'studio', '创意', '机构', '数字代理'],
    mood: ['bold', 'playful', 'experimental', 'energetic'],
    materials: ['fluid', 'organic', 'digital-paint'],
  },
  'editorial': {
    name: 'Editorial / Magazine',
    nameZh: '编辑 / 杂志',
    description: '瑞士排版、内容驱动、层次分明、阅读优先',
    keywords: ['editorial', 'magazine', 'typography', 'swiss', '编辑', '杂志', '排版'],
    mood: ['clean', 'structured', 'intellectual'],
    materials: ['paper', 'ink'],
  },
  'brutalist': {
    name: 'Brutalist',
    nameZh: '粗野主义',
    description: '裸露结构、系统字体、强烈对比、反装饰',
    keywords: ['brutalist', 'brutalism', 'raw', '粗野', '裸露'],
    mood: ['raw', 'confrontational', 'honest'],
    materials: ['concrete', 'raw-html'],
  },
  'minimal': {
    name: 'Minimal',
    nameZh: '极简',
    description: '大量留白、有限色彩、功能优先、克制动效',
    keywords: ['minimal', 'clean', 'simple', '极简', '简洁', '留白'],
    mood: ['calm', 'focused', 'pure'],
    materials: ['air', 'light'],
  },
  'product': {
    name: 'Product / SaaS',
    nameZh: '产品 / SaaS',
    description: '清晰信息架构、功能展示、转化导向',
    keywords: ['product', 'saas', 'landing', 'app', '产品', '落地页'],
    mood: ['professional', 'clear', 'trustworthy'],
    materials: ['screen', 'interface'],
  },
  'automotive': {
    name: 'Automotive',
    nameZh: '汽车',
    description: '金属质感、动态视角、机械精密、性能展示',
    keywords: ['car', 'auto', 'automotive', 'cupra', 'volvo', '汽车', '赛车'],
    mood: ['powerful', 'precise', 'cold'],
    materials: ['metal', 'carbon-fiber', 'glass'],
  },
  'fashion': {
    name: 'Fashion',
    nameZh: '时尚',
    description: '大片式摄影、季节性色彩、品牌叙事',
    keywords: ['fashion', 'style', 'trend', '时尚', '时装'],
    mood: ['trendy', 'aspirational', 'editorial'],
    materials: ['fabric', 'photography'],
  },
  'experimental': {
    name: 'Experimental',
    nameZh: '实验',
    description: '非常规交互、生成艺术、技术探索',
    keywords: ['experiment', 'experimental', 'art', 'generative', '实验', '生成'],
    mood: ['curious', 'unexpected', 'artistic'],
    materials: ['code', 'light', 'particle'],
  },
  'portfolio': {
    name: 'Portfolio',
    nameZh: '作品集',
    description: '个人展示、项目叙事、独特个性',
    keywords: ['portfolio', 'personal', 'folio', '作品集', '个人'],
    mood: ['personal', 'distinctive', 'curated'],
    materials: ['varies'],
  },
  'music': {
    name: 'Music / Audio',
    nameZh: '音乐 / 音频',
    description: '节奏感动效、音频可视化、沉浸式体验',
    keywords: ['music', 'audio', 'sound', '音乐', '音频'],
    mood: ['rhythmic', 'immersive', 'vibrant'],
    materials: ['sound-wave', 'light'],
  },
  'brand': {
    name: 'Brand Experience',
    nameZh: '品牌体验',
    description: '品牌世界构建、故事驱动、情感连接',
    keywords: ['brand', 'experience', '品牌', '体验'],
    mood: ['emotional', 'cohesive', 'memorable'],
    materials: ['varies'],
  },
  'fintech': {
    name: 'Fintech / Data',
    nameZh: '金融 / 数据',
    description: '数据密集、图表驱动、专业可信',
    keywords: ['fintech', 'finance', 'bank', 'data', '金融', '数据'],
    mood: ['professional', 'precise', 'trustworthy'],
    materials: ['screen', 'data-visualization'],
  },
  'government': {
    name: 'Government / Public',
    nameZh: '政府 / 公共',
    description: '高可访问性、规范排版、服务导向',
    keywords: ['government', 'public', 'gov', '政府', '公共'],
    mood: ['official', 'accessible', 'structured'],
    materials: ['paper', 'screen'],
  },
};

// ============================================================
// SYNONYM MAP for theme normalization
// ============================================================

const THEME_SYNONYMS = {
  'Material Design': 'material',
  'Material Design 3': 'material',
  'Material 3': 'material',
  'Material 风': 'material',
  'Material 风 / Vue3': 'material',
  'Bootstrap 风': 'bootstrap',
  'Bootstrap 风格': 'bootstrap',
  '免费 Bootstrap 风': 'bootstrap',
  'Radix + Tailwind 白盒': 'radix-tailwind',
  'Radix 系 / Tailwind': 'radix-tailwind',
  'Radix 风格': 'radix',
  'Radix 风格组件': 'radix',
  'shadcn 风格区块': 'radix-tailwind',
  'Headless / 可定制': 'headless',
  'Headless / 可访问': 'headless',
  'Headless / 无样式': 'headless',
  'Headless / 表格表单': 'headless',
  '无样式 / a11y': 'headless',
  '无样式 / 可定制': 'headless',
  '无样式 / 表单原语': 'headless',
  '无样式 / 跨框架': 'headless',
  '无样式原语': 'headless',
  '无样式原语 / Headless': 'headless',
  '无样式原语 / a11y': 'headless',
  '企业级': 'enterprise',
  '企业级 (Angular 版 antd)': 'enterprise',
  '企业级 (Carbon)': 'enterprise',
  '企业级 (IBM)': 'enterprise',
  '企业级 / 30+ 主题': 'enterprise',
  '企业级 / 80+ 组件': 'enterprise',
  '企业级 / 与 React 对齐': 'enterprise',
  '企业级 / 主题化': 'enterprise',
  '企业级 / 华为': 'enterprise',
  '企业级 / 后台': 'enterprise',
  '企业级 / 响应式': 'enterprise',
  '企业级 / 商业': 'enterprise',
  '企业级 / 数据': 'enterprise',
  '企业级 / 数据密集': 'enterprise',
  '企业级 / 设计代币': 'enterprise',
  '企业级 / 设计系统': 'enterprise',
  '企业设计系统': 'enterprise',
  '企业样式': 'enterprise',
  '设计系统': 'design-system',
  '设计系统 / Figma 组件': 'design-system',
  '设计系统 / Tailwind': 'design-system',
  '设计系统组件 / Figma': 'design-system',
  '设计语言 / 规范': 'design-system',
  '现代产品 UI / 设计系统': 'design-system',
  'Tailwind 组件': 'tailwind',
  'Tailwind 组件 / 设计系统': 'tailwind',
  'Tailwind / 极简': 'tailwind',
  'Tailwind 区块': 'tailwind',
  'Tailwind 插件': 'tailwind',
  'Bits UI / Tailwind': 'tailwind',
  '3D / WebGL': '3d-webgl',
  '3D / WebGL 标杆': '3d-webgl',
  'WebGL / AI': '3d-webgl',
  '实验 / WebGL': '3d-webgl',
  '奢侈': 'luxury',
  '奢侈品牌': 'luxury',
  '创意': 'creative-agency',
  '创意机构': 'creative-agency',
  '数字代理': 'creative-agency',
  '品牌': 'brand',
  '品牌体验': 'brand',
  '互动': 'interactive',
  '互动体验': 'interactive',
  '实验': 'experimental',
  '产品': 'product',
  '产品级': 'product',
  '产品落地页': 'product',
  '作品集': 'portfolio',
  '作品集 / 平滑滚动': 'portfolio',
  '作品集 / 电商': 'portfolio',
  '作品集模板': 'portfolio',
  '机构': 'creative-agency',
  '机构作品集': 'portfolio',
  '汽车': 'automotive',
  '汽车 / 品牌': 'automotive',
  '时尚': 'fashion',
  '音乐': 'music',
  '金融科技': 'fintech',
  '金融设计系统': 'fintech',
  '金融 / 企业': 'fintech',
};

// ============================================================
// AESTHETIC EXTRACTION from prompt text
// ============================================================

function extractAesthetics(item) {
  const prompt = (item.prompt || '').toLowerCase();
  const theme = (item.theme || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const desc = (item.desc || '').toLowerCase();
  const allText = `${prompt} ${theme} ${name} ${desc}`;

  // Extract colors
  const colors = {
    bg: null,
    accent: null,
    text: null,
  };
  
  const bgMatch = prompt.match(/background[^#]*(#[0-9a-f]{6})/i) || 
                  prompt.match(/bg[^#]*(#[0-9a-f]{6})/i) ||
                  prompt.match(/(dark|black|near-black)\s*(?:background|bg)?[^#]*(#[0-9a-f]{6})/i);
  if (bgMatch) colors.bg = bgMatch[1];
  
  const accentMatch = prompt.match(/(?:accent|primary|gold|golden)[^#]*(#[0-9a-f]{6})/i);
  if (accentMatch) colors.accent = accentMatch[1];

  // Detect dark/light
  const isDark = /dark|black|near-black|#0[0-9a-f]{5}|#1[0-9a-f]{5}/i.test(prompt) ||
                 theme.includes('奢侈') || theme.includes('3d') || theme.includes('webgl');

  // Extract fonts
  let fontFamily = null;
  const fontMatch = prompt.match(/font[^:]*:\s*['"]?([^'"\n,]+)/i) ||
                    prompt.match(/(?:font-family|typeface)[^:]*:\s*['"]?([^'"\n,]+)/i);
  if (fontMatch) fontFamily = fontMatch[1].trim();

  // Detect interaction patterns
  const interactions = [];
  if (/smooth.?scroll|lenis|locomotive/i.test(allText)) interactions.push('smooth-scroll');
  if (/magnetic/i.test(allText)) interactions.push('magnetic');
  if (/custom.?cursor|cursor.?effect/i.test(allText)) interactions.push('custom-cursor');
  if (/parallax/i.test(allText)) interactions.push('parallax');
  if (/horizontal.?scroll|pin.*scroll|scroll.?pin/i.test(allText)) interactions.push('pinned-scroll');
  if (/hover.?reveal|hover.?image/i.test(allText)) interactions.push('hover-reveal');
  if (/drag/i.test(allText)) interactions.push('drag');
  if (/3d.?rotation|rotate.*3d|three\.js/i.test(allText)) interactions.push('3d-rotation');

  // Detect animation types
  const animations = [];
  if (/scroll.?reveal|scroll.?trigger|intersection/i.test(allText)) animations.push('scroll-reveal');
  if (/fade.?in|fade.?up/i.test(allText)) animations.push('fade-in');
  if (/scale|zoom/i.test(allText)) animations.push('scale');
  if (/marquee|infinite.?scroll/i.test(allText)) animations.push('marquee');
  if (/keyframe|@keyframe/i.test(allText)) animations.push('keyframe');
  if (/gsap|tween/i.test(allText)) animations.push('tween');
  if (/webgl|shader|glsl/i.test(allText)) animations.push('shader');

  // Detect layout traits
  const layoutTraits = [];
  if (/full.?bleed|full.?width|full.?screen|100vh/i.test(allText)) layoutTraits.push('fullbleed');
  if (/grid|columns/i.test(allText)) layoutTraits.push('grid');
  if (/split.?screen|two.?column|sidebar/i.test(allText)) layoutTraits.push('split');
  if (/centered|center/i.test(allText)) layoutTraits.push('centered');
  if (/horizontal|sideways/i.test(allText)) layoutTraits.push('horizontal');

  // Detect mood
  const mood = [];
  if (isDark) mood.push('dark');
  if (/elegan|refined|sophisticat|luxury/i.test(allText)) mood.push('elegant');
  if (/bold|strong|powerful/i.test(allText)) mood.push('bold');
  if (/playful|fun|whimsical/i.test(allText)) mood.push('playful');
  if (/clean|minimal|simple/i.test(allText)) mood.push('minimal');
  if (/futur|tech|digital/i.test(allText)) mood.push('futuristic');
  if (/warm|organic|natural/i.test(allText)) mood.push('organic');
  if (/cold|industrial|mechanic/i.test(allText)) mood.push('cold');

  // Detect materials
  const materials = [];
  if (/gold|golden|amber/i.test(allText)) materials.push('gold');
  if (/metal|chrome|steel|titanium/i.test(allText)) materials.push('metal');
  if (/glass|glassmorphism|transparen/i.test(allText)) materials.push('glass');
  if (/liquid|fluid|water/i.test(allText)) materials.push('liquid');
  if (/particle|dot|point/i.test(allText)) materials.push('particle');
  if (/paper|cardboard/i.test(allText)) materials.push('paper');
  if (/concrete|raw|brutal/i.test(allText)) materials.push('concrete');
  if (/marble|stone/i.test(allText)) materials.push('marble');
  if (/fabric|textile|silk/i.test(allText)) materials.push('fabric');

  // Detect density
  let density = 'moderate';
  if (/sparse|minimal|lots of space|whitespace|negative space/i.test(allText)) density = 'minimal';
  if (/dense|compact|information.?rich|data.?heavy/i.test(allText)) density = 'rich';

  // Detect industry
  const industry = [];
  if (/luxury|jewel|cartier|gucci|balenciaga|louis vuitton/i.test(allText)) industry.push('luxury');
  if (/car|automotive|vehicle|cupra|volvo/i.test(allText)) industry.push('automotive');
  if (/fashion|apparel|clothing/i.test(allText)) industry.push('fashion');
  if (/music|audio|sound/i.test(allText)) industry.push('music');
  if (/finance|bank|fintech|payment/i.test(allText)) industry.push('finance');
  if (/agency|studio|creative/i.test(allText)) industry.push('creative');
  if (/tech|software|saas|app/i.test(allText)) industry.push('technology');
  if (/art|design|gallery|exhibition/i.test(allText)) industry.push('art-design');

  return { colors, isDark, fontFamily, interactions, animations, layoutTraits, mood, materials, density, industry };
}

// ============================================================
// STYLE FAMILY ASSIGNMENT
// ============================================================

function assignStyleFamily(item) {
  const theme = item.theme || '';
  const name = (item.name || '').toLowerCase();
  const desc = (item.desc || '').toLowerCase();
  const text = `${theme} ${name} ${desc}`.toLowerCase();

  // Direct theme mapping first
  if (THEME_SYNONYMS[theme]) {
    const normalized = THEME_SYNONYMS[theme];
    // Map component library categories to style families
    if (normalized === 'material') return 'minimal';
    if (normalized === 'bootstrap') return 'product';
    if (normalized === 'enterprise') return 'product';
    if (normalized === 'design-system') return 'product';
    if (normalized === 'tailwind') return 'minimal';
    if (normalized === 'headless') return 'minimal';
    if (normalized === 'radix-tailwind') return 'minimal';
    if (normalized === 'radix') return 'minimal';
  }

  // For UI projects, match by keywords
  for (const [familyKey, family] of Object.entries(STYLE_FAMILIES)) {
    for (const kw of family.keywords) {
      if (text.includes(kw.toLowerCase())) return familyKey;
    }
  }

  // Fallback
  if (item.kind === 'proj') return 'portfolio';
  return 'product';
}

// ============================================================
// BUILD ENRICHED DATA
// ============================================================

const uiProjects = [];
const componentLibs = [];

for (const item of raw) {
  const aesthetics = extractAesthetics(item);
  const styleFamily = assignStyleFamily(item);
  const family = STYLE_FAMILIES[styleFamily] || STYLE_FAMILIES['product'];

  // Generate search text
  const searchText = [
    item.name,
    item.theme,
    item.vendor,
    item.desc || '',
    item.fw ? (Array.isArray(item.fw) ? item.fw.join(' ') : item.fw) : '',
    ...(item.chips || []),
    family.name,
    family.nameZh,
    ...family.keywords,
    ...aesthetics.mood,
    ...aesthetics.materials,
    ...aesthetics.industry,
    ...aesthetics.interactions,
    ...aesthetics.animations,
  ].filter(Boolean).join(' ').toLowerCase();

  if (item.kind === 'proj') {
    uiProjects.push({
      id: item.id,
      name: item.name,
      description: item.desc || family.description,
      source: item.id.startsWith('awd-') ? 'Award-winning' : 'Curated',
      originalUrl: item.link,
      author: item.vendor || '',
      projectType: item.id.startsWith('awd-') ? 'award' : 'project',
      styleFamily,
      styleFamilyName: family.name,
      styleFamilyNameZh: family.nameZh,
      styleDescription: family.description,
      mood: aesthetics.mood.length ? aesthetics.mood : family.mood,
      materials: aesthetics.materials.length ? aesthetics.materials : family.materials,
      industry: aesthetics.industry,
      density: aesthetics.density,
      isDark: aesthetics.isDark,
      colors: aesthetics.colors,
      fontFamily: aesthetics.fontFamily,
      interactions: aesthetics.interactions,
      animations: aesthetics.animations,
      layoutTraits: aesthetics.layoutTraits,
      previewImage: item.img,
      prompt: item.prompt || '',
      hifiPassed: item.hifiPassed || false,
      animOk: item.animOk || false,
      capabilities: [
        'prompt',
        ...(item.prompt ? ['design-spec'] : []),
        ...(item.hifiPassed ? ['verified'] : []),
      ],
      searchText,
    });
  } else {
    // Component library
    const normalizedTheme = THEME_SYNONYMS[item.theme] || 'other';
    componentLibs.push({
      id: item.id,
      name: item.name,
      description: item.desc || '',
      framework: Array.isArray(item.fw) ? item.fw : [item.fw].filter(Boolean),
      category: normalizedTheme,
      categoryLabel: item.theme,
      vendor: item.vendor || '',
      documentationUrl: item.link,
      repoUrl: item.repo || '',
      license: '', // To be filled
      installCommand: '', // To be filled
      components: item.chips || [],
      previewImage: item.img,
      styleFamily,
      codeAvailable: !!item.repo,
      capabilities: [
        ...(item.repo ? ['open-source'] : []),
        ...(item.chips?.length ? ['component-library'] : []),
        'component-reference',
      ],
      searchText,
    });
  }
}

// ============================================================
// BUILD SEARCH INDEX
// ============================================================

// Synonym dictionary for natural language search
const SYNONYMS = {
  '金属': ['metal', 'chrome', 'steel', 'titanium', 'gold', 'silver', 'metallic', '金属', '铬', '钢', '钛', '金', '银'],
  '金属质感': ['metal', 'metallic', 'chrome', 'steel', '金属'],
  'liquid': ['fluid', 'water', 'liquid', '液态', '流体', '水'],
  '液态': ['liquid', 'fluid', '液态', '流体'],
  '高端': ['luxury', 'premium', 'elegant', 'refined', '高端', '奢华', '高级', '精致'],
  '奢华': ['luxury', 'premium', '奢侈', 'lux'],
  '高级': ['premium', 'luxury', 'elegant', 'refined', '高级', '高端'],
  '科技': ['tech', 'technology', 'future', 'futuristic', 'digital', 'webgl', '3d', '科技', '未来', '数字'],
  '未来': ['future', 'futuristic', '未来'],
  '温暖': ['warm', 'organic', 'natural', '温暖', '有机', '自然'],
  '冷': ['cold', 'cool', 'industrial', '冷', '工业'],
  '工业': ['industrial', 'mechanical', 'raw', '工业', '机械'],
  '机械': ['mechanical', 'industrial', '机械'],
  '精密': ['precise', 'precision', '精密', '精确'],
  '克制': ['restrained', 'minimal', 'clean', 'simple', '克制', '极简', '简洁'],
  '极简': ['minimal', 'clean', 'simple', '极简', '简洁', '留白'],
  '大胆': ['bold', 'strong', '大胆', '强烈'],
  '东方': ['eastern', 'oriental', 'asian', '东方', '亚洲'],
  '赛博': ['cyber', 'cyberpunk', 'neon', '赛博', '霓虹'],
  '霓虹': ['neon', 'cyber', '霓虹'],
  '玻璃': ['glass', 'glassmorphism', 'transparent', '玻璃', '毛玻璃'],
  '纸质': ['paper', 'cardboard', '纸质', '纸'],
  '暗色': ['dark', 'black', '暗色', '黑色', '深色'],
  '浅色': ['light', 'white', '浅色', '白色', '亮色'],
  '动画': ['animation', 'animated', 'motion', '动效', '动画'],
  '滚动': ['scroll', 'parallax', '滚动', '视差'],
  '创意': ['creative', 'agency', 'studio', '创意', '机构'],
  '汽车': ['car', 'automotive', 'vehicle', '汽车', '赛车'],
  '时尚': ['fashion', 'style', '时尚', '时装'],
  '音乐': ['music', 'audio', 'sound', '音乐', '音频'],
  '金融': ['finance', 'fintech', 'bank', '金融'],
  '数据': ['data', 'chart', 'dashboard', '数据', '图表'],
  '游戏': ['game', 'gaming', '游戏'],
  '教育': ['education', 'edu', '教育'],
  '医疗': ['medical', 'health', '医疗', '健康'],
  '电商': ['ecommerce', 'shop', 'store', '电商', '商城'],
  '作品集': ['portfolio', 'personal', '作品集', '个人'],
  '品牌': ['brand', 'branding', '品牌'],
  '实验': ['experimental', 'experiment', '实验'],
  '互动': ['interactive', 'interaction', '互动', '交互'],
  '3d': ['3d', 'webgl', 'three', '三维'],
  'webgl': ['webgl', '3d', 'shader', 'gpu'],
  '产品': ['product', 'saas', 'landing', '产品', '落地页'],
  '落地页': ['landing', 'product', '落地页', '产品页'],
  'dashboard': ['dashboard', 'admin', 'panel', '仪表盘', '后台'],
  '登录': ['login', 'signin', 'auth', '登录'],
  '移动': ['mobile', 'app', '移动', '应用'],
};

// Adjacent style relationships for "find similar" / "find different"
const ADJACENT_STYLES = {
  '3d-webgl': ['experimental', 'creative-agency', 'music'],
  'luxury': ['fashion', 'brand', 'editorial'],
  'creative-agency': ['experimental', 'portfolio', 'brand'],
  'editorial': ['minimal', 'luxury', 'portfolio'],
  'brutalist': ['experimental', 'editorial', 'minimal'],
  'minimal': ['editorial', 'product', 'portfolio'],
  'product': ['minimal', 'fintech', 'enterprise'],
  'automotive': ['product', '3d-webgl', 'experimental'],
  'fashion': ['luxury', 'editorial', 'brand'],
  'experimental': ['3d-webgl', 'creative-agency', 'brutalist'],
  'portfolio': ['creative-agency', 'minimal', 'editorial'],
  'music': ['3d-webgl', 'experimental', 'creative-agency'],
  'brand': ['creative-agency', 'luxury', 'fashion'],
  'fintech': ['product', 'minimal', 'government'],
  'government': ['minimal', 'fintech', 'product'],
};

const searchIndex = {
  projects: uiProjects.map(p => ({
    id: p.id,
    text: p.searchText,
    styleFamily: p.styleFamily,
    mood: p.mood,
    materials: p.materials,
    industry: p.industry,
    isDark: p.isDark,
    density: p.density,
  })),
  synonyms: SYNONYMS,
  adjacentStyles: ADJACENT_STYLES,
  styleFamilies: Object.entries(STYLE_FAMILIES).map(([key, val]) => ({
    key,
    name: val.name,
    nameZh: val.nameZh,
    description: val.description,
    keywords: val.keywords,
    mood: val.mood,
    materials: val.materials,
  })),
};

// ============================================================
// WRITE OUTPUT FILES
// ============================================================

const outDir = path.join(__dirname, '..', 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'ui-projects.json'), JSON.stringify(uiProjects, null, 2));
fs.writeFileSync(path.join(outDir, 'components.json'), JSON.stringify(componentLibs, null, 2));
fs.writeFileSync(path.join(outDir, 'style-families.json'), JSON.stringify(
  Object.entries(STYLE_FAMILIES).map(([key, val]) => ({ key, ...val })), null, 2
));
fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

// Summary
console.log('=== MIGRATION COMPLETE ===');
console.log(`UI Projects: ${uiProjects.length}`);
console.log(`Component Libraries: ${componentLibs.length}`);
console.log(`Style Families: ${Object.keys(STYLE_FAMILIES).length}`);
console.log(`Synonym Entries: ${Object.keys(SYNONYMS).length}`);
console.log(`Adjacent Style Mappings: ${Object.keys(ADJACENT_STYLES).length}`);

// Style family distribution
const famDist = {};
uiProjects.forEach(p => { famDist[p.styleFamily] = (famDist[p.styleFamily] || 0) + 1; });
console.log('\n=== UI PROJECT STYLE FAMILY DISTRIBUTION ===');
Object.entries(famDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

// Component category distribution
const catDist = {};
componentLibs.forEach(c => { catDist[c.category] = (catDist[c.category] || 0) + 1; });
console.log('\n=== COMPONENT CATEGORY DISTRIBUTION ===');
Object.entries(catDist).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});
