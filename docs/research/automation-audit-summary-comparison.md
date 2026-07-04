# 自动化流水线审查：第一性原理总结质量 与 竞品对比规范

> 审查角色：只读审查 subagent（维度：总结质量 + 竞品对比）
> 审查日期：2026-07-04
> 硬约束：本次只读所有流水线工件，仅新增本报告文件，未修改任何流水线工件。
> 定位：本报告为参考材料（`docs/research/`），非约束；所有"改进建议"均为选项式，不替架构师拍板。

---

## ① 审查范围与方法

### 审查对象（工件 + 行号锚点）

| 工件 | 关注点 | 主要锚点 |
|---|---|---|
| `docs/sop/daily-runbook.md` | §6 生成 JSON 的 overview 文案规则、字段职责 | L103–L118、校验 L156 |
| `docs/sop/credibility-dedup-rules.md` | 竞品对比要求、community-verified 判定、关键事实采集 | L20–L38、L48、L115–L122 |
| `docs/specs/data-contract.md` | highlights/briefs 字段 schema 与 §2.2 文案规范 | L44–L54、L59–L89 |
| `data/issues/2026-07-02.json` | 真实产出逐条评估 | 全文 |
| `data/issues/2026-07-03.json` | 真实产出逐条评估 | 全文 |
| `docs/research/frontend-v2-dashboard-first-principles.md` | 既有编辑范式调研（Smart Brevity/NN-g） | L129–L146、L396–L419 |
| `docs/prds/star-skill-radar-v1.0-prd.md` | 价值主张与验收标准对齐 | L14、L37、L80–L81 |

### 方法

1. **字段职责映射**：把用户定义的"第一性原理五问"（它是什么 / 为什么重要 / 为什么高星合理 / 怎么用 / 适用哪个开发阶段）逐一映射到 schema 字段，找出无主字段、重叠字段与约束缺口。
2. **规则-产出对照**：把 SOP/契约的字段约束与两期真实 JSON 逐条比对，判断规则是否真的驱动"信息增量、去套话"，还是易退化为浅层复述。
3. **逐条质量评级**：对 07-02/07-03 每个 highlight 的 `summary/recommendation/usage_paradigm/competitors/gist` 与每条 brief 的 `one_liner/gist` 打样，给出具体好/差样例并引原文。
4. **轻量外部对标**：以既有调研 `frontend-v2-dashboard-first-principles.md` 已收录的 Smart Brevity（Axios，B 级）、NN/g Inverted Pyramid / Information Scent / Microcontent（A 级）作为高置信编辑范式基线，做轻量对标（未重复联网抓取，置信度以既有调研标注为准）。

### 事实/判断标注约定

- `现状` 一律引用 SOP 行号或数据原文（事实）。
- `问题`/`依据`/建议为审查判断，均标注推理链，不臆造数字，不对线上 GitHub 做实时核验（该职责属证据/可信度维度的审查方）。

---

## ② 关键发现

### 发现 1｜`recommendation`（推荐理由）系统性退化为"准入信号复述"，信息增量≈0

**现状（事实）**

契约 L48 定义 `recommendation` 为"推荐理由（解释高星合理性）"；runbook §6 对该字段**无任何内容质量约束**。真实产出中，社区条目的 recommendation 高度同质，几乎逐字复述 `evidence_notes` 里的 community-verified 准入清单：

- `2026-07-02` Matt Pocock（L61）：`stars 远超 1k 门槛，MIT license、release 与近期 commit 均可见；README 明确安装与 setup 流程，skills.sh 分发路径清晰，适合作为社区 skill 组合范式参照。`
- `2026-07-03` ECC（L95）：`stars 远超 1k 门槛，MIT license，作者背景可验证，release 与近 30 天 push 均活跃；README 给出明确跨 harness 安装路径…`
- `2026-07-03` OpenSpec（L131）：`stars 远超 1k，MIT license，release 与近期 push 可见；README 给出明确 slash 工作流与 npm 安装路径，适合作为社区 SDD 范式样本纳入 ledger。`
- `2026-07-03` The Agency（L165）：`stars 远超 1k，MIT license，README 给出桌面应用与 CLI 双路径安装；多 harness 支持明确…`

