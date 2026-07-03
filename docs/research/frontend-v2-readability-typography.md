# 调研任务 B1：高可读性排版与配色落地建议

> 产出日期：2026-07-03  
> 适用范围：`site/` 纯静态中文 AI 技术资产情报站。本文只给研究与落地建议，不修改站点代码。  
> 核心约束：系统级字体；无外部字体/CDN；保留暖色羊皮纸基调与墨绿 `--accent`；不得回退 WCAG AA。

---

## 0. 结论先行

本站现有方向是对的：暖纸面、暖黑墨色、墨绿强调色、中文黑体正文、中文衬线大标题，已经比“重新换一套流行 dashboard 色板”更贴合产品。V2 不应换风格，而应把可读性和看板密度标准化成 token：

- 正文/卡片说明：移动端不低于 `16px`，行高 `1.56-1.68`；只有 chip、时间戳、短标签可用 `12-14px`。
- 中文长段落：目标 `36-40` 个汉字/行，CSS 上用 `max-inline-size: 38em` 比 `ch` 更稳；英文长段可参考 `66ch`。
- 色彩：`--ink`、`--bg`、`--paper`、`--accent` 主轴可保留；需补强 `--paper-strong`、`--line-strong`、`--cat-subagent`、`--signal` 的使用规则或 token。
- 对比度：WCAG AA 是底线；暖纸背景上的正文建议接近 AAA。APCA 只作感知补充，不能替代 WCAG 2.x 合规。
- 工具结果：`/ui-ux-pro-max` 支持“新闻编辑感、强层级、移动 16px、行高 1.5-1.75、对比度 4.5:1、触控 44px”等原则；不采纳其 Google Fonts、深色 slate+荧光绿、视频首屏、红蓝新闻色板和超大负字距。

---

## 1. 方法与输入

本轮读取并使用了以下材料：

- 本地技能：`C:\Users\Administrator\.codex\skills\ui-ux-pro-max\SKILL.md`。
- 本地技能：`C:\Users\Administrator\.codex\skills\frontend-design\SKILL.md`。
- 旧调研：`docs/research/frontend-redesign-parchment-cjk-typography.md`。
- 当前实现：`site/styles.css`。
- 当前 HTML 基线：`site/index.html` 已有 `<html lang="zh-CN">` 与移动 viewport。

按要求运行了 `/ui-ux-pro-max` CLI：

```powershell
chcp 65001
$env:PYTHONIOENCODING="utf-8"
python C:\Users\Administrator\.codex\skills\ui-ux-pro-max\scripts\search.py "daily briefing dashboard news digest AI intelligence warm parchment editorial green accessible" --design-system -p "Star-Skill Radar" -f markdown
python C:\Users\Administrator\.codex\skills\ui-ux-pro-max\scripts\search.py "CJK Chinese English mixed typography dashboard news digest editorial readable system fonts" --domain typography -n 12
python C:\Users\Administrator\.codex\skills\ui-ux-pro-max\scripts\search.py "warm parchment dark green accessible dashboard news digest color palette" --domain color -n 12
python C:\Users\Administrator\.codex\skills\ui-ux-pro-max\scripts\search.py "line height line length readable font size mobile contrast touch target" --domain ux -n 12
```

另开多子代理做了三类只读核验：工具结果筛选、可读性科学依据、现有 CSS token 对比度审计。主窗口独立复算了关键 WCAG 对比度。

---

## 2. 工具结果筛选

### 可采纳

