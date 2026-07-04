# 自动化流水线审查报告 · 应用价值 / 用户决策效用维度

> 审查对象：Star-Skill Radar 每日自动化流水线（采集 → 报告/JSON → 情报站 + 微信推送 → 用户决策）
> 审查维度：站在目标用户（用 Cursor/Claude Code/Codex 的开发者，单用户自用）的**决策视角**，审"这条自动化最终是否帮用户更好地决定采纳什么资产、怎么用"。
> 角色：只读审查 subagent。本文件为唯一产出，未修改任何流水线工件。
> 日期：2026-07-04

---

## ① 审查范围与方法

**审查范围（实际读取的工件）**

- 需求与契约：`docs/prds/star-skill-radar-v1.0-prd.md`、`docs/specs/data-contract.md`（v2.3）、`docs/sop/daily-runbook.md`、`docs/sop/credibility-dedup-rules.md`、`docs/sop/report-template.md`。
- 真实产出：`data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`、`data/ledger.json`、`data/issues/index.json`、`reports/2026-07-02.md`、`reports/2026-07-03.md`。
- 触达与前端：`.github/workflows/notify-wechat.yml`、`site/app.js`、`README.md`。
- 参考：`docs/research/frontend-v2-dashboard-first-principles.md`（含 NN/g、Axios Smart Brevity 等对标）。

**方法**

1. 沿"价值链"逐环追踪：原始资产 → 结构化 JSON（highlights/briefs）→ Markdown 报告 + 情报站 + 微信推送 → 用户"是否采用/怎么用"的决策动作，定位链路断点。
2. 以 PRD 价值主张（L14/L21/L37）为验收基线，用两期真实数据逐条比对承诺与产出的差距。
3. 信噪比分析：统计两期 highlights/briefs 数量、类型分布、stage_tags 分布、去重与"重大更新"判定实际执行情况。
4. 轻量外部对标：以 1440 / TLDR / The Rundown 等成熟日报/摘要产品的**价值取舍**（策展稀缺、头条前置、主题行即价值、"why it matters"框架）作为高置信度常识性参照；排版/信息架构部分复用项目自有循证调研的结论（Axios Smart Brevity、NN/g overview-first）。
5. 区分**事实**（引用行号/数据/workflow）与**判断**（决策效用推理/对标）。

**证据口径说明**：外部对标仅取业界公认的产品定位，不宣称对标产品的实时指标；对 star 数真伪的取证属"可信度维度"职责，本报告仅就其**对决策效用的影响**点名（见 F1）。

---

## ② 关键发现

### F1　推荐逻辑高度依赖 star 信号，而 star 数存在极强内部不合理性，决策依据可能被系统性误导

- **现状（事实）**：
  - 两期数据中的 star 量级异常巨大：`data/issues/2026-07-02.json` obra/superpowers **243,701 stars**（L10）、mattpocock/skills **153,443**（L46）、anthropics/claude-code **135,379**（L81）；`data/issues/2026-07-03.json` affaan-m/ECC **225,218 stars**（L80）、msitarzewski/agency-agents **125,563**（L150）、Fission-AI/OpenSpec 58,409（L116）；`data/ledger.json` anthropics/skills 157,365（L9）。
  - 推荐理由（`recommendation`）大量以 star 为核心论据：如 07-02 L25「社区热度极高」、L61「stars 远超 1k 门槛」、L164「stars 超 1k」；07-03 L95「stars 远超 1k 门槛」、L165「stars 极高」。站点把 `recommendation` 直接渲染为核心态"为什么重要"（`site/app.js` L1316）。
  - SOP 明令 star 必须实时查询、禁止模型记忆：`credibility-dedup-rules.md` L41-54、PRD 风险 L72。