**问题（判断）**

这些 recommendation 复述的正是 `credibility-dedup-rules.md` L20–L38 的 community-verified **准入条件本身**（stars≥1k、license、活跃度、README 安装路径）。即：条目"因为满足清单"才进 highlights，而 recommendation 又"用清单来解释它为什么值得推荐"——这是**循环论证**，对已读过 `evidence_notes` 的用户零信息增量。同时"解释高星合理性"这一定义把字段目标框定成"给流行度找理由"，天然导向证据复述与主观吹捧（如 07-02 Superpowers L25 `社区热度极高`、servers L130 `star 规模巨大`，用"流行"论证"该推荐"）。

**严重度：P1**

**依据**

- PRD 把"推荐理由（解释高星项目的合理性）"列为核心价值主张（L14）与验收标准（L80–L81：`竞品对比：重点条目含同类项目对比与推荐理由`）。核心卖点在真实产出中被降格为清单复述，属核心功能欠交付。
- 对标 Smart Brevity"短而不浅"（既有调研 L129–L146）与 NN/g Inverted Pyramid（先给最值钱结论）：recommendation 当前提供的是"准入门槛已过"，而非"你该不该选/它比同类强在哪"的决策结论。

**改进建议（选项式，供架构师取舍）**

- 选项 A（改定义）：把 `recommendation` 从"解释高星合理性"重定义为"**决策理由**：这条相较同类的独特价值 + 谁在什么场景应选它"，并显式禁止复述 `evidence_notes` 已有的 star/license/活跃度信号。
- 选项 B（加约束）：在 runbook §6 增加一条"信息增量红线"——recommendation 不得只由准入信号构成，须至少含一条 `evidence_notes` 之外的判断（独特能力 / 生态位 / 相对同类的取舍）。
- 选项 C（并字段）：若认为"高星合理性"应保留，可将其压缩进 `evidence_notes` 一句话，`recommendation` 专职"决策价值"，避免两处都讲流行度。

---

### 发现 2｜规则投入严重失衡：`gist` 被精雕细琢，`summary/recommendation/usage_paradigm` 几乎无约束

**现状（事实）**

- `gist`/`one_liner` 有密集规则：runbook L105–L112 + 契约 §2.2 L63–L80（长度 18–42 字、单句、取一角度、无采集/证据前缀、无机械截断、不得引入新事实），并有 §10 L156 的**上线校验**。
- 反观承载"第一性原理"主体的三个字段：契约 L45–L48 仅给一行标签（`项目介绍` / `推荐理由（解释高星合理性）` / `最佳使用范式说明`）；runbook §6 通篇未给 `summary/recommendation/usage_paradigm` 任何内容规则；§10 校验（L156）**只校验 gist/one_liner**，对这三个字段既不校验存在性也不校验质量。

**问题（判断）**

约束密度与字段价值**倒挂**：最"表层"的一句话概览（gist）规则最全、有校验；最需要深度的分析字段反而放任自流。这就是"去套话/信息增量"约束不足的根因——规则根本没对深度字段提出要求，退化几乎是必然（发现 1、4、5 均是其派生表现）。此外 schema 未标注 `recommendation/usage_paradigm/competitors` 的必填/可选，requiredness 模糊。

**严重度：P1**

**依据**

- runbook §6（L103–L112）与 §10（L156）文本中，"summary/recommendation/usage_paradigm"仅在"summary 不因 gist 而缩短"（L108）这一处被间接提及，无正向内容规则。
- NN/g Microcontent / Information Scent（既有调研 L110–L126）：微内容需可独立成立、含信息气味；但这套要求当前只加在 gist 上，未传导到深度字段。

