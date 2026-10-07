# Curated community UI-prompt techniques (sourced from the web)
# 来源: 51CTO / 腾讯云开发者 / Datawhale easy-vibe / xnic 等社区「AI 生成高保真 UI」提示词指南。
# 本文件由 assemble-hifi.js 作为 WEB_EXTRA 追加到每个站点高保真提示词末尾。

## 数值化约束(比模糊副词有效 10 倍)
- 禁止用「大一点 / 小一点 / 圆角大」这类模糊词;一律给具体数值:圆角 12px、辅助文字 0.875rem(14px)、间距 24px。
- 给出的 hex 颜色、时长、缓动曲线视为**硬约束**,不得近似或四舍五入。
- 大标题字间距可微调 letter-spacing: -0.02em 提升精致感。

## 色彩系统
- 给出完整色板并标注用途:主色(按钮/图标/强调文字)、强调色、中性灰阶(50–950,如 Tailwind 灰度)、背景色、文字主/次色。
- **避免使用纯黑 #000**,改用深灰 #111827 提升阅读舒适度。
- 渐变背景写法:linear-gradient(135deg, #xxx, #xxx)。
- 彩色阴影:用主色的半透明版本作阴影色,如 0 8px 20px rgba(59,130,246,0.15)。

## 排版系统
- 明确字体族与层级:标题用 Inter/Playfair/Space Grotesk + 字重,正文用 Inter/system-ui + 行高 1.5–1.7。
- 用字号/字重/颜色建立清晰的三级层次(H1 2rem/600、H2 1.5rem、正文 1rem)。

## 间距与尺寸
- 采用 8px 网格系统(所有内外边距为 8 的倍数)。
- 内容最大宽度 1280px,左右自动边距;卡片内边距 24px,卡片间隙 20px。
- 移动端按钮点击区不小于 44×44px。

## 阴影与层次
- 浅阴影:0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)。
- 中等悬浮阴影:0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)。
- 强阴影:0 20px 25px -5px rgba(0,0,0,0.1)。

## 组件细节(写给生成器的具体规格)
- 按钮:圆角 8px,内边距 12px 24px,字重 500;:hover 上浮 translateY(-1px) 并加深背景色 5%;:active 缩放 scale(0.98) + 背景再深一级(如 #1677ff → #0958d9);:focus-visible 显示 2px 主色 ring。松开恢复,transition: all 150ms ease。
- 卡片:白底,圆角 16–20px,边框 1px solid rgba(0,0,0,0.05);hover 上浮 4px + 阴影加深 + 图片轻微放大 1.02;active 可轻微下沉 translateY(1px)。
- 输入框:圆角 12px,边框 1px solid #E5E7EB;:focus 时边框变主色(2px) + box-shadow ring;placeholder 色 #9CA3AF。
- 导航链接:hover 时颜色过渡(transition: color 200ms) + 下划线从左滑入(width: 0→100%);active 颜色再深一级。
- 图标:Feather / Heroicons 风格,20×20,颜色继承文字色;用内联 SVG。
- 分隔线:1px solid #E5E7EB,或渐变透明线。

## 动效与交互(高频有效指令)
- 全局过渡:transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)。
- 页面入场:元素依次淡入上浮(staggered reveal),交错延迟 50ms。
- 悬停反馈:卡片上浮 4px + 阴影加深 + 图片 scale(1.02)。
- 加载态:骨架屏用 pulse 动画,或简洁旋转指示器。
- 点击波纹:主色半透明扩散圈(移动端)。
- **点击反馈(:active):** 按下瞬间缩放 scale(0.96~0.98) + 背景色加深 10~15%(如 #1677ff → #0958d9)。松开恢复原尺寸(transition: transform 100ms)。这是"点击效果"的核心——必须实现,不可省略。
- **焦点反馈(:focus-visible):** 交互元素获得键盘焦点时,显示 2px 主色 ring(box-shadow: 0 0 0 2px var(--ring) 或 0 0 0 3px rgba(primary,0.3))。鼠标点击不显示 ring(用 :focus-visible 而非 :focus)。
- **悬停反馈(:hover):** 按钮 hover 时背景色提亮 5~10% + translateY(-1px) + 阴影加深;链接 hover 时颜色变化 + 可选下划线滑入;图标按钮 hover 时背景出现圆形/圆角高亮(如 bg-primary/10)。
- 若提示词中已给出从真实站点提取的交互状态终态值(见"交互状态规格"段),**以那些真实值为准**,本段仅作默认补充。

## 风格与氛围关键词(按目标网站气质选用)
- 现代:玻璃拟物(Glassmorphism)、新拟态(Neumorphism)、极简主义、Bento 网格、暗黑模式。
- 情绪:温暖柔和 / 专业可靠 / 科技前沿 / 清爽干净 / 奢华质感。
- 质感:毛玻璃 + 微光边框、柔和长阴影、弥散渐变、微纹理/噪点背景。

## 反模式(务必避免)
- 不要让 AI 回到「统计平均」的默认审美:必须明确给出偏离方向(具体风格 + 具体色值)。
- 不要发明未被描述的区块;忠于给定的首屏内容。
- 不要使用占位符/lorem ipsum;严格使用给定的真实文案。
