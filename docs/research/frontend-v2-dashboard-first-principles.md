# 现代化每日简报/看板的“一眼可读”信息设计第一性原理调研

> 项目：Star-Skill Radar  
> 日期：2026-07-03  
> 范围：仅针对站点首屏“今日摘要”看板（`overviewBoard` 及相关样式/函数）的信息设计，不涉及 `site/` 代码修改。  
> 约束：纯静态原生 HTML/CSS/JS、GitHub Pages、无外部 CDN/字体、保留暖色羊皮纸基调与 `--accent` 墨绿主色、不得回退 WCAG AA。

## 结论先行

这类“日报首页概览”不是小型文章列表，也不是传统 KPI 仪表盘；它更接近 **briefing board（简报式总览）**。对这种页面，最稳妥的高置信方案不是“把所有类目做成同权重卡片网格”，而是：

1. **先给总览，再给分组，再给详情**：首屏先回答“今天一共发生了多少、最重要的是什么”，然后再让用户按类扫描。  
2. **把 F-pattern 当成失败态来规避**：如果没有强视觉层级，用户会只看左上和每行开头，右侧与下方的重要信息会被跳过。  
3. **不要让布局为“等高感”牺牲扫描效率**：当各分组条目数差异很大时，统一三列卡片网格很容易显空、显乱、显失衡。  
4. **摘要必须是“标题 + 一句补充”，而不是迷你段落**：一眼可读靠的是信息气味、前置关键词和一句话提炼，不是压缩长摘要。  
5. **`今日共 N 条` 应成为独立视觉锚点，而不是埋在一句 prose 里**。  

对本站而言，最高优先级的方向是：**把当前 `overview-lede + overview-grid`，改造成“总览条（big number + breakdown + headliner）+ 分组短列表/summary sections”**。如果团队坚持保留 bento 感，再考虑“少量加权跨列”的二级方案；**不建议**用 masonry / `grid-auto-flow: dense` / 纯视觉重排去“补洞”。

---

## 调研方法与证据分级

### 已阅读的当前实现

- `site/index.html`
- `site/app.js`  
  重点审阅：`overviewBoard`、`groupHighlightsByType`、`overviewCategoryCard`、`overviewBriefsCard`、`overviewBulletItem`、`truncateText`
- `site/styles.css`  
  重点审阅：`.overview-board`、`.overview-lede`、`.overview-grid`、`.overview-category`、`.overview-bullet*`

### 证据分级

- **A（权威）**：NN/g、USWDS、GOV.UK Design System、MDN、Ben Shneiderman 原始论文、欧盟数据可视化指南
- **B（可靠）**：Axios 官方 Smart Brevity 方法页、Material Design 官方文档

> 本报告刻意不采用普通博客、Medium 经验帖、Dribbble/Behance 灵感图作为结论依据。

---

## 当前实现快照：问题不是“卡片不够多”，而是“层级不对”

当前实现已经有一些正确方向：

- 使用 `ul/li` 承载概览条目，语义和可访问性方向是对的。
- `overview-bullet` 做成整行点击，交互目标清楚。
- 使用 `--mono` 和 `tabular-nums` 呈现计数，适合简报型 UI。
- 类别色只放在 `overview-dot`，没有把整块卡片涂满，方向上优于“彩虹 dashboard”。
- 暖色纸面、低对比阴影、墨绿强调，和项目基调一致。

但当前结构有 5 个关键失配：

1. `overview-lede` 把 **总量、分项、头条** 塞进同一句 15px 文本里，导致“今天发生了多少”没有成为独立视觉锚点。
2. `groupHighlightsByType()` 按固定类型顺序输出，而不是按“今日最重要/最多/最值得先扫”的顺序输出。
3. `overviewCategoryCard()` / `overviewBriefsCard()` 对 **1 条、3 条、7 条** 的分组使用同一种卡片壳，视觉重量相同，但内容密度完全不同。
4. `OVERVIEW_BULLET_LIMIT = 3` + `overviewMoreButton()` 让摘要层承担了“展开更多”的职责，破坏了 glanceability。
5. `.overview-grid` 在 `1080px` 以上进入 **3 列同权网格**；在分组数据极不均衡时，这种布局天然容易出现大片空洞和注意力分裂。