**改进建议**

- 选项 A：为三个深度字段各补一条"最小信息骨架"规则（如 summary=它是什么+关键差异点；usage_paradigm=触发时机+具体动作，不复述阶段名；recommendation 见发现 1）。
- 选项 B：在 §10 增加**轻量存在性/去套话校验**（如 recommendation 不得与本条 evidence_notes 高度重合；usage_paradigm 不得以 stage_tags 逐字清单开头——见发现 4）。
- 选项 C：明确 schema 里各字段的必填/可选与"证据不足可空"边界，避免为凑字段而套话。

---

### 发现 3｜"为什么重要"在字段体系中无主，而"为什么高星合理"却独占字段

**现状（事实）**

用户的第一性原理五问对字段的映射：

| 第一性原理问 | 承载字段 | 状态 |
|---|---|---|
| 它是什么 | `summary`（契约 L45"项目介绍"） | 有主 |
| 为什么重要（对用户的价值） | —— | **无专属字段** |
| 为什么高星合理 | `recommendation`（契约 L48） | 有主（但框定为流行度，见发现 1） |
| 怎么用 | `usage_paradigm`（契约 L48） | 有主 |
| 适用哪个开发阶段 | `stage_tags` + `usage_paradigm` | 有主（但重复，见发现 4） |

**问题（判断）**

从用户决策价值看，"为什么重要"（这资产解决什么痛点、值不值得我投入）比"为什么高星合理"（它为什么流行）更关键，但前者**无专属字段**、只能散落在 summary 结尾或 recommendation 中，后者反而独占一个字段。这是职责分配与决策价值的错位。真实产出里"为什么重要"因此常缺位或被"适合作为…样本/参照"这类空泛定位替代（见发现 5）。

**严重度：P2**

**依据**

- 契约 L45–L48 字段清单中确无"价值/为什么重要"槽位；`recommendation` 的括号注释锁定为"解释高星合理性"。
- 该错位部分源于 PRD L14 的原始表述，属可由架构师权衡的设计取舍，非实现 bug，故列 P2。

**改进建议**

- 选项 A：把 summary 的职责显式扩为"它是什么 + 为什么重要（解决什么痛点）"，并在规则中点名要求后半句。
- 选项 B：新增可选字段 `why_it_matters`（向前兼容，站点可忽略），把价值论证与流行度论证解耦。
- 选项 C：维持现状但在 recommendation 定义里补入"须落到用户价值而非流行度"（与发现 1 选项 A 合并即可）。

---

### 发现 4｜`usage_paradigm` 逐字复述 `stage_tags`，前半句为纯冗余

**现状（事实）**

几乎每条 usage_paradigm 都以"用于 <阶段清单>："开头，且清单与同条 `stage_tags` 数组逐字一致：

- `2026-07-03` OpenSpec：usage_paradigm（L132）`用于 requirements、design、implementation：…`，而 stage_tags（L133–L137）= `["requirements","design","implementation"]`。
- `2026-07-02` Superpowers：usage_paradigm（L26）`用于 requirements、design、implementation、review、testing 全周期：…` 对应 stage_tags（L27–L33）同集合。
- 同样模式见 07-02 Matt Pocock（L62）、Claude Code（L97）、servers（L131）、wshobson（L165）；07-03 各条同。

**问题（判断）**

`stage_tags` 已是机器可读字段、站点会渲染阶段 chip；usage_paradigm 再用中文把同一集合复述一遍，属纯冗余，挤占了本应用于"触发时机 + 具体动作"的篇幅。冒号后的实操内容（如 07-02 Matt Pocock `/grill-me → /tdd → /code-review` 回路）才是价值所在。

**严重度：P2**

**依据**

- 数据原文逐条一致（上引行号）。
- 与既有调研反模式清单（L639）"让 overview copy 承担多重任务"同源——此处是深度字段承担了 stage_tags 已表达的信息。

**改进建议**