- **问题（判断）**：这些 star 处于 12 万–24 万区间。若属实，几乎**每个当日条目都将跻身 GitHub 全站 star 最高的十余个仓库**——单日 AI 资产采集出现如此密集的"超级仓库"在统计上几乎不可能（例：affaan-m/ECC 号称 22.5 万 star，反超 anthropics/claude-code 自身）。无论根因是采集失真还是模型记忆残留，用户的"采用"决策正建立在被夸大的权威/社会认同信号之上——这是对决策效用最根本的破坏：越是"高星就推荐"的叙事，越会把用户导向失真的结论。
- **严重度：P0**
- **依据**：用户决策效用（社会认同/权威是采纳决策的首要启发式，一旦被夸大即构成误导）+ 内部一致性统计判断。（star 真伪取证请由可信度维度确证。）
- **改进建议（选项式）**：
  - (a) 待可信度维度确证 star 事实后，推荐理由**去"唯 star 论"**，改为多信号并陈（官方背书 / 近 30 天维护活跃度 / 是否被官方 docs·registry 收录 / license 与可复用性）。
  - (b) 对异常量级（如 > 某阈值）设**人工/二次复核 gate**，并在报告与站点把 star 与其采集来源链接放在一起，便于一键核验。
  - (c) 报告模板显式禁止把 star 作为唯一论据（在 `report-template.md` "推荐理由"处加约束）。

### F2　微信推送零决策信息，触达环节"是否值得点开"无判断依据

- **现状（事实）**：`.github/workflows/notify-wechat.yml` L24-31：`TITLE` 仅「Star-Skill Radar 情报更新（日期）」，`DESP` 仅「今日 AI 技术资产情报已生成」+ 永久入口 + 当日 Markdown 链接。**不含任何条目名、头条、数量或 gist**。而数据契约 v2.2/v2.3 专门为"一眼可读"新增了 `highlights[].gist` 与 `briefs[].gist`（`data-contract.md` §2.2；两期数据均已回填，如 07-02 L11「跨工具链技能方法论，串起规格、计划与子代理执行」），推送侧却完全没有消费它。
- **问题（判断）**：微信是本流水线**唯一"打断式"触达渠道**。一条不含任何内容线索的"有更新"提醒，用户无法判断今天是否值得点开——尤其在 F3（多数日无真·新增）背景下，长期"空提醒"会训练用户忽略推送，消除信息差的"最后一公里"断裂。项目已造好 `gist` 这把钥匙，却没插进锁孔。
- **严重度：P1**
- **依据**：外部对标（高置信度）——1440 / TLDR / The Rundown 的邮件主题行/推送都**前置当期头条 + "why it matters"**，靠标题即产生打开价值；本推送退化为"通知有更新"的空信封。
- **改进建议（选项式）**：
  - (a) workflow 内读取 `data/issues/${TODAY}.json`，把**头条 `name` + `gist` + 重点/简讯计数**写入 `DESP`（jq 解析即可）。
  - (b) 若不愿在 Actions 里解析 JSON，让 SOP 额外产出一份 `data/issues/${date}.push.txt/md` 推送文案，workflow 直接注入。
  - (c) 最低成本：至少把当日 5 个 highlight 名称逐行列进推送正文。
  - 附带健壮性：`DESP` 里 `reports/${TODAY}.md` 的 `TODAY` 取 Actions 运行日（`notify-wechat.yml` L23），跨零点触发时可能与报告实际日期错位，建议改用报告内 `date` 字段回填。

### F3　日报节奏产出"低边际新增决策价值"，且从未触发降级，疑似凑数到 5 条

- **现状（事实）**：两期 `source_gaps` 都明确写明"当日无合格新仓"：07-02 L225「created:>=2026-07-02 ... 本期无合格当日新仓重点条目」；07-03 L214「created:>=2026-07-03 ... 返回 0 个 ... 本期无合格当日新仓重点条目」。但两期 highlights **均恰好 5 条**，全部由存量大仓/已知项目填充（07-02 的 5 条与 07-03 的 5 条无一是"当日新出现的资产"）。PRD L4/L41 与 `report-template.md` L48-72 明确规定"无合格条目降级为『本期无重点条目』，不硬凑"，而**"本期无重点条目"模板从未被使用**。
- **问题（判断）**：日报每天都产 5 条深度条目，但真正"当日新增"信号为零，highlights 实为"常青大仓轮播"。对单用户自用，这带来高噪音、低边际决策价值，并架空了 PRD 的"不硬凑"承诺——用户很难从今天的 5 条里读出"相较昨天，我该新采纳什么"。
- **严重度：P1**
- **依据**：用户决策效用 + 外部对标（1440/TLDR 宁少勿滥，用稀缺性维持每期打开价值；"每天必须满 5 条"与之相反）。
- **改进建议（选项式）**：
  - (a) 设硬规则："当日 ≥N 条真·新增/真·重大更新才产深度 highlights，否则整期降级为简讯 + 无重点条目"。
  - (b) **频率与深度解耦**：保持每日采集与 catalog/简讯更新，但"重点深度分析"改为"有货才发"。
  - (c) 把存量大仓一次性沉淀进 `catalog`，highlights 只保留真正的当日变化（配合 F8 的聚合视图）。