最核心的判断是：**当前问题不是“摘要不够多”，而是“摘要层和详情层没有彻底分工”。**

---

## 核心原则（含来源与置信度）

### 1. 概览层必须先回答“今天发生了多少”

**结论**  
现代 dashboard / briefing board 的首要职责不是“展示所有内容块”，而是先给出一个能在几秒内被吸收的 overview。这个 overview 可以是 **一个主总量 + 少量分解指标 + 一个头条定位**。

**为什么适用于本项目**  
Star-Skill Radar 的首页不是分析台，也不是全文入口，而是“日报封面”。用户第一眼最关心的是：

- 今天是不是很多内容？
- 今天最值得看的是什么？
- 重点和简讯的体量差异是什么？

**来源**

- [NN/g: Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/) [A]
- [Ben Shneiderman, 1996: Overview first, zoom and filter, then details-on-demand](https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf) [A]
- [EU Data Visualisation Guide: The information-seeking mantra](https://data.europa.eu/apps/data-visualisation-guide/the-information-seeking-mantra) [A]

**置信度：高**

---

### 2. F-pattern 是“无引导扫描”的默认失败态，不是应该迎合的目标

**结论**  
在文本或卡片较多、层级不强时，用户会沿着 **左上 -> 上横扫 -> 次横扫 -> 左侧下行** 的 F-pattern 低成本扫描；这意味着右侧和后半部分信息会天然吃亏。  
因此，设计目标不是“利用 F-pattern”，而是 **通过视觉层级、分组和短格式，把用户从无差别扫视引导到高价值信息上**。

**为什么适用于本项目**  
当前 `overview-grid` 在大屏是 3 列；如果最关键的信息恰好落到第二列或第三列、或者落到某张长卡片的后半部分，就很容易被“扫过去但没看见”。

**来源**

- [NN/g: F-Shaped Pattern of Reading on the Web](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) [A]
- [NN/g: Text Scanning Patterns: Eyetracking Evidence](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/) [A]
- [NN/g: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) [A]
- [NN/g: Horizontal Attention Leans Left](https://www.nngroup.com/articles/HORIZONTAL-attention-leans-left/) [A]

**置信度：高**

> 对“Z-pattern”的处理：本次检索中，没有找到和 NN/g 对 F-pattern 同等级、专门适用于高密度日报看板的强证据。它更适合作为 **低文案 hero/landing** 的次级构图启发，而不应成为日报概览板的主结构依据。对本项目，更可靠的依据是 `overview first + visual hierarchy + anti-F formatting`。  
> 另外，**不要把“Z-pattern”误解成左右交错 zigzag 卡片排法**：NN/g 的眼动研究反而表明，交错 zigzag 会降低扫描效率。

---

### 3. 信息气味（information scent）来自“标题 + 上下文 + 一句补充”

**结论**  
概览条目的标题必须能单独成立；标题旁的一句补充不是“重复标题”，而是用来回答“这是什么/为什么值得点”。  
用户通常只看标题开头几个词；如果开头是重复前缀、品牌词或空泛短语，扫描效率会明显下降。

**为什么适用于本项目**  
`overviewBulletItem()` 现在是“标题 + 截断 note”；结构方向正确，但 `note` 的职责需要更明确：**补充 gist，而不是变成被压缩的正文**。

**来源**

- [NN/g: Information Scent](https://www.nngroup.com/articles/information-scent/) [A]
- [NN/g: Writing Hyperlinks: Salient, Descriptive, Start with Keyword](https://www.nngroup.com/articles/writing-links/) [A]
- [NN/g: Microcontent](https://www.nngroup.com/articles/microcontent-how-to-write-headlines-page-titles-and-subject-lines/) [A]

**置信度：高**

---

### 4. 摘要层应采用 Smart Brevity / inverted pyramid，而不是“缩短版段落”

**结论**  
一眼可读的摘要层，应该让用户在 **一句话内** 获取核心信息；多余背景、解释、例外情况应进入详情层。  
换句话说：**简短不是目的，先说结论才是目的。**

**为什么适用于本项目**  
项目日报里很多条目本质上都有“它是什么 / 为什么重要 / 怎么用”三层信息。摘要层只该保留其中最值钱的一层，另外两层进入下方完整卡片。

**来源**

- [NN/g: Inverted Pyramid: Writing for Comprehension](https://www.nngroup.com/articles/inverted-pyramid/) [A]
- [Axios Help: What is the Axios “Smart Brevity” style?](https://help.axios.com/hc/en-us/articles/36222626161435-What-is-the-Axios-Smart-Brevity-style) [B]
- [Axios: Our secret sauce for better communication](https://www.axios.com/2022/09/23/our-secret-sauce-for-better-communication-axios-smart-brevity) [B]
- [Axios: 5 tips from "Smart Brevity": Short, not shallow](https://www.axios.com/2022/09/30/5-tips-from-smart-brevity-short-not-shallow) [B]
- [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/) [A]

**置信度：高**

---

### 5. 卡片适合“模块化摘要”，列表适合“同构条目扫描”

**结论**  
当内容是 **同一种交互、同一种阅读动作、同一种结构** 时，列表通常比网格卡片更利于快速扫描。  
卡片适合“各块内容彼此独立”；列表适合“要一条一条快速过目”。

**为什么适用于本项目**  
当前 overview 中的大多数项目其实是同构的：标题、一个一句话定位、点击跳详情。  
这更接近 **grouped list / collection**，而不是同权 card gallery。

**来源**

- [USWDS: Card](https://designsystem.digital.gov/components/card/) [A]
- [USWDS: Collection](https://designsystem.digital.gov/components/collection/) [A]
- [Material Design: Lists](https://m1.material.io/components/lists.html) [B]

**置信度：高**

---

### 6. 当分组数量差异很大时，不要指望 masonry/瀑布流“自动修复”信息架构

**结论**  
CSS masonry 目前仍是实验性能力；`grid-auto-flow: dense`、`order` 或视觉重排也会引入 **视觉顺序与 DOM/Tab 顺序不一致** 的风险。  
它们也许能“补洞”，但不能解决“哪个信息应该先看”的问题。

**为什么适用于本项目**  
Star-Skill Radar 当前问题首先是 **信息层级与摘要策略**，其次才是版面空隙。  
如果先用 masonry 去填满空隙，很容易把“看起来更满”误当成“更易扫”。

**来源**

- [MDN: Masonry layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) [A]
- [MDN: Grid layout and accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility) [A]

**置信度：高**

---

### 7. 颜色是次级 cue；层级主要靠位置、大小、分组和留白

**结论**  
对 glanceable board 来说，类别色适合做 **辅助分类记忆**，不适合承担主层级。  
真正该先被看见的信息，应该先用 **位置、字号、权重、容器与留白** 被看见。

**为什么适用于本项目**  
你们已经有暖纸底色、墨绿主色和一组低饱和类目色。最优策略不是再加更多颜色，而是 **收缩颜色职责**：主总览用 `--accent` 体系，类目色只做点缀，不做大面积主导。

**来源**

- [NN/g: Visual Hierarchy in UX](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) [A]
- [NN/g: Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/) [A]

**置信度：高**

---

## 对本站看板的映射建议

以下按“现状问题 → 适用原则（来源 + 置信度） → 具体改法方向”展开。

### 1. `overview-lede` 把“总量 / 分项 / 头条”写成一整句，概览锚点不够强

**现状问题**  
当前 `overviewBoard()` 中的 `overview-lede` 采用一整句 prose：`今日共 N 条情报 · X 个重点 · Y 条简讯；头条：...`。  
这让 **`N` 的存在感不足**，也让“头条”变成句尾附属信息。

**适用原则（来源 + 置信度）**  
- `overview first`：先给概览，再给细分与详情。[Shneiderman / NN/g, A, 高]  
- 最重要元素应在高注意区并拥有最大视觉权重。[NN/g Visual Hierarchy / Horizontal Attention, A, 高]

**具体改法方向**  
- 不再让 `今日共 N 条` 只作为 prose 出现，而是拆成 **独立总览条**：
  - 主指标：`N`
  - 次级 breakdown：`重点 X`、`简讯 Y`、`类目 Z`
  - 单独一行 `头条：…`
- 视觉上形成 **3 层**：
  1. 主总量（最大）
  2. breakdown（次级、短标签）
  3. 头条（一句定位）
- 色彩建议：
  - 主总量：`--accent-ink` / `--ink`
  - breakdown 背景：`--accent-soft` 或 `--paper`
  - 次级标签与说明：`--muted`

---

### 2. `groupHighlightsByType()` 的固定类型顺序，不等于“今天最该先看什么”

**现状问题**  
当前 overview 按 `TYPE_OPTIONS` 固定顺序出卡，而不是按“今天哪类最多 / 哪类最重要 / 头条属于哪类”排序。  
这会让页面顺序反映内部 taxonomy，而不是用户当前扫描目标。

**适用原则（来源 + 置信度）**  
- 概览页应该按用户目标排序，而不是按系统内部组织排序。[Shneiderman / NN/g Homepage / Material Lists 排序 guidance, A/B, 中高]  
- 重要内容应放在更早、更靠左、更靠上的位置。[NN/g F-pattern / Left attention, A, 高]

**具体改法方向**  
- 排序建议改为：
  1. **头条所属分组**
  2. **当日条目数最多的分组**
  3. 其余分组按“条目数降序 + 稳定类型顺序”兜底
- 如果团队担心“每天顺序变动影响记忆”，可折中为：
  - 顶部先给 **count chips**
  - 下方分组仍部分保留稳定顺序，但头条/高频分组允许前置

---

### 3. `overviewCategoryCard()` / `overviewBriefsCard()` 对 1 条和 7 条分组使用同一种卡片壳，天然失衡

**现状问题**  
当前所有分组都渲染为同构 `overview-category` 卡片；但分组数量从 1 到 7 不等。  
结果不是“整齐”，而是：

- 少条目卡片显得空
- 多条目卡片显得重
- 同行行高被大卡片拉高后，短卡片周围会出现大片空白
- 用户会误判它们的优先级相同

**适用原则（来源 + 置信度）**  
- 卡片适合模块化摘要；同构扫描内容更适合列表。[USWDS Card / Collection, A, 高]  
- 列表对 homogeneous items 的阅读理解更高效。[Material Lists, B, 高]

**具体改法方向**  
**推荐路线（最高优先级）**：把“类目卡片网格”改为 **分组 summary sections 纵向堆叠**，而不是主打三列网格。  

也就是：

- 顶部：总览条（总量 + breakdown + 头条）
- 下方：按分组展示 **短列表 sections**
  - 每个分组一行 heading + count
  - 下方是紧凑列表，而非大卡片
  - 高数量组（如简讯）允许更长，但它会以“列表更长”出现，而不是“卡片更胖更重”

这比“所有组都放进等地位 card grid”更稳。

---

### 4. `OVERVIEW_BULLET_LIMIT = 3` + `overviewMoreButton()` 让摘要层承担了“展开详情”的工作

**现状问题**  
当前超出 3 条时通过 `展开其余 N 条` 在看板内继续长高。  
这会带来两个问题：

- 概览层在交互后变成“半详情层”
- 展开后版面高度剧烈变化，破坏首屏的稳定感

**适用原则（来源 + 置信度）**  
- `details-on-demand` 应该进入详情层，而不是让概览容器继续膨胀。[Shneiderman, A, 高]  
- 摘要箱应短、可扫、可稳定浏览。[USWDS Summary Box, A, 高]

**具体改法方向**  
- **不建议**在 glance board 内做 inline expand。
- 用以下任一种替代：
  - `+4 条` 跳转到下方对应完整 section
  - `查看本类全部`
  - 在顶部就通过 count badge 告知“此类很多”，而不是在板内长展开

如果产品目标是“每个项目在概览层都可见”，那就更应该改用 **紧凑列表**，而不是“先藏起来再展开”。

---

### 5. `OVERVIEW_NOTE_LENGTH = 46` 对中文移动端摘要偏长，且当前截断是纯字符截断

**现状问题**  
当前 note 用 `truncateText(..., 46)` 直接截断。  
这对英文短句未必离谱，但对中文暖色小字号纸面 UI 而言，46 个字很容易变成 2–3 行，造成：

- card 高度继续分化
- 句子被机械截断
- 用户需要“读”，而不是“扫”

**适用原则（来源 + 置信度）**  
- 概览摘要应该是一句提炼，先说结论。[NN/g Inverted Pyramid / Axios Smart Brevity, A/B, 高]  
- 短摘要应 convey the gist，而不是压缩正文。[NN/g Information Scent / Microcontent, A, 高]  
- 摘要型 bullet 应短；超过 20 英文词量级就不再像 summary。[USWDS Summary Box, A, 高]  
- 但把英文词数机械映射成中文字符数不是精确科学，因此“具体字符预算”只能给工程启发，不宜伪装成标准。[综合判断]

**具体改法方向**  
- 对标题：
  - 把最能区分该条目的关键词放在前 6–10 个中文字符内
  - 避免所有条目都以前缀开头（如统一品牌词、统一“本周/今日/推荐”）
- 对 note：
  - 建议目标改为 **1 个短句**，优先控制在 **18–36 个中文字符** 的量级
  - 超过这个量级的信息，应进入详情卡片，不留在 overview
- 截断策略建议从“字符截断”升级为“语义优先 + 视觉兜底”：
  1. 先取首句或首分句（`。` / `；` / `：` / `，` 前能成立时优先）
  2. 再做 CSS 两行 clamp 作为视觉保险
  3. 必须截断时，再加省略号

**这一条的具体字符范围置信度：中**  
结构规则（短句、前置关键词、一条只说一件事）置信度高；  
“18–36 字”属于结合中文界面经验与英文规范折算出的工程启发，不是行业标准。

---

### 6. `.overview-grid` 在大屏进入 3 列，会放大“右侧低注意 + 行高失衡”的组合问题

**现状问题**  
当前 `.overview-grid`：

- 默认 1 列
- `>= 640px` 2 列
- `>= 1080px` 3 列

对数据量均衡的卡片库，这可能成立；但对“1 条 / 2 条 / 7 条”差异极大的日报 grouping，3 列很容易让用户在首屏就分心。

**适用原则（来源 + 置信度）**  
- 用户对左侧和上方投入显著更多注意力。[NN/g Horizontal Attention / F-pattern, A, 高]  
- 常规布局优于为 novelty 牺牲 predictability。[NN/g Horizontal Attention, A, 高]

**具体改法方向**  
- **首选**：overview 主体维持 **单列 summary sections**  
- **次选**：overview 主体最多 **2 列**，且只在分组数量和长度相对均衡时启用
- **不建议**：把当前大屏 3 列继续保留为主布局

如果一定要保留“现代看板感”，建议把“看板感”放在顶部总览条和少量 hero block 上，而不是整个分组区都网格化。

---

### 7. 所有分组卡片视觉同权，会让“头条、总量、最多类目”没有焦点

**现状问题**  
当前 `.overview-category` 外观几乎一致，只有 dot 和 count 不同。  
这让“今日 1 条 Skill”和“今日 7 条简讯”在视觉语法上像同一等级对象。

**适用原则（来源 + 置信度）**  
- Hierarchy 主要由 scale / contrast / grouping 构成，而不是由“都长得像卡片”构成。[NN/g Visual Hierarchy, A, 高]

**具体改法方向**  
建议明确 3 个视觉层级：

1. **总览层**：`今日共 N 条`
2. **分组层**：`Skill / MCP / 简讯` heading + count
3. **条目层**：项目标题 + 一句定位

配色映射建议：

- 层级 1：`--accent` / `--accent-ink` / `--accent-soft`
- 层级 2：`--ink` + `--muted` + 类目色 dot/细边
- 层级 3：标题用 `--ink`，摘要用 `--muted`

**不要**把 `--cat-*` 大面积铺满整卡，否则会引入“色块先于信息”的新噪音。

---

### 8. `overviewBullet` 的内容结构是对的，但还缺少“真正的扫描排序”

**现状问题**  
当前每条 bullet 的结构是：

- 标题
- 一句 note

这本身是对的；问题在于 note 来源是 `summary || recommendation`，而不是专门为“glance board”写的一层 copy。

**适用原则（来源 + 置信度）**  
- Microcontent 需要 stand alone，并能在脱离上下文时仍然说清 gist。[NN/g Microcontent, A, 高]  
- 标题和摘要的前几个词决定了大部分扫描收益。[NN/g Writing Links / F-pattern, A, 高]

**具体改法方向**  
给日报数据生成端一个清晰规范：overview 层的一句话不再是“详情摘要裁剪版”，而应是下列之一：

- `它是什么`
- `为什么重要`
- `今天变化了什么`

三者只取其一；**不要三者并存**。  
如果三者都重要，说明那不是 overview copy，而是 detail copy。

---

## 卡片高度不均衡问题：具体解法方向

下面把“等高卡片 / 跨列 / masonry / 统一列表”逐一落到项目约束里。

### 路线 A：总览条 + 分组短列表（推荐，置信度高）

**结构**

```text
[ 今日共 12 条 ] [ 5 重点 ] [ 7 简讯 ] [ 4 类目 ]
头条：Claude Code hooks 新增可复用审查流

Skill（2）
- 标题 + 一句定位
- 标题 + 一句定位

MCP（1）
- 标题 + 一句定位

简讯（7）
- 标题 + 一句定位
- 标题 + 一句定位
- ...
```

**为什么最适合本项目**

- 所有条目都能保留“标题 + 一句定位”
- 不会出现 1 条组和 7 条组挤在同权三列里的空洞
- 纯静态 HTML/CSS/JS 很容易实现
- 和下方完整卡片天然形成“总览 -> 详情”分工

**适用前提**

- 接受“首屏更像 briefing board，而不是 gallery”

---

### 路线 B：保留 bento 感，但改成“加权分组板”（可行，置信度中）

**结构**

- 顶部总览条全宽
- 一个高价值/高数量分组 `span 2`
- 其余分组为 compact cards
- 大屏最多 2 列，不做 3 列

**何时适用**

- 团队强烈希望首屏保留“现代看板 / bento”观感
- 可以接受按当日权重对分组排序和跨列

**风险**

- 如果某天“简讯远多于其它组”，仍可能出现重量失衡
- 仍然需要一个非常明确的“谁是 hero、谁是 secondary”规则

---

### 等高卡片：不建议作为主解法

**原因**

- 当前问题不是“卡片不够齐”，而是“同权卡片承载的数据量差异过大”
- 强行等高只会：
  - 让短卡片显得更空
  - 让长卡片更需要折叠或截断

**适用范围**

- 仅适用于顶部 2–4 个 summary tiles
- 不适用于内容量差异巨大的分组卡片

---

### 跨列（`span`）：可作为强调手段，不是根治手段

**结论**

- 可以用来给“头条所属分组”或“最多条目分组”更高视觉权重
- 不能替代真正的信息架构调整

**最佳用法**

- 手工、有限度地跨列
- 保持 DOM 顺序和视觉顺序一致

---

### Masonry / 瀑布流：不推荐

**原因**

- CSS masonry 仍非 Baseline，生产可预期性差
- `dense` / 视觉重排会让视觉顺序与键盘/朗读顺序脱钩
- 更“满”不等于更“可扫”

**结论**

- 这不是本项目当前阶段值得引入的复杂度

---

### “统一列表而非分组网格”：在本项目里是更高置信度的方向

**判断依据**

- 当前 overview 条目结构高度同构
- 用户要做的是快速扫读，而不是逐卡比较不同信息模型
- 官方设计系统普遍把这类内容归到 collection/list，而不是 gallery card

**结论**

- 如果目标是“第一眼知道每条是什么”，那 **grouped list / summary sections** 比 **grouped card grid** 更合适

---

## `今日共 N 条` 这种总量概览，怎样传达最有效

### 推荐表达法

1. **一个主数字**：`N`
2. **两个到三个小分解**：`重点 X`、`简讯 Y`、`类目 Z`
3. **一个头条/今日关键词**

### 不推荐表达法

- 用一句长 prose 把所有数字串在一起
- 把 3–4 个数字做成完全同权重的小卡片，导致没有主焦点
- 只告诉“总数”，不告诉构成（用户不知道今天是“多重点”还是“多简讯”）

### 对本站的具体建议

- 保留 `今日共 N 条`，但从 `overview-lede` prose 中拆出
- `N` 成为最大文本
- breakdown 用小徽标/小标签承载
- `头条` 独立一行，不做句尾附言

**来源**

- [NN/g Dashboards](https://www.nngroup.com/articles/dashboards-preattentive/) [A]
- [NN/g Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) [A]
- [Shneiderman 1996](https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf) [A]
- [EU Data Visualisation Guide](https://data.europa.eu/apps/data-visualisation-guide/the-information-seeking-mantra) [A]

**置信度：高**

---

## 摘要片段：长度、截断策略、标题/摘要层级

### 1. 标题长度

没有单一行业标准的“最佳字符数”，但高置信规则是：

- 开头必须是最能区分该项目的词
- 标题应能脱离上下文独立成立
- 不要以前缀消耗前几个词的注意力

**对中文日报的工程建议**

- 最好在前 **6–10 个中文字符** 内就出现关键对象
- 若条目名普遍偏长，宁可改写为“对象 + 价值”，不要保留原始冗长命名

### 2. 摘要长度

**高置信规则**

- 一条只说一件事
- 先说结论，再说限定
- 能不用第二分句就不用

**工程建议**

- 目标为 **1 个短句**
- 经验范围：**18–36 个中文字符左右**
- 移动端尽量控制在 **1–2 行**
- 大屏 overview 里也不应超过 **2 行**

### 3. 截断策略

**推荐顺序**

1. **语义截断**：优先取首句 / 首分句  
2. **视觉截断**：CSS `line-clamp` 限高  
3. **字符截断**：最后兜底  

### 4. 标题 / 摘要排版层级

对当前 token 的映射建议：

- 标题：`--ink`，相对更重
- 摘要：`--muted`，更轻，但仍需保持 AA
- 不要在 overview bullet 内引入第三层标题样式
- `count` 继续使用 `--mono` + `tabular-nums`

### 5. 对现有实现的直接判断

- `OVERVIEW_NOTE_LENGTH = 46`：**偏长**
- `truncateText()` 纯字符截断：**可作为兜底，不应作为主策略**
- `summary || recommendation`：**方向不够纯**，建议给 overview 生成单独的 briefing copy

---

## 反模式清单

以下做法会让当前看板继续显得空洞、杂乱或难扫描：

1. **把总量概览埋进一句话里**，而不是做成独立视觉锚点。
2. **所有分组都用同一种同权 card shell**，即使它们的条目数从 1 到 7 不等。
3. **在摘要层放“展开更多”**，让概览区在交互后继续膨胀。
4. **把关键内容放在右侧第三列**，假设用户会平均看三列。
5. **用机械字符截断代替语义提炼**，产生“不知道说了什么”的半句。
6. **标题共享冗长前缀**，导致用户只能扫到重复词而不是差异词。
7. **为了“活泼”做交错 zigzag 排列**，破坏连续扫描路径。
8. **依赖 masonry / dense 自动补洞**，试图用排版算法掩盖信息架构问题。
9. **用大面积类别色做主层级**，让色块先于信息被感知。
10. **让 overview copy 承担“它是什么 + 为什么重要 + 怎么用”三重任务**，导致没有一句能真正一眼读懂。

---

## 面向现有 CSS 变量的落地提示

以下不是代码方案，而是后续改造时的 token 使用建议：

- `--accent` / `--accent-ink`：只给主概览、头条锚点、关键按钮，不要泛滥到所有类目卡片
- `--accent-soft`：适合总览条、轻量 badges、summary strip 背景
- `--paper` / `--paper-strong`：继续作为主内容承载面，保留羊皮纸层次
- `--muted`：只做次级说明，不要承担主数字或主标题
- `--cat-*`：继续只用于 dot、细边、chip，不建议做大色块
- `--shadow`：当前“耳语阴影”是对的，不建议为“现代感”加重投影

---

## 推荐的最终方向（按优先级排序）

### P0：改信息层级，不先改花样布局

先把 `overviewBoard` 改成：

1. **总览条**
2. **头条**
3. **分组短列表**

而不是继续微调现有三列网格。

### P1：如果必须保留 bento 感，也要先限制为“少量加权块”

可以保留 bento 的地方是：

- 总览条
- 一个 hero group
- 少量 secondary groups

不应该是“所有分组都进入同权重 bento grid”。

### P2：把 overview copy 当成单独文案层维护

不要再把详情摘要直接裁成 46 字。  
把 overview copy 定义为一种独立字段或生成规则，哪怕初期只是“首句提炼”。

---

## 参考来源清单

### A 级

1. NN/g, *Dashboards: Making Charts and Graphs Easier to Understand*  
   <https://www.nngroup.com/articles/dashboards-preattentive/>
2. NN/g, *F-Shaped Pattern of Reading on the Web*  
   <https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/>
3. NN/g, *Text Scanning Patterns: Eyetracking Evidence*  
   <https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/>
4. NN/g, *Visual Hierarchy in UX*  
   <https://www.nngroup.com/articles/visual-hierarchy-ux-definition/>
5. NN/g, *Information Scent*  
   <https://www.nngroup.com/articles/information-scent/>
6. NN/g, *Writing Hyperlinks: Salient, Descriptive, Start with Keyword*  
   <https://www.nngroup.com/articles/writing-links/>
7. NN/g, *Inverted Pyramid: Writing for Comprehension*  
   <https://www.nngroup.com/articles/inverted-pyramid/>
8. NN/g, *Microcontent*  
   <https://www.nngroup.com/articles/microcontent-how-to-write-headlines-page-titles-and-subject-lines/>
9. NN/g, *Horizontal Attention Leans Left*  
   <https://www.nngroup.com/articles/HORIZONTAL-attention-leans-left/>
10. NN/g, *Zigzag Image–Text Layouts Make Scanning Less Efficient*  
    <https://www.nngroup.com/articles/zigzag-page-layout/>
11. Ben Shneiderman, *The Eyes Have It* (1996)  
    <https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf>
12. EU Data Visualisation Guide, *The information-seeking mantra*  
    <https://data.europa.eu/apps/data-visualisation-guide/the-information-seeking-mantra>
13. U.S. Web Design System, *Card*  
    <https://designsystem.digital.gov/components/card/>
14. U.S. Web Design System, *Collection*  
    <https://designsystem.digital.gov/components/collection/>
15. U.S. Web Design System, *Summary box*  
    <https://designsystem.digital.gov/components/summary-box/>
16. GOV.UK Design System, *Summary list*  
    <https://design-system.service.gov.uk/components/summary-list/>
17. GOV.UK Design System, *Task list*  
    <https://design-system.service.gov.uk/components/task-list/>
18. GOV.UK Design System, *Question pages*  
    <https://design-system.service.gov.uk/patterns/question-pages/>
19. MDN, *Masonry layout*  
    <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout>
20. MDN, *Grid layout and accessibility*  
    <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility>

### B 级

21. Axios Help Center, *What is the Axios “Smart Brevity” style?*  
    <https://help.axios.com/hc/en-us/articles/36222626161435-What-is-the-Axios-Smart-Brevity-style>
22. Axios, *Our secret sauce for better communication*  
    <https://www.axios.com/2022/09/23/our-secret-sauce-for-better-communication-axios-smart-brevity>
23. Axios, *5 tips from "Smart Brevity": Short, not shallow*  
    <https://www.axios.com/2022/09/30/5-tips-from-smart-brevity-short-not-shallow>
24. Material Design, *Lists*  
    <https://m1.material.io/components/lists.html>
25. Material Design, *Writing*  
    <https://m1.material.io/style/writing.html>

---

## 最后一句判断

如果只允许我给一个最高置信、最不花哨、最能改善当前反馈的问题诊断，那就是：

> **把 overview 从“分组卡片网格”改成“总览条 + 分组短列表”，并把 `今日共 N 条` 从 prose 里解放出来。**

这一步比任何“更现代的卡片样式”都更能直接提升“一眼可读”。