- 选项 A：规则要求 usage_paradigm **不得以 stage 清单开头**，直接写"何时触发 + 做什么动作"，阶段归属交给 stage_tags。
- 选项 B：保留一个极简阶段引导词（如"全周期"/"实现-评审"），但禁止逐字罗列全部枚举。

---

### 发现 5｜竞品 `verdict` 多为"A 偏 X；B 偏 Y"对称定位复述，缺决策标准与统一对比轴

**现状（事实）**

`credibility-dedup-rules.md` L115–L122 的竞品对比要求为：尽量 1–3 个、同类官方优先、社区须说明相对官方差异、不得编造、证据不足可空。契约 L46 的 `verdict` 定义为"对比结论一句话"。真实 verdict 绝大多数是对称的"各有侧重"句式：

- `2026-07-02` Superpowers vs spec-kit（L17）：`Spec Kit 更偏官方 spec-driven CLI 与集成生态；Superpowers 更强调可组合技能与跨 harness 插件分发。`
- `2026-07-03` ECC vs wshobson（L87）：`wshobson 以 plugin marketplace 形态分发…；ECC 更强调 instincts/memory/security 等运行时优化层。`

**问题（判断）**

规则要求"说明差异"，但**未要求统一对比轴，也未要求给出决策标准**（"什么场景选谁"）。于是 verdict 停在"各自强调什么"的对称复述，用户读完仍不知该选哪个。对照决策级写法应是"需要官方背书/CI 集成选 Spec Kit；需要跨 harness 技能复用选 Superpowers"。这直接对应用户 Q2 关切："对比是否公允、有决策价值"——当前**公允（不编造、平衡）达标，但决策价值不足**。

**严重度：P2**

**依据**

- verdict 定义（契约 L46）只要"结论一句话"，未约束"决策导向"；规则（L115–L122）只提"差异"不提"取舍/对比维度"。
- 反例佐证正面能力存在：07-02 servers vs registry / awesome-mcp-servers（L118–L128）给出了落地决策——`官方 README 明确生产选型应回到 Registry`，证明只要规则要求，产出可达决策级。

**改进建议**

- 选项 A：verdict 规则升级为"须含**选择条件**"（`需要 A 时选 X；需要 B 时选 Y`），并鼓励围绕一条统一轴（官方背书 / 覆盖面 / 粒度 / 安装 UX / 维护活跃度）比较。
- 选项 B：为 `competitors[]` 增可选 `axis` 字段（对比维度标签），倒逼作者选定同一比较维度；向前兼容。

---

### 发现 6｜`recommendation` 不审视异常流行度：ECC（社区）星数高于其所封装的官方 harness，却仍以"stars 远超门槛"背书

**现状（事实）**

`2026-07-03` ECC（社区 meta-harness，L80）`evidence_notes` 记 `225,218 stars`；同期官方 Claude Code（L46）`135,528 stars`、GitHub Spec Kit（L10）`117,474 stars`。ECC 的 recommendation（L95）对此异常**只字未提**，仍以 `stars 远超 1k 门槛…` 作为背书。

**问题（判断）**

一个封装/整合多 harness 的社区项目，星数≈官方 Claude Code 的 1.7 倍，是"为什么高星合理"最该被解释/质疑的地方。当前 recommendation 的"解释高星合理性"框架只会顺势背书，不会做合理性拷问——这正是发现 1 循环论证的一个具体恶果。

**严重度：P2**（星数真实性核验属证据/可信度维度审查方职责；本发现只就"总结字段未做合理性拷问"这一总结质量问题定性，星数本身不做事实判定）

**依据**

- 数据原文星数对比（上引行号）为事实；"recommendation 应拷问异常流行度"为判断，依据 PRD L14"解释高星合理性"的字段目标与 Smart Brevity"短而不浅"。

**改进建议**