### F4　"重大更新追踪"门槛被放宽到 patch 级，同一官方项目连日霸榜

- **现状（事实）**：anthropics/claude-code 在 07-02（L77，v2.1.198）与 07-03（L42-46，v2.1.199）连续两日均为 highlight，07-03 标 `is_update=true`，证据是相隔一天的补丁 v2.1.198→v2.1.199。github/spec-kit 07-02 首收→07-03 以 v0.12.3→v0.12.4 再度上榜，报告自陈「v0.12.4 在 v0.12.3 收录后 **24 小时内**发布」（07-03 L25/L31）。而 `credibility-dedup-rules.md` L108-113 明列"star 自然增长 / README 文案微调"不算重大更新，重大更新应为"大版本 / 核心能力变化"。
- **问题（判断）**：把 24 小时内的 patch release 当"重大更新"再次做**完整深度卡片**收录，违背去重规则精神。用户连续两天在头部看到同一个已知官方项目，"新增决策价值"被稀释，也让"已报道默认不重复"（PRD L22）名存实亡。
- **严重度：P1**
- **依据**：SOP 自身去重规则（L108-113）+ 决策效用（重复已知项目 = 近零增量）。
- **改进建议（选项式）**：
  - (a) "重大更新"限定为 **minor 及以上**或明确的能力/规范/harness 支持变化；patch 只写入 ledger `last_updates`，不再进 highlights。
  - (b) 对已在 ledger 的项目设 **N 天冷却期**，冷却期内即使有 patch 也不再进 highlights。
  - (c) 若确要提示 patch，把 `is_update` 项从"完整卡片"压缩为一行"更新追踪"，不占深度位。

### F5　"怎么用"缺少落地第一步（安装/接入命令），可执行性打折

- **现状（事实）**：站点核心态"怎么用"= `usage_paradigm`（`site/app.js` L1317，始终可见）。而真正的**安装/接入命令**（`npx skills@latest add mattpocock/skills`、Cursor `/add-plugin superpowers`）只出现在 `evidence_notes`（07-02 L10/L46），被折叠进**默认收起**的证据面板（`site/app.js` L1321、L1337 `evidencePanel` 用 `<details>`）。`report-template.md` L37 的"最佳使用范式"也未要求写落地第一步。
- **问题（判断）**：用户一旦决定采用，第一件事是"怎么装 / 怎么接入我的 harness"。但这条最关键的行动信息不在始终可见的"怎么用"里，而埋在需要额外点击的折叠证据中。决策 → 行动的转化门槛被抬高，PRD L21/L37 承诺的"在 AI 产品中如何用"落地断层。
- **严重度：P1**
- **依据**：用户决策效用（决策到行动的转化率取决于"下一步动作是否触手可及"）。
- **改进建议（选项式）**：
  - (a) 数据契约给 `usage_paradigm` 增加"安装/接入一行"，或新增 `getting_started` 字段，站点在"怎么用"置顶展示。
  - (b) SOP 要求 `usage_paradigm` 首句必须是**可复制的接入动作**（命令 / 入口路径）。
  - (c) 站点从 `evidence_notes` 抽取安装命令渲染到核心态（无需改契约）。

### F6　stage_tags 普遍"全阶段"，对选型的判别力接近失效

