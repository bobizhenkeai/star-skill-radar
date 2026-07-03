# 仪表盘 / 简报头部 KPI 展示设计调研

> 项目：Star-Skill Radar  
> 范围：`site/index.html` 的 `.hero` / `.hero-stats`，以及 `site/styles.css` 中对应样式；为确认指标语义，补读了 `site/app.js` 的 `renderStats()`。  
> 目标：给出一份高置信度、可直接映射到现有 DOM 与 CSS 变量体系的设计建议，重点解决：
> 1. 三个统计块像“贴上去的白盒子”，与羊皮纸暖色基调不协调。  
> 2. `2026-07-02` 在窄框里断成两行。  
> 3. 顶部 KPI 是否值得放、该放哪三个、如何避免“虚荣指标”与装饰性数字。

## 一、结论先行

1. **`hero-stats` 不应继续是 3 个彼此独立的白卡，而应改成 1 个 grouped stat strip / brief band。**  
   相关指标应该先作为一个整体被感知，再在内部用细分隔线切成 3 个区块；这比“3 张并列小白卡”更符合 dashboard/brief 的层级组织，也更贴合你们“暖色纸面 + 墨绿”的编辑式风格。（来源：[1][2][3][4][5][16][17]；置信度：**高**）

2. **`最新日期` 应上提为第一优先级，不应排在第三。**  
   对“每日更新的 AI 技术资产情报站”而言，用户最先判断的是“今天/最近是否更新”，其次才是“站点累计多少期”“累计收录多少重点”。也就是说，hero 顶部 KPI 的优先级应是：**新鲜度 > 覆盖度 > 内容规模**。（来源：[2][4][7][8]；置信度：**高**）

3. **当前日期断行的根因，不是没有 `tabular-nums`。**  
   `site/styles.css` 里 `.hero-stats strong` 已经设置了 `font-variant-numeric: tabular-nums`。真正的问题是：  
   - desktop 右栏只有 `340px`；  
   - `.hero-stats` 被三等分；  
   - 每个子块还有左右 padding；  
   - `#statLatestDate` 没有 `white-space: nowrap`。  
   所以**“加 `nowrap`”是必要条件，但不是充分条件**；如果布局不改，只会把“断两行”变成“单行溢出”。（来源：[9][10][11]；结合当前代码推导；置信度：**高**）

4. **`已加载重点数` 这个文案本身像实现状态，不像用户价值。**  
   顶部 KPI 应描述“用户为什么要继续看这个站”，而不是“页面内部已经加载了什么”。这个指标本身有价值，但更适合命名为 `累计重点` / `收录重点` / `重点条目` 一类**用户语言**。（来源：[4][7][8][18]；置信度：**高**）

5. **推荐优先方案：一个单一 warm strip + `最新日期` 全宽主行 + 两个次级计数第二行。**  
   这是同时解决“白盒子感”“日期不断行”“指标优先级混乱”“移动端堆叠太高”的最稳妥方案；比“把三张卡染成米色”更根治。（综合来源：[1][2][4][5][7][8][16][17]；置信度：**高**）

---

## 二、现状审计（基于当前实现）

### 1. DOM 结构

`site/index.html` 中 `.hero-stats` 目前是 3 个裸 `div`：

- `期日报数`
- `已加载重点数`
- `最新日期`

容器层没有自己的视觉表面，子项各自成块，因此视觉上更像“3 个贴上的 widget”，而不是“hero 的一部分”。

### 2. 样式结构

`site/styles.css` 当前关键点：

- `.hero` 在 `min-width: 740px` 时为 `grid-template-columns: 1fr 340px;`
- `.hero-stats` 为 `grid-template-columns: repeat(3, minmax(0, 1fr));`
- 子块各自有：
  - `border: 1px solid var(--line);`
  - `border-radius: var(--radius);`
  - `background: rgba(255, 253, 248, 0.78);`
  - `padding: 14px 12px;`
- `.hero-stats strong` 已有：
  - `font-family: var(--mono);`
  - `font-variant-numeric: tabular-nums;`
  - `font-size: 20px;`
- 仅在 `max-width: 420px` 时，`.hero-stats` 才改成单列堆叠。

### 3. 指标实际语义

`site/app.js` 的 `renderStats()` 显示：

