# 调研材料：现代日报看板美学与暖色羊皮纸质感融合

> 项目：Star-Skill Radar  
> 日期：2026-07-03  
> 范围：仅针对首屏「今日摘要」看板与相关视觉语言做范例拆解和美学落地建议；不修改 `site/`、`data/`、`docs/prds/`、`docs/specs/`。  
> 约束：纯静态原生 HTML/CSS/JS、GitHub Pages、无外部 CDN/字体、图标用内联 SVG 不用 emoji、保留暖色羊皮纸基调与墨绿主题色、不回退 WCAG AA。

## 结论先行

本站不应该把参考图的固定新闻栏目直接照搬成「开发生态 / 模型发布 / 产品应用」这类栏目，因为当前数据模型是按 `type` 分组的技术资产日报。可迁移的是它的视觉组织方式：**日期化日报标题、图标化分类、短句要点、卡片间清晰分区、少量分类色作为识别锚点**。

推荐方向是 **「纸面 briefing board + 轻 bento」**：保留现有暖色纸面、8px 圆角、低阴影和墨绿主色，把「今日摘要」做成更像日报头版的分组摘要板。看板感来自分组结构、图标徽章、卡片权重和短句节奏，而不是来自重阴影、大圆角、彩色填满或外部字体。

关键设计取舍：

- **适合迁移**：分类标题前加入内联 SVG 图标；每类只露出 1-3 条短句；分类卡顶部有清晰 header；`简讯` 这种长列表用更紧凑的列表或跨栏处理；外链、展开、跳转都用一致线性图标。
- **不适合迁移**：固定新闻栏目导航、视频字幕条、底部时间轴、播放水印、大面积金/橙装饰、所有卡片等权重 bento 化。
- **分类色使用方式**：只用于图标徽章、细边、左侧 3px 色线、浅色 chip；不把整张卡染成类别色。关键文本仍用深墨色或墨绿，所有文字对比度继续按 WCAG AA 复核。
- **图标体系**：以 Lucide / Heroicons 这类 24x24 线性 SVG 为风格基准，但在项目中直接内联 SVG 源码或本地 sprite，不引入包、CDN 或图标字体。

置信度：高。依据来自本地截图/源码审阅、指定技能检索、公开可访问的日报/看板范例，以及 WCAG / MDN / Lucide / Tailwind 官方资料。

## 方法与边界

已阅读/使用：

- 指定技能：`frontend-design`、`ui-ux-pro-max`。
- `ui-ux-pro-max --domain style` 相关结果：`Bento Box Grid`、`Bento Grids`、`Editorial Grid / Magazine`、`E-Ink / Paper`、`Nature Distilled`、`Data-Dense Dashboard`。
- 参考图：`C:\Users\Administrator\.cursor\projects\c-Users-Administrator-Desktop-star-skill\assets\c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-caf8dc70-1794-4f39-84a9-c6cd242beb5b.png`。
- 当前站点截图：同目录 2026-07-03 10:02:42-10:02:45 的另外三张图片，分别对应当前今日摘要看板全貌、局部和 hero 统计区。
- 当前实现：`site/index.html`、`site/styles.css`、`site/app.js` 中 `overviewBoard()`、`overviewCategoryCard()`、`overviewBriefsCard()`、`overviewCategoryHead()`、`overviewMoreButton()` 等相关结构。

本报告刻意不重推以下内容：

- 「一眼可读性」与信息结构原则：见 `docs/research/frontend-v2-dashboard-first-principles.md`。
- 展开/折叠交互：见 `docs/research/frontend-v2-progressive-disclosure-interaction.md`。
- hero KPI 设计：见 `docs/research/frontend-v2-kpi-header-design.md`。
- 暖色纸面与中英混排基础：见 `docs/research/frontend-redesign-parchment-cjk-typography.md`。

## 本站现状观察

当前站点已经有较好的基础：浅米色背景、细网格、白纸卡片、8px 圆角、低阴影、墨绿强调色，整体克制，符合「技术资产情报站」而不是营销落地页。

主要视觉短板不是「不够暖」，而是「不够像日报看板」：

- 分类只靠一个小圆点识别，视觉记忆点弱。
- 每张分类卡几乎等权重，`1 条`、`2 条`、`7 条简讯` 在同一网格里竞争，桌面端容易出现右侧大空洞和节奏失衡。
- 条目虽然有标题和摘要，但更像后台列表，不像「今日发生了什么」的短句要点。
- hero 统计区和今日摘要之间视觉关系较弱，日报头版感没有连起来。

这意味着 B2 的美学升级应优先做「分类识别、卡片节奏、短句呈现、纸面层次」，而不是增加装饰纹理或重做交互。

## 范例拆解

