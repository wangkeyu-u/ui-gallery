import type { UIProject } from '../types';

const clean = (values: string[]) => values.filter(Boolean).join('、') || '以截图为准';

export function buildReplicaBrief(project: UIProject) {
  return `请根据我同时附上的参考截图，复刻一个桌面网页首屏。

参考：${project.name}
画布：1280 × 820（仅桌面端；不要自行添加手机布局）
用途/行业：${clean(project.industry)}
风格：${project.styleFamilyNameZh}；${project.styleDescription}
情绪：${clean(project.mood)}
材质：${clean(project.materials)}
布局线索：${clean(project.layoutTraits)}
颜色：背景 ${project.colors.bg || '从截图取色'}；强调 ${project.colors.accent || '从截图取色'}；文字 ${project.colors.text || '从截图取色'}

执行规则：
1. 截图是唯一视觉事实来源。先分析版式、比例、留白、层级、取色和图像裁切，再写代码。
2. 不要把描述扩写成新的设计；未知值从截图测量，不要套通用模板或擅自添加区块。
3. 使用可维护的 HTML/CSS/React；文字和图片可用等比例占位，但占位必须保持截图中的尺寸与位置。
4. 完成后在 1280 × 820 截图，与参考图叠加比对；至少修正一轮间距、字号、颜色和裁切差异。
5. 交付时列出仍无法忠实复刻的内容（例如原站字体、视频、3D 或受版权保护的资产）。

验收标准：首屏结构、主要元素位置、视觉重心、颜色关系和密度应与附图一致。单独使用这段文字不能实现 1:1，必须把参考截图一并提供给支持看图的模型。`;
}