- `statIssueCount` = `state.issueDates.length`：站内累计期数
- `statHighlightCount` = 所有 issue 的 `highlights.length` 求和：站内累计重点数
- `statLatestDate` = `state.issueDates[0]`：最新日期

也就是说，当前 3 个指标本质上是在表达：

- **覆盖范围**：多少期
- **累计内容规模**：多少重点
- **新鲜度**：最新到哪天

这 3 个指标是可以成立的；问题不在“有没有必要存在”，而在**排序、文案、层级和容器形式**。

### 4. 日期断行的版式数学

当前 desktop 右栏只有 `340px`，三等分且 gap 为 `8px`：

```text
340px - 2 * 8px gap = 324px
324 / 3 ≈ 108px / 卡片外框
108px - 24px 左右 padding - 2px border ≈ 82px 内容宽
```

`2026-07-02` 是 10 个字符；而当前值使用 `20px` 的 `var(--mono)`。  
所以即便已有 `tabular-nums`，日期值也**没有足够的 inline 空间**，在允许换行时会断到第二行；如果强行 `nowrap`，则会转成溢出风险。

**这说明根治 Q2 不能只加一条排版属性，必须同时调整容器结构。**

---

## 三、证据归纳：哪些原则是“可核验、能落地”的

| 议题 | 可核验结论 | 主要依据 | 置信度 |
| --- | --- | --- | --- |
| hero 顶部是否应该放 KPI | 可以放，但只能放“帮助用户在一眼内做判断”的 overview 指标，不能把 detail 或实现状态搬上来 | [2][4][7][8][18] | 高 |
| KPI 排序 | 最重要的信息应放上方 / 左上；summary 在前，filters/details 在后 | [2][4][7][8] | 高 |
| KPI 颗粒度 | 一个 KPI 应是一条清晰消息；Carbon 明确定义 KPI 为“数字 + 单个简短描述” | [6][7][18] | 高 |
| 容器形态 | 相关指标可放进一个 shared container，并用 split lines / spacing / surface colors 区分；不要滥用独立浮卡 | [1][2][3][5][16][17] | 高 |
| 日期排版 | `tabular-nums` 负责数字对齐，不负责不换行；`white-space: nowrap` 才负责“不折行”，但会把问题转成 overflow，因此必须给日期更多 inline room | [9][10][11] | 高 |
| 日期本地化 | 机器值应用标准化日期格式；展示值应用 `Intl.DateTimeFormat` 或保持明确的 `YYYY-MM-DD`；避免歧义 numeric date | [12][13][14] | 高 |
| 响应式 | 设计必须按最终显示尺寸 author；手机端应减少 tile 数量或改成不同布局，避免挤压与滚动条 | [3][7][8][16] | 高 |
| 颜色/对比度 | 暖色纸面可以保留，但正文/小字仍应守住 WCAG AA：普通文字至少 4.5:1，大字至少 3:1 | [15] | 高 |

---

## 四、现状问题 → 适用原则 → 具体改法方向

### 4.1 顶部 KPI 到底该不该放？该放哪三个？

### 现状问题

- 当前 3 个值都是真实有意义的数据，但排序不对：`最新日期` 被放在最后。
- `已加载重点数` 的“已加载”是实现口吻，不是用户口吻。
- 3 个指标视觉上等权，但对日报类站点而言，它们并非等权。

### 适用原则

- dashboard 顶部应只放**帮助用户立即判断下一步**的 overview 指标，而不是 detail 或装饰性数字。（[4][7][8][18]；置信度：高）
- 最重要的信息应放在上方 / 左上方；summary 在前，细节在后。（[2][4][7][8]；置信度：高）
- KPI 应该尽量是“清晰的数字 + 简短说明”，文案直指用户理解，而不是内部状态。（[6][7][18]；置信度：高）

### 具体改法方向

- **保留 3 个指标是合理的**，但建议重排为：
  1. `最新日期`（freshness）
  2. `期日报数` / `收录期数`（coverage）
  3. `累计重点` / `收录重点`（content scale）
- 建议把 `已加载重点数` 改成更用户中心的文案：  
  - 首选：`累计重点`  
  - 备选：`收录重点`、`重点条目`