| 工具命中 | 对本站的可用结论 | 置信度 |
|---|---|---|
| `News Editorial` typography：新闻、编辑、可信、长文可读 | 转译为“衬线大标题 + 无衬线正文”，但不能使用 Google Fonts | 高 |
| `Chinese Simplified` typography：Noto Sans SC、中文站、现代专业 | 转译为系统 CJK sans 优先：PingFang、微软雅黑、Source Han/Noto Sans fallback | 高 |
| `Dashboard Data`：数据、技术、精确 | 数字/时间戳继续使用等宽或 tabular nums；不要把整站正文变成 mono | 中高 |
| UX：对比度 4.5:1、移动正文 16px、行高 1.5-1.75、行长 65-75 字符、触控 44px | 作为 V2 排版/交互基线；CJK 行长另按 36-40 汉字收紧 | 高 |
| 色彩：dashboard 工具多次命中“深底 + 绿色状态” | 只保留“绿色作为少量状态/强调色”的原则；不采用深色底 | 中 |

### 不采纳

| 工具输出 | 不采纳原因 | 替代方案 |
|---|---|---|
| Google Fonts `Newsreader`、`Roboto`、`Noto Sans SC @import` | 硬约束禁止外部字体/CDN | 系统字体栈显式列 CJK 字体 |
| 深色 slate 背景 `#020617/#0F172A` + 亮绿 `#22C55E` | 破坏暖纸阅读基调，且更像通用技术仪表盘 | 保留 `--bg #f6f3ec`、`--accent #0e6f5c` |
| News/Media 红蓝色板 `#DC2626/#1E40AF` | 会把“每日技术情报”推向 breaking news，和墨绿主轴冲突 | 红色只保留为 `--signal` 语义色 |
| Video-first hero、Hero-centric landing CTA | 本站是情报站，不是营销页 | 首屏保持日报摘要 + 分类看板 |
| 超大负字距、`letter-spacing: -0.05em` | CJK 大标题与中英混排不适合负字距，易拥挤 | 继续 `letter-spacing: 0` |

---

## 3. 可读性科学依据

