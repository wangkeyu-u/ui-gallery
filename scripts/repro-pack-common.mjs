// ============================================================
// repro-pack-common.mjs
// Model-agnostic source of truth for the "replication task package".
// Pure ESM, no dependencies — imported by both:
//   - scripts/repro-pack.cjs  (writes to disk via dynamic import)
//   - src/utils/reproPack.ts  (frontend ZIP export)
// Keep this file the single source so the node tool and the web UI
// never drift apart.
// ============================================================

const ACCEPTED_LINK_STATES = new Set(['ok', 'redirected']);

function clean(value, fallback = '以截图为准') {
  if (Array.isArray(value)) return value.filter(Boolean).join('、') || fallback;
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function color(value, fallback = '从参考截图取色') {
  return value && typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getProjectLinkState(project, quality) {
  if (quality.linkStates?.[project.id]) return quality.linkStates[project.id];
  return quality.redirectedIds?.includes(project.id) ? 'redirected' : 'ok';
}

function isAcceptedProject(project, quality) {
  const verifiedIds = new Set(quality.verifiedIds || []);
  const listed = verifiedIds.has(project.id) || project.id.startsWith('v4-');
  return listed && ACCEPTED_LINK_STATES.has(getProjectLinkState(project, quality));
}

// Build project.json payload.
function buildProjectJson(project) {
  return {
    id: project.id,
    name: project.name,
    originalUrl: project.originalUrl || '',
    previewImage: project.previewImage || '',
    viewport: { width: 1280, height: 820 },
    styleFamily: project.styleFamily || '',
    styleFamilyName: project.styleFamilyName || project.styleFamilyNameZh || '',
    styleFamilyNameZh: project.styleFamilyNameZh || '',
    mood: Array.isArray(project.mood) ? project.mood : [],
    materials: Array.isArray(project.materials) ? project.materials : [],
    industry: Array.isArray(project.industry) ? project.industry : [],
    colors: {
      bg: project.colors?.bg || null,
      accent: project.colors?.accent || null,
      text: project.colors?.text || null,
    },
    knownLimitations: Array.isArray(project.knownLimitations) ? project.knownLimitations : [],
  };
}

// Build acceptance.json payload — what "done" means for the validator.
function buildAcceptanceJson(project) {
  return {
    projectId: project.id,
    viewport: { width: 1280, height: 820 },
    rules: [
      '画布必须为 1280 × 820，不得横向或纵向溢出 viewport。',
      '主要区块的数量和垂直顺序必须与参考截图一致。',
      '导航、标题、主图、按钮等关键元素的位置应接近参考截图。',
      '字号、间距、颜色和图片裁切必须经过截图对比修正，不能凭感觉。',
      '动态内容、原站字体、视频、3D 和版权资产允许记录为限制项，但不能假装已经还原。',
      '页面必须是真实 HTML/CSS/React 渲染，不能把参考截图直接作为整页背景或 img 冒充复刻。',
    ],
    thresholds: {
      ssimMin: 0.9,
      pixelDifferenceMax: 0.12,
      allowHorizontalOverflow: false,
    },
    allowedTolerance: [
      '字体抗锯齿在不同系统下的细微差异。',
      '无法取得的品牌图片可用等比例占位，但须保持尺寸与位置。',
      '视频首帧或 3D 画面的单帧差异。',
    ],
    hardFail: [
      'candidate.png 与 reference.png 是同一张静态图片（未真正复刻）。',
      '整页只用一张图片覆盖，没有真实 DOM 结构。',
    ],
  };
}

// Build the exact prompt copied from the UI and embedded into brief.md.
function buildModelPrompt(project) {
  const p = project || {};
  const colorsLine = [
    `背景 ${color(p.colors?.bg)}`,
    `强调 ${color(p.colors?.accent)}`,
    `文字 ${color(p.colors?.text)}`,
  ].join('；');
  return `你是一名对像素误差敏感的前端复刻工程师。请根据我同时附上的参考截图，实现 ${clean(p.name, '这个项目')} 的 1280 × 820 桌面首屏。

已知画像（只作检索线索，若与截图冲突，以截图为准）：
- 行业：${clean(p.industry)}
- 风格：${clean(p.styleFamilyNameZh || p.styleFamilyName)}；${clean(p.styleDescription)}
- 情绪：${clean(p.mood)}
- 材质：${clean(p.materials)}
- 布局线索：${clean(p.layoutTraits)}
- 颜色线索：${colorsLine}

不可妥协的规则：
1. reference.png 是唯一视觉事实来源。不要依据品牌常识、原站记忆或风格描述补画截图中看不到的内容。
2. 只实现 1280 × 820 桌面首屏；不要添加手机布局、额外区块、渐变、卡片、圆角或动效，除非截图明确存在。
3. 必须使用真实 HTML/CSS/React DOM。禁止把 reference.png 设为整页背景、直接显示为整页图片，或以任何方式伪装成复刻结果。
4. 未知的尺寸、间距、字号、行高、颜色和裁切都要从截图测量或取样；不要套通用模板。
5. 无法取得的字体、视频、3D 或版权资产可以用等比例占位，但必须保持几何位置，并在交付中明确记录限制。

按三个阶段执行：

阶段 A｜先测量，暂不写代码
- 给出版面分区及其大致坐标/宽高比例。
- 列出字体层级、关键间距、主色样本、图片裁切方式和层叠关系。
- 标出无法从截图确定的内容，以及你将采用的最保守假设。

阶段 B｜实现
- 先锁定页面几何结构与视觉重心，再处理字体、颜色、边框和素材细节。
- 用 CSS 变量管理测得的颜色与间距；结构要可维护，但不要为了“组件化”改变截图布局。
- 首屏在 1280 × 820 下不得出现横向溢出，关键元素位置和内容密度要与参考图一致。

阶段 C｜视觉回归
- 在 1280 × 820 渲染 candidate.png，与 reference.png 做叠加或像素差异对比。
- 至少完成两轮“截图 → 对比 → 修正”，按顺序修复：整体几何 → 字体与换行 → 色彩与边框 → 图片裁切与细节。
- 不要只说“看起来接近”；交付时报告已修正项、仍存在的差异及原因。

最终交付：可运行代码、candidate.png，以及简短的视觉回归记录。不要声称 1:1，除非验证指标确实达到要求。`;
}

// Build brief.md — the human-readable task handed to any image+code model.
function buildBrief(project) {
  const p = project || {};
  const limitations = Array.isArray(p.knownLimitations) && p.knownLimitations.length
    ? p.knownLimitations.map((x) => `- ${x}`).join('\n')
    : '- 暂无已知限制；复刻中发现的限制必须补充记录。';

  return `# 复刻任务包 · ${clean(p.name, '未命名项目')}

> 把本包连同 \`reference.png\` 交给支持图像输入与前端编码的模型。完成后用 \`npm run repro:validate\` 做本地视觉验证。

## 模型执行提示词

${buildModelPrompt(p)}

## 已知限制

${limitations}

## 包内约定

- \`reference.png\`：1280 × 820 视觉事实来源。
- \`project.json\`：结构化画像与限制项。
- \`acceptance.json\`：机器可读验收规则。
`;
}

function buildPackage(project) {
  return {
    'brief.md': buildBrief(project),
    'project.json': JSON.stringify(buildProjectJson(project), null, 2) + '\n',
    'acceptance.json': JSON.stringify(buildAcceptanceJson(project), null, 2) + '\n',
  };
}

export {
  ACCEPTED_LINK_STATES,
  clean,
  getProjectLinkState,
  isAcceptedProject,
  buildProjectJson,
  buildAcceptanceJson,
  buildModelPrompt,
  buildBrief,
  buildPackage,
};