- 如果未来 hero 顶部空间再被压缩，**最先应该下掉的是“累计重点”，而不是“最新日期”**。对这个项目，更新时间是第一价值信号。

---

### 4.2 Q2 核心：为什么它现在像“贴上去的白盒子”，以及怎样与羊皮纸主题融合

### 现状问题

- 当前视觉分组发生在**子项层**：3 个子块各自有边框、圆角、背景。
- 父容器 `.hero-stats` 自身没有成为一个“整体表面”。
- 结果是：用户首先看到的是“3 张小卡片”，而不是“hero 右侧的一条简报概览”。
- 这与站点当前的暖色纸面、编辑式版面、弱投影/细描边语言不一致。

### 适用原则

- Ant Design 明确建议：**紧密相关的数据集可以放进一个 card，并用 split lines 分区**，而不是机械地“一指标一卡”。（[2]；置信度：高）
- Carbon 明确指出：tile 与页面背景处于**同一平面**，**不要用阴影**制造“浮起来”的次级信息块。（[5]；置信度：高）
- Polaris 在高密度信息场景中建议：用**divider lines 和 surface colors** 创建视觉分区，而不是堆很多独立 card。（[16]；置信度：高）
- Proximity 原则指出：更近的元素会被读成一个整体，spacing 与 guide 应服务于层级组织。（[3]；置信度：高）

### 具体改法方向

**推荐把 `.hero-stats` 从“3 张卡”改成“1 条 grouped strip”。**

具体映射到你们现有变量体系时，建议这样理解：

- **由父容器拥有表面**：  
  `hero-stats` 自己承担 `border` / `radius` / `background` / 可能的轻微内嵌感。
- **子项只承担分区，不再各自成卡**：  
  3 个子 `div` 去掉独立 `background`、独立 `border`、独立 `radius`，改为透明区块。
- **分区靠细分隔线，不靠 3 张白卡**：  
  桌面端用 `border-inline-start`；移动端改成 `border-block-start`。
- **色彩上继续使用现有 token，不引入新冷灰或高亮卡色**：  
  - 纸面：`--bg`
  - inset surface：优先继续靠近 `--paper`，但要比当前子卡更“沉”到纸面里  
  - 分隔线：`--line` / `--line-strong`
  - 主文字：`--ink`
  - 次级标签：`--muted`
  - 强调只给主指标或极少量细节，仍由 `--accent` / `--accent-ink` 控制

### 推荐视觉语义

这块区域更像“**站点概览条 / brief band**”，而不是“dashboard widget board”。  
因此它最适合的视觉特征是：

- 单一暖色表面
- 轻描边
- 内部分栏
- 小范围强调色
- 与 hero 标题同一平面、同一节奏

而**不适合**：

- 3 张独立高亮底卡
- 更白的底色
- 更强的圆角/阴影
- 每一块都抢 headline 的注意力

---

### 4.3 Q2 根治：日期为什么会断行，以及怎样真正修好

### 现状问题

- 当前 `.hero-stats strong` 已经有 `font-variant-numeric: tabular-nums`。
- 但 `#statLatestDate` 仍会在 `2026-07-02` 这种格式下断行。
- 原因不是“数字没对齐”，而是“**容器太窄 + 没有禁止换行**”。

### 适用原则

- MDN：`tabular-nums` 的职责是**让数字等宽，便于对齐**；它不处理折行。（[9][11]；置信度：高）
- MDN：`white-space: nowrap` 的职责是**禁止文本跨行换行**；但当内容宽于容器时，它会转成 inline 方向的 overflow。（[10]；置信度：高）
- Ant Design：时间、状态等这类易失真信息应保持完整，不应在狭小区域中被拆断。（[1]；置信度：高）
- W3C / MDN：机器值应用规范日期字符串；展示值可用 `Intl.DateTimeFormat` 做 locale-aware 格式化；numeric date 若面向多 locale 可能有歧义。（[12][13][14]；置信度：高）

### 具体改法方向

#### 必做项

- 把最新日期值包进 `<time datetime="2026-07-02">2026-07-02</time>` 一类语义化元素。
- 对 visible date 应用：
  - `white-space: nowrap`
  - `font-variant-numeric: tabular-nums`
  - 若字体支持，可补 `lining-nums`

#### 但仅做这些还不够