- 选项 A：规则要求当条目流行度显著异常（如社区项目星数≥同期官方对照项）时，recommendation/evidence_notes 须显式给出合理性说明或标注存疑。
- 选项 B：与证据维度审查方联动，把"流行度合理性拷问"下沉到 evidence_notes，recommendation 只讲决策价值（与发现 1 选项 C 一致）。

---

### 发现 7｜brief 的 `gist`/`one_liner` 偶发"采集方法论泄漏"与套话尾巴

**现状（事实）**

- `2026-07-02` fastmcp（L194）gist：`Python MCP服务器框架，适合作为topic检索前列样本`；ruler（L218）gist：`多agent规则同步工具，适合rules主题后续深挖`；shanraisshan（L200）gist：`…适合rules方向观察`。
- 其中"适合作为 topic 检索前列样本""后续深挖""方向观察"描述的是**它为什么被采集到**（检索排名/流程动作），而非"它是什么/为什么值得看"。

**问题（判断）**

契约 §2.2（L70–L75）要求 brief gist 说清"它是什么 / 为什么值得看"其一、关键区分词前置；但上述 gist 把**采集流程视角**塞进了用户面文案，属信息气味错位的套话。（正面对照：同一 fastmcp 在 07-03 已修正为 `Python MCP服务器与客户端框架，连接官方SDK语境`（L183），说明问题可控。）

**严重度：P2**

**依据**

- 数据原文（上引行号）+ 契约 §2.2 L70–L75 的 gist 内容纪律。
- 既有调研反模式（L634、L639）：机械/流程化文案破坏 glanceability。

**改进建议**

- 选项 A：在 gist 禁止清单中显式加入"采集/流程用语"（如"检索前列""后续深挖""方向观察""样本"）与"值得看"以外的元叙述。
- 选项 B：把 07-03 briefs 的清爽写法固化为示例，纳入 SOP 作正面模板。

---

### 发现 8｜个别 `gist` 近似 `summary` 首句截断，违反"gist 非 summary 截断版"精神

**现状（事实）**

`2026-07-02` Matt Pocock：gist（L47）`面向真实工程场景的小型可组合技能单元库`；summary（L48）开头 `面向真实工程场景的可组合 Agent Skills 库…`——二者措辞几乎相同。

**问题（判断）**

runbook L105 与契约 L64 明确"gist 不是 summary 的截断版、二者分工"。此条 gist 实质是 summary 首句的同义改写，未提供"取一角度、关键区分词前置"的独立提炼价值。属个案，非系统性（其余多数 gist 提炼良好，见做得对的 ③）。

**严重度：P2**

**依据**：数据原文（L47 vs L48）+ 规则 L105/L64。

**改进建议**

- 选项 A：§10 校验可加一条轻量启发式——gist 与 summary 首句字符重合度过高时给警告。
- 选项 B：在规则里补一个"反例：gist≈summary 首句"的对照示例，降低人工退化概率。

---

## ③ 做得对的（应保留 / 沉淀为正面模板）

1. **`gist` 的第一性原理规则本身设计良好**：18–42 字、单句、取一角度、关键区分词前置、无采集/证据前缀、不得引入新事实、有 §10 校验（runbook L105–L112、契约 §2.2）。这套规则与 Smart Brevity / NN-g Microcontent 高度契合。真实 gist 多数达标，正面样例：
   - 07-02 Superpowers（L11）`跨工具链技能方法论，串起规格、计划与子代理执行`；
   - 07-02 servers（L116）`官方 MCP 参考实现，示范 server 写法与 Registry 分工`；
   - 07-03 spec-kit（L11）`GitHub 官方 SDD 工具包，补齐 Python 与 bug-fix agent 能力`（"今天变了什么"角度到位）。
