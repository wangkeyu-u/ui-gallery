// ============================================================
// repro-pack-common.cjs
// Model-agnostic source of truth for the "replication task package".
// Pure JS, no dependencies — imported by both:
//   - scripts/repro-pack.cjs  (writes to disk)
//   - src/utils/reproPack.ts  (frontend ZIP export)
// Keep this file the single source so the node tool and the web UI
// never drift apart.
// ============================================================

const VALIDATOR_VERSION = 'repro-validator/1.0.0';

function clean(value, fallback = '以截图为准') {
  if (Array.isArray(value)) return value.filter(Boolean).join('、') || fallback;
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function color(value, fallback = '从参考截图取色') {
  return value && typeof value === 'string' && value.trim() ? value.trim() : fallback;
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

// Build brief.md — the human-readable task handed to any image+code model.
function buildBrief(project) {
  const p = project || {};
  const colorsLine = [
    `背景 ${color(p.colors?.bg)}`,
    `强调 ${color(p.colors?.accent)}`,
    `文字 ${color(p.colors?.text)}`,
  ].join('；');
  const limitations = Array.isArray(p.knownLimitations) && p.knownLimitations.length
    ? p.knownLimitations.map((x) => `- ${x}`).join('\n')
    : '- 暂无已知限制（如复刻中发现无法还原的内容，请在此追加并记录到 project.json 的 knownLimitations）。';

  return `# 复刻任务包 · ${clean(p.name, '未命名项目')}

> 本包与任何具体 AI 模型无关。把它交给任意“既能看参考截图、又能写 HTML/CSS/React 代码”的 AI，
> 拿回代码后，用本地验证工具（\`npm run repro:validate\`）比对还原程度。

## 1. 项目画像（已确认信息）

| 项 | 值 |
| --- | --- |
| 名称 | ${clean(p.name, '未命名项目')} |
| 原始链接 | ${clean(p.originalUrl, '未提供')} |
| 行业 | ${clean(p.industry)} |
| 风格家族 | ${clean(p.styleFamilyNameZh || p.styleFamilyName)} |
| 风格描述 | ${clean(p.styleDescription, '以截图为准')} |
| 情绪 | ${clean(p.mood)} |
| 材质 | ${clean(p.materials)} |
| 明暗 | ${p.isDark ? '暗色' : '浅色'} |
| 内容密度 | ${clean(p.density)} |
| 布局线索 | ${clean(p.layoutTraits)} |
| 颜色 | ${colorsLine} |

## 2. 硬性范围

- **只实现 1280 × 820 的桌面首屏。** 不做手机端，不输出响应式手机布局。
- 参考截图（\`reference.png\`）是**唯一视觉事实来源**。
- 任何未知尺寸、间距、字号都必须**从截图测量**，不能套通用模板或预设断点。
- **禁止**擅自增加区块、渐变、卡片或移动端设计。截图里没有的东西不要编出来。

## 3. 执行步骤

1. 先分析参考截图：版式、比例、留白、层级、取色、图像裁切与文字位置。
2. 用可维护的 HTML/CSS/React 实现首屏；文字与图片可用等比例占位，但占位必须保持截图中的尺寸与位置。
3. 完成后在 **1280 × 820** 截图，与 \`reference.png\` 叠加对比，至少修正一轮间距、字号、颜色与裁切差异。
4. 交付时列出仍无法忠实复刻的内容（原站字体、视频、3D、受版权保护的资产等）。

## 4. 验收标准（交给本地验证工具）

- 画布必须为 1280 × 820，不允许横向溢出。
- 主要区块数量和顺序一致。
- 导航、标题、主图、按钮等关键元素位置接近。
- 字号、间距、颜色和图片裁切需经截图对比。
- 动态内容、原站字体、视频、3D 和版权资产允许记录为限制项，但不能假装已经还原。

## 5. 已知限制（允许记录，但不能假装已还原）

${limitations}

---
\`project.json\` 提供结构化画像，\`acceptance.json\` 提供机器可读的验收规则。两者与 \`brief.md\` 一致。
`;
}

function buildPackage(project) {
  return {
    'brief.md': buildBrief(project),
    'project.json': JSON.stringify(buildProjectJson(project), null, 2) + '\n',
    'acceptance.json': JSON.stringify(buildAcceptanceJson(project), null, 2) + '\n',
  };
}

module.exports = {
  VALIDATOR_VERSION,
  clean,
  buildProjectJson,
  buildAcceptanceJson,
  buildBrief,
  buildPackage,
};