如果仍保留“desktop 340px 右栏 + 3 等分卡片”，那 `nowrap` 只会把问题从**断两行**换成**单行溢出**。

因此需要二选一：

1. **给日期更多 inline 空间**  
   例如让日期所在区块按内容宽度增长，或干脆占满第一行。

2. **改变整体布局**  
   让 `最新日期` 不再与两个短数字共享完全相同的 1/3 轨道宽度。

### 建议的显示格式

- 对本项目这种中文、技术语境、更新频率高的站点，hero 顶部最新日期**继续显示 `YYYY-MM-DD` 是合理的**：
  - 紧凑
  - 明确
  - 与当前数据源和路由一致
  - 不会像 `07/02/2026` 那样产生地区歧义
- 不建议把最新日期截断成省略号；**日期是 freshness 核心信息，不该藏。**

### 一个重要判断

**当前 Q2 的根治关键不是“要不要 `tabular-nums`”，而是“给日期完整的一行空间”。**

---

### 4.4 数字与标签的排版层级：现在为什么读起来像 3 个同级白块

### 现状问题

- 3 个值都使用同一字号、同一字重、同一块状边框。
- 标签全部在第二行、次级灰，但没有主次 KPI 的明确区分。
- 结果是：视觉层级只剩“3 张同等重要的卡”。

### 适用原则

- Carbon 对 KPI 的定义是：**一个数字 + 一个简短说明**。（[6]；置信度：高）
- Power BI / Carbon / Ant 一致强调：最重要的指标应拥有**更突出的位置或更强对比**，不应与次级指标完全等权。（[2][4][7]；置信度：高）
- 支撑信息可以存在，但应作为 secondary reference，而不是和主值争夺注意力。（[7][18]；置信度：高）

### 具体改法方向

- 不要让 3 个值完全同权。
- **优先用“位置”和“容器层级”区分主次，而不是只靠把一个数字做得更大。**
- 推荐层级：
  - **主层**：`最新日期`
  - **次层**：`期日报数`、`累计重点`
- 文案长度要短，尽量控制在 2-4 个汉字的感知复杂度：
  - `最新日期` 或 `更新至`
  - `期日报数` / `收录期数`
  - `累计重点`
- 若保留当前 `--mono` 作为值字体，可继续保留技术气质；但要意识到：
  - mono 会增大日期宽度压力
  - 因此布局上更应给 `最新日期` 单独空间

---

### 4.5 响应式：桌面端横排、移动端如何堆叠/收纳

### 现状问题

- 目前只有 `max-width: 420px` 时才改为单列。
- 这会让移动端出现 3 块上下叠的“小卡墙”，纵向节奏偏重，且仍保留重复边框与背景。

### 适用原则

- Tableau / Power BI 都强调：dashboard 必须按**最终观看尺寸** author，不要指望固定布局在小屏上自然缩得好看。（[7][8]；置信度：高）
- Polaris 的高密度布局建议更适合这里：**用分隔线/色面形成紧凑信息带，而不是连续小卡堆叠**。（[16]；置信度：高）
- Ant 的 proximity / grid 建议也支持在不同宽度下调整分组方式，而不是死守同一格栅。（[3]；置信度：高）

### 具体改法方向

#### Desktop（推荐）

- 仍放在 hero 右侧，但改为**单一 grouped strip**。
- 最稳妥的是：
  - 第一行：`最新日期`
  - 第二行：`期日报数 | 累计重点`

#### Tablet / 小桌面

- 若右栏宽度不足以容纳 3 个等宽区块，不要硬撑 3 等分。
- 优先继续沿用“1 行主指标 + 1 行双列次指标”的结构。

#### Phone

- 不建议保留 3 张垂直独立 card。
- 推荐两种形式之一：
  1. **三条紧凑行**：每行一个 label-value pair，像 brief list  
  2. **一条主行 + 两条次级行**：延续桌面语义

换句话说：**移动端应该“压成一条信息带”，而不是“堆成三张卡”。**

---

### 4.6 反模式清单

以下做法不建议在这个组件上继续使用：

1. **把“实现状态”当 hero KPI 文案**  
   例如 `已加载重点数`。这更像程序状态，不像用户价值。

2. **让 3 个指标完全同权**  
   对日报站点，`最新日期` 必须比其余两个更重要。