2. **竞品对比的防伪护栏扎实**：同类官方优先、社区须说明相对官方差异、不得编造、证据不足可空（L115–L122）；两期 verdict 均未见编造，立场平衡。
3. **存在决策级对比的成功范例**，证明产出上限够高：07-02 servers vs Registry / awesome-mcp-servers（L118–L128）给出了"生产选型回到 Registry"的落地结论；summary（L117）`本仓库教你怎么写 server，Registry 负责发现` 是真正的信息增量。
4. **部分 summary 有独特洞察而非复述**：07-02 wshobson（L151）`安装单个 plugin 只加载其组件，避免整库灌入上下文`（上下文预算视角）。
5. **部分 usage_paradigm 冒号后实操到位**：07-02 Matt Pocock（L62）`/grill-me → /tdd → /code-review` 回路；07-03 The Agency（L166）review 阶段切 `Reality Checker` 质检角色。
6. **可见的自我纠偏迭代**：07-03 briefs 相比 07-02 明显更清爽（fastmcp gist 去掉了"检索前列样本"流程语，L183），说明写作规范在演进。
7. **证据纪律强**：关键事实须实时查询、禁用模型记忆、竞品定量事实同样需实时核验（credibility L40–L54），为总结质量提供了事实底座。

---

## ④ 高优先级改进候选（按性价比排序）

> 排序依据：对"决策价值/去套话"的提升幅度 ÷ 改动成本。均为规则文案级改动，不涉及站点或 schema 破坏性变更。

1. **【P1｜最高性价比】给 `recommendation` 立"信息增量红线" + 重定义为决策理由**（对应发现 1、3、6）
   一条规则同时解决三处退化：禁止只复述 evidence_notes 准入信号、要求落到"独特价值 + 谁在什么场景该选"、异常流行度须拷问。改动仅 runbook §6 + 契约 L48 注释。

2. **【P1】补齐深度字段的最小内容骨架规则 + 轻量上线校验**（对应发现 2）
   为 summary/recommendation/usage_paradigm 各写一条"最小信息骨架"，并在 §10 加"去套话/去重合"轻校验。成本中、覆盖面最广（治本）。

3. **【P2】`usage_paradigm` 禁止逐字复述 stage 清单**（对应发现 4）
   一句规则 + 一个反例即可，立刻回收被冗余占用的篇幅。改动极小、效果直观。

4. **【P2】竞品 `verdict` 升级为"含选择条件 + 统一对比轴"**（对应发现 5）
   把"各有侧重"提升到"何时选谁"。可选加 `competitors[].axis`（向前兼容）。中等收益、低成本。

5. **【P2】gist/one_liner 禁止清单扩充"采集/流程用语"**（对应发现 7、8）
   把已零星出现的方法论泄漏与"gist≈summary 首句"用禁止清单 + §10 轻校验兜住。低成本、防退化。

---

## ⑤ 参考来源

**流水线内部工件（一手事实来源）**

- `docs/sop/daily-runbook.md`（§6 L103–L118、§10 L156）
- `docs/sop/credibility-dedup-rules.md`（L20–L38、L48、L115–L122）
- `docs/specs/data-contract.md`（L44–L54、§2.2 L59–L89）
- `data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`（逐条原文）
- `docs/prds/star-skill-radar-v1.0-prd.md`（L14、L37、L80–L81）

**编辑范式外部对标（经既有调研引用，置信度沿用其标注；本次未重复联网抓取）**

- 既有调研：`docs/research/frontend-v2-dashboard-first-principles.md`（§Smart Brevity/inverted pyramid L129–L146、Microcontent/Information Scent L110–L126、反模式清单 L626–L639）
- Axios, *Smart Brevity: Short, not shallow*（B 级，via 既有调研 L143）
- NN/g, *Inverted Pyramid: Writing for Comprehension*（A 级，via 既有调研 L140）
- NN/g, *Information Scent* / *Microcontent*（A 级，via 既有调研 L121、L123）

> 说明：本报告聚焦"总结质量 + 竞品对比"维度。GitHub 星数/日期/作者等**事实真实性核验**属证据/可信度维度审查方职责，本报告仅在其与总结字段的"合理性拷问缺失"相关处（发现 6）做定性引用，不对线上事实下真伪结论。