- **现状（事实）**：07-02 Superpowers `stage_tags` 5 项（requirements/design/implementation/review/testing，L27-33）；07-03 ECC 6 项**全覆盖**（L97-103）；Spec Kit 5 项（07-03 L27-33）。站点提供"前期/中期/后期"阶段筛选（`site/app.js` L37-41 `STAGE_GROUP_MAP`）。
- **问题（判断）**：当多数条目都横跨全部或近全部阶段，stage 筛选返回近乎全集，无法帮用户按"我当前处于哪个阶段"收敛选择。PRD L21 承诺的"适用于开发全周期哪个阶段"定位，因缺乏区分度而失去决策价值——一个"什么都适用"的标签等于没标。
- **严重度：P2**
- **依据**：用户决策效用（筛选维度必须能有效分区才有用）。
- **改进建议（选项式）**：
  - (a) 区分"主阶段（1–2 个）+ 次阶段"，站点主阶段加粗；或限制 `stage_tags` 最多 2–3 个主阶段。
  - (b) 站点对"全阶段"条目单独归类或弱化其筛选权重。
  - (c) SOP 增加 `stage_tags` 数量与判别力的软校验（如 ≥5 阶段触发警告）。

### F7　资产类型覆盖偏斜：paradigm 主导，rules/hooks/prompt-lib 在 highlights 中缺位

- **现状（事实）**：两期 10 条 highlights 类型分布——paradigm **6 条**（Superpowers、Claude Code×2、Spec Kit、ECC、OpenSpec）、subagent 2（wshobson、The Agency）、skill 1（Matt Pocock）、mcp 1（MCP Reference Servers）；**rules / hooks / prompt-lib 为 0**（仅作简讯出现：intellectronica/ruler、shanraisshan/claude-code-best-practice）。PRD L25 明确主题范围含 rules/hooks/prompt-lib。
- **问题（判断）**：站点 overview 按 type 分组、catalog 按 type 筛选（`site/app.js` L8-17、L773-776）。若承诺的类型长期空缺，按类型找资产的用户（如"我想找一套 hooks"）得不到任何覆盖，这些类目上的决策效用为零，且用户无法区分"今天该类无更新"与"系统根本不覆盖该类"。
- **严重度：P2**
- **依据**：PRD 功能边界 L25 + 决策效用（覆盖面与预期一致性）。
- **改进建议（选项式）**：
  - (a) SOP 检索模板为 rules/hooks/prompt-lib 增加**专项配额或轮转周期**（如每周至少覆盖各类一次）。
  - (b) 对空缺类目在站点/报告显式标注"本期该类目无合格条目"。
  - (c) catalog 增加"类目覆盖度"概览，暴露长期空缺。

### F8　缺跨期聚合视图：日更但无"周度/近 N 天最值得"收口

- **现状（事实）**：站点默认展示**最新单期**（`site/app.js` L530-539 `syncRoute`），`#/catalog` 是**全量**资产表（无"近 7 天最值得"）。结合 F3（单日新增价值低），用户想横向决策只能逐日点开。
- **问题（判断）**：真正要"决定采纳什么"的用户需要跨日横向比较与优先级排序，但站点只提供"单日切片"与"全量 catalog"两个极端，缺少"本周精选/趋势"这一最有决策价值的中间聚合层。
- **严重度：P2**
- **依据**：用户决策效用 + 外部对标（1440/TLDR 用"一期封面"聚合当日最重要，弱化逐条罗列）。
- **改进建议（选项式）**：
  - (a) 增加"近 7 天精选"聚合视图，只挑真·新增 / 真·重大更新。
  - (b) overview 增加"较昨日新增 X 条"的 delta 提示，帮助秒判"今天要不要看"。
  - (c) 弱化每日强度、强化周度收口（与 F3 的"频率/深度解耦"配合）。

---

## ③ 做得对的

1. **`gist` 双层分工是"一眼可读"的正确基建**：契约 v2.2/v2.3 为 highlights 与 briefs 分别新增 overview 专用 `gist`，并明确"不是正文截断、不含证据前缀/尾巴"（`data-contract.md` §2.2）；站点消费时有 `gist` 用 `gist`、缺失则语义降级（`site/app.js` L1186-1194、L486-488）。方向完全正确——**唯一遗憾是没延伸到微信推送（见 F2）**。
2. **证据分级 + 竞品对比 + 去重主键设计完整**：`credibility-dedup-rules.md` 用 owner/repo 小写主键判重、canonical URL 处理迁移、竞品对比要求 1-3 项且"证据不足可空但不得编造"（L115-122），是结构化、可执行的决策骨架。
3. **幂等保护让链路健壮**：`daily-runbook.md` L10-13 的"当天文件已存在则整次跳过"避免了同日重复运行静默覆盖，触达侧不会重复轰炸。
4. **来源缺口透明**：两期 `source_gaps` 如实记录 WebFetch/Search 失败与"本期无合格新仓"，不阻断流程（兑现 PRD L40/L71）——这也正是 F3 的关键证据来源，透明度值得肯定。
5. **站点渐进式披露方向正确**：核心态（项目介绍 / 为什么重要 / 怎么用）常显 + 证据态默认折叠（`site/app.js` L1311-1321），符合 overview-first / details-on-demand（见 `frontend-v2-dashboard-first-principles.md`）。
6. **永久入口 + 收藏引导缓解推送时效**：README L5-11 与 workflow `PERMANENT_HINT`（L17）明确"推送链接可能过期，请收藏固定站点地址"，降低了触达失效风险。