3. **继续使用 3 张并列白底子卡**  
   即使把白卡改成米色卡，仍然只是“3 张卡”，没有解决 group-level hierarchy。

4. **试图只靠 `tabular-nums` 修复日期断行**  
   `tabular-nums` 只解决对齐，不解决换行。

5. **给日期加 `ellipsis`**  
   freshness 信息不应该被截断。

6. **使用模糊或地区歧义的 numeric date**  
   例如 `07/02/2026`。

7. **为了“更像 dashboard”而增加趋势箭头、绿色/红色状态、微图表**  
   当前这 3 个值没有 target / delta / threshold，就不该硬加金融终端式装饰。

8. **用更白的白色、更重的阴影来“凸显”统计块**  
   这会进一步破坏羊皮纸整体感，也可能伤害对比与版面重心。

9. **在移动端保留 3 张竖向卡片墙**  
   这会拉长 hero，高度成本过高。

---

## 五、对 Star-Skill Radar 的推荐方案

### 方案 A（推荐优先）：Grouped Brief Band

### 信息结构

```text
┌ 站点概览 ─────────────────────┐
│ 更新至    2026-07-02         │
│ 期日报数  37   |  累计重点 156 │
└─────────────────────────────┘
```

### 为什么这是最佳解

- **视觉上**：从“3 张贴片”变成“hero 右侧的一条概览带”
- **语义上**：`最新日期` 获得第一优先级
- **技术上**：日期拿到完整一行，不再与短数字竞争同一列宽
- **移动端上**：可以自然压缩成 2-3 行，而不是 3 张卡
- **主题上**：更像编辑式纸面 brief，而不是 SaaS 小组件

### 与现有变量的映射建议

- 背景基调：继续围绕 `--bg` / `--paper`
- 表面边界：`--line` / `--line-strong`
- 主值颜色：`--ink`；若需要只突出主指标，可小范围使用 `--accent-ink`
- 标签颜色：`--muted`
- 字体：
  - 值：延续 `--mono` 可行，但 `最新日期` 必须拿到更宽的 inline 空间
  - 标签：继续 `--sans`

### 适合这个项目的原因

Star-Skill Radar 不是 BI 监控台，也不是增长后台；它更接近**“编辑型情报简报”**。  
因此顶部 KPI 更应该像 **brief metadata**，而不是 **product analytics widget**。

---

### 方案 B（次优，最小改动思路）：仍保留 3 个数据节点，但改成 shared strip

如果希望尽量少改 HTML 结构，可以保留现有 3 个 `div`，但要改视觉归属：

- 由 `.hero-stats` 拥有统一的 `border` / `radius` / `background`
- 子项改成透明分区，不再各自拥有白底卡片
- `#statLatestDate` 必须 `nowrap`
- desktop 不再强行 3 等分：
  - 要么右栏更宽
  - 要么让日期所在分区按内容宽度伸展

这个方案能明显改善视觉协调性，但**不如方案 A 稳**，因为它仍倾向把 3 个指标读成同级并列。

---

## 六、为什么“只改颜色”不是根治

如果只是把当前 3 张子卡的背景从偏白改成偏米色：

- 视觉上仍然是 3 个离散块
- 语义上仍然没有主次
- 日期仍然会因为列宽问题断行或溢出

因此 Q2 的根因不是“白得不够暖”，而是：

1. **group-level hierarchy 错位**：分组发生在错误层级  
2. **freshness priority 错位**：最重要指标排最后  
3. **inline-size 不足**：日期与短数字被强行等宽  

这三个问题必须一起修，观感才会真正从“贴上去的白盒子”变成“纸面上的简报概览”。

---

## 七、最终建议（可直接执行的设计决策）

1. **保留 3 个指标，但重排为 `最新日期` → `期日报数` → `累计重点`。**
2. **把 `hero-stats` 改成一个 grouped strip，不再是 3 张独立小卡。**
3. **让 `最新日期` 获得完整一行或至少 `max-content` 级别的 inline 空间。**
4. **对日期值使用 `<time datetime>` + `white-space: nowrap`；继续保留 `tabular-nums`，必要时补 `lining-nums`。**
5. **文案从“实现状态”改成“用户价值”：`已加载重点数` 改成 `累计重点` / `收录重点`。**
6. **视觉上继续复用现有暖色 token，不引入纯白卡、重阴影、冷灰边框。**
7. **移动端把这块收成信息带，而不是竖向三卡堆叠。**