| 议题 | 建议 | 来源 | 置信度 |
|---|---|---|---|
| 文本对比度 | 普通文本至少 4.5:1；大文本至少 3:1；正文最好接近 7:1 | [W3C/WAI WCAG 2.2 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 高 |
| UI 边界/图形对比度 | 如果边框/轮廓是识别控件或状态的必要信息，应达到 3:1 | [W3C/WAI Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) | 高 |
| APCA | 用 APCA Lc 做感知调优：正文优先看 Lc 75-90；但它不是 WCAG 2.x 合规替代 | [APCA Easy Intro](https://git.apcacontrast.com/documentation/APCAeasyIntro.html) | 中高 |
| 移动端正文字号 | 多数正文有效字号至少 16px；小号只用于短标签、脚注、数据表 | [USWDS Typography](https://designsystem.digital.gov/components/typography/)、[Health Literacy Online](https://odphp.health.gov/healthliteracyonline/design-easy-scanning/use-readable-font-thats-least-16-pixels) | 高 |
| 行高 | 长文本至少 1.5；中文日报正文建议 1.56-1.68，较长证据段可到 1.72 | [USWDS Line Height](https://designsystem.digital.gov/components/typography/)、[Health Literacy Online](https://odphp.health.gov/healthliteracyonline/design-easy-scanning/use-readable-font-thats-least-16-pixels) | 高 |
| 行长 | WCAG AAA 视觉呈现建议 CJK 不超过 40 glyphs；中文屏幕校对研究推荐 36 字/行 + 1.5 行距 | [W3C/WAI Visual Presentation](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)、[Human Factors 论文摘要](https://journals.sagepub.com/doi/abs/10.1177/0018720813499368) | 高 |
| 拉丁行长 | 长正文常见目标 50-75 字符，66 字符是稳妥中值 | [Baymard line length research](https://baymard.com/blog/line-length-readability)、[USWDS Measure](https://designsystem.digital.gov/components/typography/) | 中高 |
| CJK 与 Latin/数字间距 | `text-autospace: normal` 可作为现代渐进增强；不要再依赖手动塞空格 | [MDN text-autospace](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-autospace)、[W3C inline spacing](https://www.w3.org/International/articles/styling/inline-space) | 中高 |
| CJK 断行 | 避免全局 `word-break: break-all`；正文用正常断行，URL/code 单独 `overflow-wrap: anywhere` | [MDN line-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-break)、[MDN word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break) | 高 |
| 系统字体 | `font-family` 是优先列表，浏览器逐字符回退；`system-ui` 更适合 UI，不应单独承担大段 CJK 正文 | [MDN font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family) | 高 |

---

## 4. 建议排版系统

### 字体栈

当前 `--sans`、`--serif`、`--mono` 大方向正确。V2 可微调为：

```css
:root {
  --sans: "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei",
    "Source Han Sans SC", "Noto Sans CJK SC", "Noto Sans SC",
    -apple-system, "Segoe UI", Roboto, sans-serif;
  --serif: "Songti SC", "STSong", "Noto Serif SC", Georgia, "Source Serif 4", serif;
  --mono: "SFMono-Regular", "Cascadia Mono", "Liberation Mono", Consolas, monospace;
}
```

说明：

- `--sans` 用于正文、卡片、列表、导航、控件，是主力。
- `--serif` 只用于 H1、日报标题、大分区标题或少量引文，不用于密集正文。
- `--mono` 只用于日期、star 数、版本号、时间戳、代码/仓库短标识。
- 不引入 `@import`、`@font-face` 外链；如果用户系统没有 Source Han/Noto，浏览器会继续回退。

### 字号阶梯

| Token | 建议值 | 用途 | 与现状关系 |
|---|---:|---|---|
| `--fs-xs` | `12px` | 时间戳、chip、极短元信息 | 现状大量使用；可保留但不得作为正文 |
| `--fs-sm` | `13px` | 筛选按钮、折叠标题、短辅助标签 | 现状吻合 |
| `--fs-compact` | `14px` | 桌面侧栏标题、短列表行、控件文本 | 现状吻合；移动端正文不应停留在此 |
| `--fs-body` | `16px` | 卡片说明、正文段落、移动端摘要 | 现状多处为 14-15px，V2 应上调 |
| `--fs-lede` | `17px` | 首屏导语、日报一句话摘要 | 现状 `.hero-text` 已是 17px |
| `--fs-section` | `20px` | 面板标题、分区标题 | 现状吻合 |
| `--fs-card-title` | `22px` | 重点卡片标题 | 现状吻合 |
| `--fs-page-title` | `30px` mobile / `44px` desktop | 当期日报标题 | 现状吻合 |
| `--fs-hero` | `40-44px` mobile / `64-72px` desktop | 站点 H1 | 现状 mobile 40-44px 合格，desktop 76px 可略收敛 |

建议 CSS token：

```css
:root {
  --fs-xs: 0.75rem;       /* 12px */
  --fs-sm: 0.8125rem;     /* 13px */
  --fs-compact: 0.875rem; /* 14px */
  --fs-body: 1rem;        /* 16px */
  --fs-lede: 1.0625rem;   /* 17px */
  --fs-section: 1.25rem;  /* 20px */
  --fs-card-title: 1.375rem;
}
```

### 行高

| Token | 建议值 | 用途 |
|---|---:|---|
| `--lh-display` | `0.98-1.08` | H1/大标题，行数极少时可用 |
| `--lh-title` | `1.16-1.25` | 卡片标题、分区标题 |
| `--lh-ui` | `1.35-1.45` | 按钮、chip、短元信息 |
| `--lh-body` | `1.56-1.64` | 卡片说明、日报正文、摘要 |
| `--lh-reading` | `1.68-1.75` | 较长证据段、说明段、空状态说明 |

现有 `html { line-height: 1.5; }` 合格，但 `.issue-title { font-size: 14px; line-height: 1.32; }` 在移动端换行时偏紧；`.overview-bullet-title`、`.overview-bullet-note` 作为阅读内容时也应接近 `1.5`。

### 行长

建议把“布局宽度”和“正文行宽”拆开：卡片/面板可以宽，卡片里的段落不必横跨整块。

```css
.copy-block p,
.value-block p,
.field-box p,
.brief-list p,
.gap-list p,
.empty-state p {
  max-inline-size: 38em;
}
```

说明：

- 中文主文案目标 `36-40em`，对应约 36-40 个汉字。
- 英文说明或长链接不使用同一规则强压，可对 URL/code 单独 `overflow-wrap: anywhere`。
- 首屏 `.hero-text` 当前 `max-width: 680px` 且 `17px`，约 `40em`，已经合格。

---

## 5. 建议色彩系统

### 当前关键对比度

本轮按 WCAG 2.x 相对亮度公式复算：

| 色对 | 比值 | 结论 |
|---|---:|---|
| `--ink #1c1917` on `--bg #f6f3ec` | `15.78:1` | AAA，保留 |
| `--ink #1c1917` on `--paper #fffdf8` | `17.20:1` | AAA，保留 |
| `--muted #6b6259` on `--paper #fffdf8` | `5.87:1` | AA；适合元信息，不宜承担长正文 |
| `--accent #0e6f5c` on `--paper #fffdf8` | `5.99:1` | AA；可作按钮/链接，12px 小字更建议用 `--accent-ink` |
| `--paper #fffdf8` on `--accent #0e6f5c` | `5.99:1` | AA；active 按钮安全 |
| `--accent-ink #06382f` on `--accent-soft #dcefe9` | `10.88:1` | AAA，保留 |
| `--line #ddd5c8` on `--paper #fffdf8` | `1.43:1` | 仅装饰可用，不可作为唯一 UI 边界 |
| `--line-strong #beb3a4` on `--paper #fffdf8` | `2.03:1` | 低于 UI 边界 3:1 |
| `--signal #d4502f` on `--paper #fffdf8` | 约 `4.14:1` | 普通文本不达 AA；当前错误文本另用深红是安全的 |
| `--cat-subagent #935a3a` on `--cat-subagent-soft #f0e2d7` | `4.40:1` | 略低于普通文本 AA |

### 推荐 token 调整

这些是建议，不是本轮代码变更：

```css
:root {
  /* 保持主轴 */
  --bg: #f6f3ec;
  --paper: #fffdf8;
  --ink: #1c1917;
  --accent: #0e6f5c;
  --accent-ink: #06382f;
  --accent-soft: #dcefe9;

  /* 建议调整或新增 */
  --paper-strong: #fffdf8; /* 避免纯白切断暖纸系统 */
  --muted-strong: #5b534b; /* 当弱文本承担正文/摘要时使用，on paper 约 7.42:1 */
  --line-ui: #948978;     /* 必须识别的控件边界，on paper 约 3.38:1 */
  --signal-text: #a9371f; /* 红色普通文本 */
  --cat-subagent: #874c2f; /* on soft 约 5.33:1 */
}
```

如果不希望新增变量，最低限度是：

- `--paper-strong` 从 `#ffffff` 改为 `#fffdf8` 或 `#fdfbf6`。
- `--line-strong` 只在必要交互边界上改用 `#948978`；普通发丝线继续 `--line`。
- `--cat-subagent` 改为 `#874c2f` 或更深的同色相。
- `--signal` 不直接用于小号正文；红色文本使用深红 token。

### 色彩使用规则

- 暖感来自背景和中性色 undertone，不来自降低对比度。
- 墨绿 `--accent` 控制在小面积：active 状态、重点链接、左边框、少量数值强调。
- `--accent-ink` 承担小号墨绿文字，尤其 12-13px 标签。
- 分类色可以保留，但必须低饱和、面积小、只服务分类扫描；不要发展成第二套品牌色。
- 边框分两类：装饰发丝线可以低对比；控件识别、focus、选中边界必须达到 3:1 或改用背景/文本/图标多重提示。

---

## 6. CJK + Latin 混排落地

当前 `site/styles.css` 已有：

```css
html {
  text-autospace: normal;
  text-spacing-trim: trim-start;
  font-feature-settings: "halt" 1;
}
```

建议 V2 调整为渐进增强：

```css
html {
  line-break: normal;
  word-break: normal;
  overflow-wrap: break-word;
  text-autospace: normal;
}

@supports (text-spacing-trim: trim-start) {
  html { text-spacing-trim: trim-start; }
}

.repo-url,
.permalink,
code {
  overflow-wrap: anywhere;
}
```

说明：

- `lang="zh-CN"` 应放在 HTML 上；本站 `site/index.html` 已具备。
- 不要全局 `word-break: break-all`，否则英文仓库名、URL、API 名会被硬切。
- `text-autospace` 现在已有现代浏览器支持，但仍应视为增强；内容源不应混入手写空格作为唯一方案。
- 数字指标继续使用 `font-variant-numeric: tabular-nums`，当前 stats/时间戳方向正确。

---

## 7. 与现有 token 的冲突清单

| 冲突点 | 影响 | 建议优先级 |
|---|---|---:|
| `--paper-strong: #ffffff` 是纯白 | 不是对比度问题，而是破坏暖纸系统的一致性 | P2 |
| `--line-strong` 低于 3:1 | 如果作为按钮、summary、chip 的唯一边界，会低于 WCAG 非文本对比要求 | P1 |
| `--line` 低于 3:1 | 作为装饰线可接受；作为结构识别不足 | P2 |
| `--signal` 作为普通文本不达 AA | 当前错误态使用 `#7b2415` 安全，但未来复用 `--signal` 会踩坑 | P1 |
| `--cat-subagent` chip 文本 4.40:1 | 12px 小字低于普通文本 AA | P1 |
| 多处正文/摘要为 13.5-15px | 桌面密集 UI 可接受；移动端正文与日报说明应上调到 16px | P1 |
| `.copy-block p` 等正文无独立行宽限制 | 桌面内容区可接近 800px，中文长句可能超过 40 字/行 | P1 |
| `.issue-title` 换行时 `line-height: 1.32` | 移动端标题换行偏紧 | P2 |
| 分类色较多 | 低饱和可保留，但要限制面积，避免削弱单一墨绿主轴 | P3 |

---

## 8. V2 落地优先级

1. 先修可读性底线：正文/摘要 `16px`、`line-height >= 1.56`、长段 `max-inline-size: 38em`。
2. 再修对比度风险：`--line-ui`、`--cat-subagent`、红色文本 token。
3. 最后做现代看板感：压实层级、减少纯白、统一数值与标签风格、保留墨绿小面积强调。

这样能把现有“羊皮纸手写纸”基调推进到现代情报看板，而不是换成通用 SaaS dashboard。

---

## 9. 参考来源

- [W3C/WAI：Understanding SC 1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C/WAI：Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
- [W3C/WAI：Understanding SC 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)
- [APCA：The Easy Intro to the APCA Contrast Method](https://git.apcacontrast.com/documentation/APCAeasyIntro.html)
- [USWDS：Typography](https://designsystem.digital.gov/components/typography/)
- [ODPHP / Health Literacy Online：Use a readable font that’s at least 16 pixels](https://odphp.health.gov/healthliteracyonline/design-easy-scanning/use-readable-font-thats-least-16-pixels)
- [Baymard：Readability: The Optimal Line Length](https://baymard.com/blog/line-length-readability)
- [Human Factors：Effects of Line Length, Line Spacing, and Line Number on Proofreading Performance and Scrolling of Chinese Text](https://journals.sagepub.com/doi/abs/10.1177/0018720813499368)
- [MDN：text-autospace](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-autospace)
- [W3C Internationalization：Managing inline spaces in Chinese & Japanese](https://www.w3.org/International/articles/styling/inline-space)
- [MDN：line-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-break)
- [MDN：word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break)
- [MDN：font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family)