---

## ④ 高优先级改进候选（按性价比排序）

| 优先级 | 改进 | 对应发现 | 成本 | 决策效用收益 |
|---|---|---|---|---|
| 1 | 微信推送注入头条 `name`+`gist`+计数 | F2 | 极低（改 1 个 workflow / 加 1 个文案文件） | 高：直接修复"最后一公里"，让每次推送具备"是否点开"的判断力 |
| 2 | highlights"有货才发"+ 正式启用降级模板 | F3、F4 | 低（SOP 规则调整，无需改代码） | 高：从源头提升信噪比，恢复"不硬凑"承诺，杜绝 patch 霸榜 |
| 3 | 推荐理由去"唯 star 论" + 异常量级复核 gate | F1 | 中（依赖可信度维度先确证 star） | 高：修复决策依据的根本可信度 |
| 4 | "怎么用"置顶安装/接入第一步 | F5 | 低（契约小改 + SOP + 站点抽取） | 中高：打通决策 → 行动转化 |
| 5 | stage_tags 主/次阶段区分，恢复筛选判别力 | F6 | 低（SOP 约束 + 站点弱化） | 中：让阶段筛选真正能收敛选择 |
| 6 | rules/hooks/prompt-lib 类目配额 + 空缺显式标注 | F7 | 中（检索模板扩展） | 中：兑现全类目覆盖承诺 |
| 7 | "近 7 天精选"聚合视图 + delta 提示 | F8、F3 | 中（站点新增视图） | 中：为跨期决策提供最有价值的中间层 |

---

## ⑤ 参考来源

**内部工件（事实依据）**

- `docs/prds/star-skill-radar-v1.0-prd.md`（价值主张 L14、使用范式承诺 L21、报告规格 L37、边缘/降级 L40-41、准确性风险 L72）
- `docs/specs/data-contract.md`（v2.2/v2.3 §2.2 gist 规范）
- `docs/sop/daily-runbook.md`（幂等 L10-13、去重与重大更新 L71-92、校验 L152-166）
- `docs/sop/credibility-dedup-rules.md`（star 采集纪律 L41-54、重大更新边界 L97-113）
- `docs/sop/report-template.md`（"最佳使用范式"L37、"本期无重点条目"模板 L48-72）
- `.github/workflows/notify-wechat.yml`（推送内容 L23-34）
- `data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`、`data/ledger.json`、`data/issues/index.json`
- `reports/2026-07-02.md`、`reports/2026-07-03.md`
- `site/app.js`（核心态/证据态 L1311-1375、overview gist 消费 L1186-1194、stage 筛选 L37-41、catalog L711-835）

**外部对标（高置信度、常识性产品定位）**

- 1440 Daily Digest：策展式单封日报，强调事实密度与"一封读完"。
- TLDR：技术日报，主题行前置当期头条，逐条"一句话 + why"。
- The Rundown AI：AI 日报，头条 + "why it matters" 框架，稀缺高信号而非罗列。
- Axios *Smart Brevity*（先说结论、"why it matters"）—— 已被本项目自有调研 `docs/research/frontend-v2-dashboard-first-principles.md` 引用（B 级来源）。
- NN/g overview-first / information scent / microcontent —— 同上调研（A 级来源），用于支撑 F2/F8 的"标题即价值、先总览再详情"判断。

> 说明：外部对标仅取业界公认的产品**取舍取向**（策展稀缺、头条前置、主题行即价值），不宣称其实时指标；凡涉及具体数字的结论均以内部工件行号为准。