---

## 八、来源与可靠性

> 说明：以下外部来源均为官方设计系统、官方技术文档或标准组织文档；未使用普通技术博客或 StackOverflow 作为结论依据。

| 编号 | 来源 | 类型 | 可靠性 | 本报告主要用途 |
| --- | --- | --- | --- | --- |
| [1] | [Ant Design / Data Display](https://ant.design/docs/spec/data-display/) | 官方设计系统 | A | 信息排序、极端状态、时间/状态不应断裂 |
| [2] | [Ant Design / Visualization Page](https://4x.ant.design/docs/spec/visualization-page) | 官方设计系统 | A | summary-first、key scorecards 置顶、相关数据可同卡分区 |
| [3] | [Ant Design / Proximity](https://ant.design/docs/spec/proximity/) | 官方设计系统 | A | spacing 组织、grid 适配不同尺寸 |
| [4] | [IBM Carbon / Dashboards](https://v10.carbondesignsystem.com/data-visualization/dashboards/) | 官方设计系统 | A | KPI relevant to business problem、层级、白空间、限制指标数 |
| [5] | [IBM Carbon / Tile](https://carbondesignsystem.com/components/tile/usage/) | 官方设计系统 | A | tile 与页面同平面、不要阴影、group related info |
| [6] | [IBM Carbon / Chart Anatomy](https://v10.carbondesignsystem.com/data-visualization/chart-anatomy/) | 官方设计系统 | A | KPI = 数字 + 简短说明 |
| [7] | [Microsoft Learn / Tips for designing a great Power BI dashboard](https://learn.microsoft.com/en-us/power-bi/create-reports/service-dashboards-design-tips) | 官方产品文档 | A | audience-first、top-left priority、single-screen、number formatting |
| [8] | [Tableau / Best Practices for Effective Dashboards](https://help.tableau.com/current/pro/desktop/en-us/dashboards_best_practices.htm) | 官方产品文档 | A | upper-left priority、author for final display size、限制视图数 |
| [9] | [MDN / font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric) | 官方技术文档 | A | `tabular-nums` 的职责边界 |
| [10] | [MDN / white-space](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/white-space) | 官方技术文档 | A | `nowrap` 的行为与 overflow 后果 |
| [11] | [MDN / OpenType font features](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/OpenType_fonts) | 官方技术文档 | A | `tabular numbers` / `lining figures` 的排印用途 |
| [12] | [MDN / Using date and time formats in HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Date_and_time_formats) | 官方技术文档 | A | 机器可读日期格式、`datetime` 规范 |
| [13] | [MDN / Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) | 官方技术文档 | A | locale-aware 日期展示 |
| [14] | [W3C / Guide to the ECMAScript Internationalization API](https://www.w3.org/International/articles/intl/index) | 标准组织文档 | A | numeric date 歧义、`Intl` 的推荐用法 |
| [15] | [W3C / WCAG 2.1 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) | 标准组织文档 | A | 4.5:1 / 3:1 对比度底线 |
| [16] | [Shopify Polaris / Density](https://polaris.shopify.com/design/layout/density) | 官方设计系统 | A | 高密度信息界面的 surface color/divider/grid 组织方式 |
| [17] | [Shopify Polaris / Card](https://polaris.shopify.com/components/layout-and-structure/card?example=card-with-footer-actions) | 官方设计系统 | A | card 应服务于扫描与优先级，而非堆砌 |
| [18] | [Microsoft Learn / Create a card visual in Power BI](https://learn.microsoft.com/en-us/power-bi/visuals/power-bi-visualization-card) | 官方产品文档 | A | 主值 + supporting details 的层级关系 |

---

## 附：与仓内既有风格研究的关系

仓内已有 `docs/research/frontend-redesign-parchment-cjk-typography.md` 对“暖色羊皮纸 + 墨绿 + 低投影 + 中文排印”做过前置研究。  
本报告与其结论**一致**：顶部 KPI 区不应通过更白、更亮、更浮的卡片来“显眼”，而应通过**单一暖色表面、细分隔、明确层级和更好的内容优先级**来融入整体。