| 范例 | 视觉执行手法 | 可迁移到本站 | 置信度 |
| --- | --- | --- | --- |
| [1440 Daily Digest](https://join1440.com/today) | 以日期 issue 为单位，先给开场摘要，再进入 `Need To Know` / `In The Know` 等分区；长 lead 与分组短讯之间有明显密度过渡。 | 用「日报 issue」语气组织今日摘要：顶部一句今日概览，下方按 type 分区；主推资产可稍大，次级资产用紧凑短句。分类色只做章标/细线。 | 高 |
| [TLDR](https://tldr.tech/) | 每条内容固定为日期/分类/标题/摘要，标题旁常带阅读时长；分类标签是扫描锚点，整体偏技术读者。 | 对每个资产形成稳定卡片骨架：`type + 项目名 + 1 句价值 + 来源/星标/日期`。适合本站技术资产语境。 | 高 |
| [The Rundown AI issue](https://www.therundown.ai/p/anthropic-writes-washington-an-ai-regulation-playbook) | issue 开头列出今日清单，正文分区使用 eyebrow、短标题、`The Rundown / The details / Why it matters` 重复模板。 | 重点项目可形成固定叙事骨架：一句话、关键细节、为什么值得关注。视觉上用浅纸底或墨绿细框强调「为什么值得关注」。 | 高 |
| [The Verge 2026 homepage update](https://www.theverge.com/bulletin/914842/the-next-evolution-of-the-verges-homepage-is-here) | 官方说明把 homepage 明确分成「top stories / story sets」与 latest feed，解决重要内容在时间流里过快消失的问题。 | 今日摘要也应分清「今日最重要」与「按 type 扫描」。可用少量加权卡片或跨栏块，不让所有分组等权。 | 中高 |
| [Tailwind CSS Bento Grids](https://tailwindcss.com/plus/ui-blocks/marketing/sections/bento-grids) | 官方 bento 示例强调不同网格模式、浅/深主题、用卡片布局突出关键内容。 | 只借鉴「模块化、不同权重、清晰内边距」；不照搬 16-24px 大圆角和 Apple 风纯白高亮。本站应维持 8px 圆角和暖纸表面。 | 中高 |

补充对照：

- [Google News redesign](https://blog.google/company-news/outreach-and-initiatives/google-news-initiative/redesigning-google-news-everyone/) 的价值在于「卡片格式让故事更易浏览、扫描、识别相关报道」，可作为新闻卡片化的可靠依据，但它不是本站要照搬的视觉风格。
- [Axios Smart Brevity](https://www.axioshq.com/smart-brevity) 的价值在于短句、留白、加粗和项目符号的组合，可支撑「要点式短句」而非长摘要。

## 参考图分析

参考图是一张「2026-07-03 资讯概览」日报式画面，包含横向分类导航、两列 bento 卡片、分类图标、短句 bullet 和强日期标题。它的成功点是：读者不需要先理解复杂规则，就能通过图标、颜色和卡片标题知道每块内容属于哪个主题。

### 适合迁移

1. **分类图标化**  
   当前小圆点可以升级为「线性 SVG 图标 + 分类名 + 数量」。图标不是装饰，而是提高重复读者的类别识别速度。

2. **要点式短句**  
   参考图每条是短句 bullet，读起来像「今天发生了什么」。本站当前 `overview-bullet-title + overview-bullet-note` 方向正确，但 note 应更像 briefing copy，而不是截断后的长摘要。

3. **日报 masthead**  
   可把「今日摘要 / 日期 / 总条数 / 头条」组织成更有仪式感的摘要头，而不是普通段落。

4. **卡片 header 更强**  
   每个分类卡顶部应有明确 header 区：图标徽章、分类名、数量、必要时一条极短分类 rollup。这样卡片内部条目可以更轻。

5. **两层密度**  
   重点 type 卡保持舒展，长 `简讯` 改成更紧凑列表或跨栏区域，避免一张卡无限拉长。

### 不适合照搬

1. **固定新闻栏目**  
   参考图栏目是新闻编辑分类；本站是 `skill / mcp / rules / hooks / subagent / prompt-lib / paradigm` 等资产 type。改成固定新闻栏目会破坏数据契约和筛选心智。

2. **横向课程式导航**  
   当前站点已有 type / stage 筛选。参考图顶部横向导航更像视频/演示页目录，不宜再叠加一套固定栏目导航。

3. **视频化元素**  
   底部时间轴、字幕条、播放水印、课程 tab 都不适合静态 GitHub Pages 情报站。

4. **过强暖橙标题**  
   参考图的铜橙大标题适合作为演示封面，但本站应以墨绿为主品牌色，铜红/赭石只做少量强调，避免暖色过饱和导致「仿古模板」感。

5. **全部卡片等权重 bento**  
   本站当日各 type 数量变化大，强行等权 bento 会产生空洞或长短失衡。bento 应用于少量关键块，而不是所有分组机械网格化。

## 可落地美学方向

### 方向 A：纸面 Briefing Board（推荐）

这是最适合本站的主方向。

视觉特征：

- 整体仍是暖米色纸面，背景细网格保留但保持低存在感。
- 今日摘要顶部是一个「日报头版条」：标题、日期、总条数、重点数、简讯数、头条。
- 下方不是纯等权卡片网格，而是「加权分组板」：重要/高量分组更宽，低量分组更紧凑。
- 分类卡顶部用内联 SVG 图标徽章，正文用 1-3 条短句。
- 卡片之间用细边、内边距和浅色 header 分隔，不靠重阴影。

适用理由：保留羊皮纸温度，同时让首屏更像日报编辑台。置信度：高。

### 方向 B：Editorial Bento（次选）

适合团队坚持「现代 bento」观感时使用。

视觉特征：

- 用 CSS Grid 做少量跨栏：例如今日头条/范式类可跨 2 列，简讯可跨 2 列或变成列表带。
- 大卡负责叙事，小卡负责扫读。
- 卡片有统一 header，但内部密度可不同。

注意：不要采用 masonry 或 `grid-auto-flow: dense` 这类纯视觉重排，否则键盘顺序、阅读顺序和数据顺序会分离。置信度：中高。

### 方向 C：Warm Data Sheet（保守）

适合想最大化稳定和移动端可读性时使用。

视觉特征：

- 摘要区更像一张整理过的纸面清单。
- 每个 type 是一段 section，而不是独立大卡。
- 分类图标、数量和短句仍保留，但减少卡片边界。

注意：现代看板感会弱一些，但最稳。置信度：中。

## 视觉执行建议

### 卡片

- 圆角维持当前 `--radius: 8px`，不采用 bento 模板常见的 16-24px 大圆角。
- 阴影维持「耳语阴影」量级，或进一步减少；现代感靠层级和对齐，不靠浮起。
- 卡片背景用 `--paper-strong` / `--paper` 的暖白差异；不要把卡片做成纯白高亮块。
- 分类卡可加 1 条 3px 左边线或顶部细线，颜色取现有 `--cat-*`，但面积很小。
- `简讯` 不应和普通 type 卡等权；推荐列表化或跨栏，以解决当前 7 条简讯拉长单卡的问题。

### 分组与层级

- 分类 header 建议结构：`[SVG 徽章] [分类名] [数量]`。
- 数量是 metadata，不应和标题同权；可用 mono、小字号、暖灰。
- 每条摘要优先显示项目名和一句价值，不在 overview 里塞证据、日期、完整来源说明。
- 每张卡默认只显示 1-3 条；更多内容的交互细节由 `frontend-v2-progressive-disclosure-interaction.md` 负责，本报告只建议视觉上给一个稳定的 chevron + 文本按钮。

### 颜色

颜色策略应是「暖纸底 + 墨绿主线 + 低饱和分类色」：

- 主文字：暖黑/深墨色。
- 主品牌：墨绿，用于标题、链接、focus ring、重要线条。
- 分类色：只作识别，不作大面积背景。
- 铜红/赭石：只用于今日头版的一条强调线或极少量日期/状态强调。
- 所有颜色不能只靠色相传递信息，必须同时有文字 label 或图标。

对比要求：

- 普通文字按 WCAG AA 至少 4.5:1。
- 大字和有意义的图形/图标按至少 3:1。
- 暖色纹理或网格不能压在小字后面形成实际对比下降。

来源：[W3C WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)。置信度：高。

### 质感

- 纸纹应停留在背景层，低透明度、低频率，不进入文字承载区。
- 继续避免卷轴边、污渍、折角、墨迹、仿旧花边。
- 可以保留当前细网格，但在卡片密集区避免网格穿透过强。
- 如果做纹理，优先 CSS 渐变或极轻 SVG noise；不要引入外部图片依赖。

### 留白与密度

- 桌面端摘要区可以更密，但卡片内部仍要有稳定 padding。
- 移动端不要保持多列 bento 心智，应回到单列日报清单。
- 标题不应被图标挤压；长项目名要有明确换行策略。
- 不要让 hover scale 改变布局；最多用边框、背景、轻微阴影变化。

## 图标体系建议

选择原则：

- 统一为线性 SVG，`viewBox="0 0 24 24"`，`fill="none"`，`stroke="currentColor"`，`stroke-width="1.8"` 或 `2`，圆角线帽/线连接。
- 图标作为分类识别时 `aria-hidden="true"`，因为旁边已有文字 label。
- 纯图标按钮必须有 `aria-label`。
- 不使用 emoji、不使用 icon font、不使用外部 CDN、不在运行时加载图标包。
- 可以参考 [Lucide](https://lucide.dev/) 的一致性和可定制性；Lucide 官方说明其图标是轻量 SVG 且有统一设计规则。若复制具体图标源码，应保留许可证要求。
- 也可参考 [Heroicons](https://heroicons.com/) 的 MIT SVG 图标，但同样只内联必要 SVG，不引入 React/Vue 包。

推荐映射：

| 本站 type / 动作 | 推荐图标语义 | 视觉说明 |
| --- | --- | --- |
| `skill` | sparkles / tool / badge-check | 表示可复用能力，不用魔法棒类 emoji 感符号。 |
| `mcp` | server / network / plug | 强调协议、连接、工具服务。 |
| `rules` | file-check / scroll-text / checklist | 强调规则文档和约束。 |
| `hooks` | git-branch / plug / zap | 强调触发与链路；避免过强闪电色。 |
| `subagent` | bot / network-nodes / user-cog | 表示代理与协作，不用头像插画。 |
| `prompt-lib` | book-open / library / text | 表示提示词库。 |
| `paradigm` | compass / workflow / route | 表示工作范式与方法路线。 |
| `briefs` / 简讯 | newspaper / rss / list | 表示短讯集合。 |
| 外链 | arrow-up-right | 替代当前文本箭头或乱码风险。 |
| 展开 | chevron-down | 和可逆 disclosure 状态绑定。 |
| 跳转完整卡片 | corner-down-right / arrow-right | 区分站内跳转与外链。 |

图标尺寸建议：

- 分类 header 图标：18-20px，放在 30-34px 的浅色徽章里。
- 条目级外链/跳转图标：14-16px。
- 展开按钮图标：16px，状态变化只做旋转，不做位移。

## 具体落地取舍

推荐保留：

- 当前暖色变量体系、墨绿主色、低阴影、8px 圆角。
- `--cat-*` 分类色，但缩小到徽章/细线/chip。
- 当前 CSS Grid 能力，但用于有意图的加权布局，而不是机械三列。
- 当前 `overview-bullet-title + overview-bullet-note` 的基本结构。

建议调整：

- `overview-dot` 升级为 SVG 图标徽章。
- `overview-lede` 升级为更像日报 masthead 的结构。
- `overview-category` header 更明确，包含图标、名称、数量。
- `简讯` 从普通分类卡中脱离成紧凑列表/跨栏块。
- 短句 copy 从「截断摘要」升级为「为 overview 单独生成的 briefing copy」。

不建议：

- 大面积橙色/金色标题和边框。
- 16-24px 大圆角 Apple 式 bento。
- 毛玻璃、霓虹、重渐变、强投影。
- 直接使用图片图标、emoji 或外部 icon font。
- 固定新闻栏目导航替换 type 分组。
- 为了补视觉空洞使用 masonry 或视觉重排。

## 参考来源

- [1440 Daily Digest](https://join1440.com/today)：日报 issue、分区短讯、长 lead 到短讯密度过渡。置信度：高。
- [TLDR](https://tldr.tech/)：技术日报、分类标签、标题摘要、阅读时长语义。置信度：高。
- [The Rundown AI issue](https://www.therundown.ai/p/anthropic-writes-washington-an-ai-regulation-playbook)：AI 日报模板化分区和 `Why it matters` 结构。置信度：高。
- [The Verge homepage update](https://www.theverge.com/bulletin/914842/the-next-evolution-of-the-verges-homepage-is-here)：top stories / latest feed 分离，重要内容获得更多展示空间。置信度：中高。
- [Tailwind CSS Bento Grids](https://tailwindcss.com/plus/ui-blocks/marketing/sections/bento-grids)：bento 网格作为模块化布局参考。置信度：中高。
- [Google News redesign](https://blog.google/company-news/outreach-and-initiatives/google-news-initiative/redesigning-google-news-everyone/)：卡片格式支持浏览、扫描与识别相关报道。置信度：高。
- [Axios Smart Brevity](https://www.axioshq.com/smart-brevity)：短句、留白、加粗、项目符号组合。置信度：高。
- [W3C WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)：文字与图形对比约束。置信度：高。
- [MDN CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout)：CSS Grid 支持二维布局与复杂对齐，适合纯静态实现。置信度：高。
- [Lucide Icons](https://lucide.dev/)：线性 SVG 图标的一致性、可定制性与许可证参考。置信度：高。
- [Heroicons](https://heroicons.com/)：MIT SVG 图标参考。置信度：高。

