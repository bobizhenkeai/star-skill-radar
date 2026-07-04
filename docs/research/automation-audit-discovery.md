# 自动化流水线审查报告 · 发现与抓取合理性（Discovery & Crawl Soundness）

- 审查维度：发现与抓取合理性（本报告为只读审查产出，未修改任何流水线工件）
- 审查对象：`docs/sop/daily-runbook.md` §1–§3、`docs/sop/README.md`、`docs/sop/credibility-dedup-rules.md`（发现相关规则）
- 印证样本：`data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`、`data/ledger.json`、`data/issues/index.json`
- 参考基准：`docs/research/sources-and-landscape.md`（既有调研）+ 轻量外部对标
- 审查日期：2026-07-04（UTC+8）

---

## ① 审查范围与方法

**范围**：聚焦"发现层 + 抓取层"是否能可靠、无系统性偏差地捕捉 PRD 承诺的 7 大资产类型（skill / mcp / rules / hooks / subagent / prompt-lib / paradigm）与工作范式情报。具体覆盖：来源清单完整度、GitHub 检索模板质量、采样偏差、抓取工程健壮性、发现层与去重的交互。

**方法**：
1. 通读 SOP §1–§3 与可信度/去重规则，逐条建立"规则 → 预期命中类型"映射。
2. 对两期真实产出做命中分布统计，用实际数据反推模板的有效覆盖面。
3. 将 runbook 现行做法与其**自身调研** `sources-and-landscape.md` 的推荐做法对照，识别回退项。
4. 对"GitHub 搜索 `created:` 日期语义、Search API 限流、MCP registry 增量同步、star 作为信号的偏差"做高置信度外部对标。
5. 事实（行号 / 数据）与判断分开陈述；不臆造；数值真伪核实归属"事实准确性"维度，本报告只在其影响抓取健壮性时提示。

**两期命中分布（事实基线）**：

| 类型 | 07-02 highlights | 07-03 highlights | highlights 合计 | 两期 briefs 合计 |
|---|---|---|---|---|
| paradigm | 1（superpowers） | 4（spec-kit·claude-code·ECC·OpenSpec） | 6 | 1（OpenSpec） |
| skill | 1（mattpocock） | 0 | 1 | 2（awesome-agent-skills·awesome-claude-code） |
| mcp | 1（mcp servers） | 0 | 1 | 5（awesome-mcp×2·fastmcp×2·awslabs/mcp） |
| subagent | 1（wshobson） | 1（agency-agents） | 2 | 0 |
| rules | 0 | 0 | **0** | 2（claude-code-best-practice·ruler） |
| hooks | 0 | 0 | **0** | **0** |
| prompt-lib | 0 | 0 | **0** | **0** |

> 10 条 highlights 里 paradigm 占 6，mcp/skill/rules/hooks/prompt-lib 五类合计仅 2；hooks、prompt-lib 在两期 highlights + briefs 中**零命中**。这是后续多条发现的共同证据。

---

## ② 关键发现

### 发现 1 · 7 类资产覆盖失衡：hooks / prompt-lib 零命中，subagent 无专用检索模板 —— P1

- **现状**：`daily-runbook.md` §3 固定模板共 9 条（行 41–49）。逐条映射预期类型：`"agent skills"…`（行 41）+ `topic:agent-skills`（行 48）→ skill；`"awesome mcp servers"…`（行 43）+ `pushed:…topic:mcp`（行 47）+ `topic:mcp-servers`（行 49）→ mcp（3 条）；`"cursor rules"…`（行 45）→ rules；`"spec-driven development"…`（行 44）→ paradigm；`"awesome claude code"…`（行 42）+ `created:…`（行 46）→ 通用。**subagent / hooks / prompt-lib 无任何专用模板**。而 `README.md` §固定来源面（行 45）明文声称覆盖"skills、MCP servers、rules、hooks、subagents、prompt-lib、agent 工作范式"。命中数据见 §① 表：hooks、prompt-lib 两期全零；subagent 的两条 highlight（wshobson、agency-agents）只能靠 `"awesome claude code"`/topic 溢出或初始调研种子偶发命中。
- **问题**：契约与 README 承诺 7 类，发现层却在结构上只对 4 类（skill/mcp/rules/paradigm）有专门入口。hooks（常内嵌于 skill/method 仓库、少有独立高星仓与 topic）、prompt-lib（`f/prompts.chat` 等虽存在但无模板触达）从设计上就抓不到；subagent 无可持续模板，随初始种子入 ledger 后将无新供给。
- **依据**：`sources-and-landscape.md` §3（行 256–259：rules/hooks/subagents 标准化程度低于 mcp/skills、hooks 常散落在仓库内部、subagent 尚无统一 registry）明确指出这三类无法仅靠 repo-search 稳定命中；同文 §4.4（行 331–357）专门给出 hooks/subagents 的 **code-search** 配方（`hooks.json`、`filename:SKILL.md`、`path:.claude/rules` 等），但 runbook §3 完全未采用任何 code-search。
- **改进建议（选项，供架构师取舍）**：
  - A. 增补 3 类专用 repo-search 模板：如 `"claude code subagents" in:name,description,readme`、`topic:subagents`；`"agent hooks" / "claude code hooks"`；`"prompt library" / topic:prompts`。
  - B. 引入 `sources-and-landscape.md` §4.4 的低频 code-search（`hooks.json`、`path:.claude/hooks`、`filename:SKILL.md`）作为 hooks/subagents 兜底发现面。
  - C. 为缺覆盖类型固定 awesome 清单种子（`VoltAgent/awesome-claude-code-subagents`、`f/prompts.chat`），从清单反查条目。
  - D. 若某类确实供给稀薄，明确在 SOP 写下"该类以官方源为主、社区侧允许周期性空缺"，让契约承诺与实现对齐，而非留隐性缺口。

### 发现 2 · `created:>=${run_date}` 同日窗口几乎恒定零命中，"新仓发现"机制失效 —— P1

- **现状**：`daily-runbook.md` §3 行 46 `created:>=${run_date} stars:>50 archived:false`；行 47 `pushed:>=${run_date} stars:>100 topic:mcp`。两期 `source_gaps` 直接实证其空转：`2026-07-02.json` 行 225「`created:>=2026-07-02` 的 GitHub Search 仅返回 3 个 stars>50 仓库且均与 AI agent 资产无关」；`2026-07-03.json` 行 214「`created:>=2026-07-03` 返回 0 个 stars>50 且 archived=false 仓库」。对照 `sources-and-landscape.md` §4.2（行 298）原始建议是 **7 天窗口** `created:>=2026-06-25`。
- **问题**：运行在北京时间 10:00，`created:>=${run_date}` 只能捕捉"今日 00:00 之后创建、且不到 10 小时内就已积累 >50 star"的仓库——这在现实中近乎不可能，故恒定零命中。更关键的是它**完全漏掉昨天新增**（这正是审查任务点名的"当天边界会否漏掉昨天新增"）：昨天创建的新仓永远落在今天窗口之外。`pushed:>=${run_date}` 同理存在盲区——昨天 10:00（上次运行后）到昨天 24:00 之间的 push，昨日运行看不到、今日窗口又从今天 00:00 起算，形成约 14 小时的"更新丢失带"。
- **依据**：GitHub 搜索 `created:`/`pushed:` 为按日期窗口限定（GitHub 搜索语法官方文档）；"同日窗口 + 高 star 阈值"两个约束互斥；runbook 将调研推荐的 7 天窗口收窄为同日，是相对**自身调研的回退**，且两期数据已证实其无产出。
- **改进建议（选项）**：
  - A. 改滚动窗口：`created:>=${run_date-2}`（至少覆盖昨天，消除边界盲区）或 `-7`；`pushed:>=${run_date-1}` 补齐更新丢失带。
  - B. 新仓窗口降低或取消 star 阈值，改为"先按窗口发现、再用活跃度/作者背景后置判定"，避免高门槛把新仓全过滤。
  - C. 采用 `sources-and-landscape.md` §4.6 路径二（行 379–383）的 `delta_stars` 快照法，对固定候选做 star 增量，弥补 `created:` 对"老仓二次爆发"不敏感的固有缺陷。

### 发现 3 · `stars>=1000` 硬门槛叠加失效的新仓发现，系统性漏掉"新兴高价值低星"资产 —— P1

- **现状**：`credibility-dedup-rules.md` §community-verified（行 20–38）规定社区项目进 highlights 必须 `stars>=1000`，且行 38 明确"未达到 `stars>=1000` 的社区项目不得进入 highlights；即使很新，也只能作为 briefs，并写明'观察中'"。样本 10 条 highlights 中最低星为 `wshobson/agents` 37,419（`2026-07-02.json` 行 149），其余多在 5.8 万–24.3 万区间，无一条接近 1000。
- **问题**：对"每日捕捉**新兴**高价值资产"的产品定位（PRD 价值主张，行 14），1000 星是很高的门槛，会系统性偏向已成名巨仓、抑制新范式/新工具的时效性。叠加发现 2（新仓发现失效）+ ledger 已收纳头部大仓 → 流水线每日只能反复命中同一批巨仓，命中后入 ledger 被跳过，导致"越收越窄"（详见发现 4）。
- **依据**：`sources-and-landscape.md` §0（行 18）与 §7（行 594–600）明确 star 受传播效应/名人效应/清单仓库效应影响、不等于底层质量；同文 §4.6 路径二推荐用 star **速度**（delta）而非绝对值发现爆发项目；PRD 定位与"绝对星硬门槛"存在张力。
- **改进建议（选项）**：
  - A. 为社区新兴项目开"低绝对星 + 强附加信号（高 star 速度 / 官方收录 / 作者背景可验证）"的替代准入通道，权重可低于常规 highlights 或标注"新兴观察"。
  - B. 保留 1000 硬门槛，但在 briefs 内单列"新兴观察"分区并在站点给予更高可见度，避免高价值低星资产被埋没。
  - C. 引入 delta-star 阈值作为绝对星的补充判据（如"7 日 star 增量 > N"）。

### 发现 4 · 发现层与 ledger 去重叠加的"新鲜度衰减"；briefs 无去重导致每日复读 —— P1

- **现状**：`daily-runbook.md` §5（行 71–91）与 `credibility-dedup-rules.md` §重大更新（行 97–113）的去重设计本身稳健（见 §③）。但 briefs "不强制写入 ledger"（`daily-runbook.md` 行 144），因此**不参与去重**。实证：`punkpeye/awesome-mcp-servers`（07-02 行 181 / 07-03 行 194）与 `PrefectHQ/fastmcp`（07-02 行 193 / 07-03 行 182）在两期 briefs 中**重复出现**。同时 07-03 highlights 5 条里有 2 条（spec-kit、claude-code）是既有 ledger 项的 `is_update`。
- **问题**：两侧同时衰减——(1) highlights 侧：随 ledger 饱和（当前 13 项已含大部分头部大仓），新 highlight 越来越依赖"官方仓当天恰好有 release"，新鲜度趋降；(2) briefs 侧：无去重/轮换，同一批稳定的发现清单仓每日复读，日报边际信息量低、噪声高，违背"日报应呈现增量"的第一性原理。
- **依据**：两期 briefs 交集实证（上述行号）；`data/ledger.json` 现有 13 项已覆盖 research §2 盘点的多数头部仓；daily 节奏下重复简讯与"每日增量"目标相悖。
- **改进建议（选项）**：
  - A. 对 briefs 也做轻量去重/冷却：N 天内已出现的 brief 不再重复，除非有新证据。
  - B. 简讯分区为"本期新发现" vs "持续观察"，把稳定清单仓归入后者并降低出现频率。
  - C. 将 `awesome-*` 等长期稳定的发现清单仓从每日 briefs 降为站点静态 catalog，不再占日报增量位。

### 发现 5 · 官方源清单不完整：缺主流官方 harness 与包/市场/registry 增量发现面 —— P2

- **现状**：`daily-runbook.md` §2（行 20–26）与 `README.md` §固定来源面（行 43）的官方巡检源只有 OpenAI / Anthropic / Cursor / MCP / Agent Skills 五家。`sources-and-landscape.md` §2.1 已盘点 `google-gemini/gemini-cli`（105k，行 155）、`anomalyco/opencode`（181k，行 158）等主流 harness；样本中 Gemini 被反复列为受支持 harness（wshobson/ECC/agency 均含 Gemini）。此外流程未覆盖：npm/PyPI 包源、VS Code / Cursor 扩展市场 leaderboard、MCP registry 的 `updated_since` 增量。
- **问题**：Google 作为三大官方模型/harness 之一未进官方巡检面；而 skill/MCP/plugin 的一线**分发面**正快速向 npm/PyPI（如 `@fission-ai/openspec`、`ecc-universal`、`skills.sh`）和市场 leaderboard 迁移——当前只有"有高星 GitHub 仓库"的资产能被发现，纯包 / 纯市场资产不可见。MCP 新 server 的权威发现入口（registry 增量）也未被操作化。
- **依据**：`sources-and-landscape.md` §1/§2 来源地图；同文 §4.6 路径五（行 392–395）明确 MCP registry API 支持 `updated_since` 增量同步、适合 MCP server 发现；`2026-07-02.json` 行 207 的 brief 自述"Cursor Customize 页面…展示 marketplace leaderboard"——该 leaderboard 是一线发现面却未纳入巡检。
- **改进建议（选项）**：
  - A. 官方源补 Google（Gemini CLI docs/changelog + `org:google-gemini`），并视需要纳入主流开放 harness（OpenCode 等）。
  - B. 增设 MCP registry `updated_since` 增量拉取，作为 MCP 新 server 的权威、低噪声发现入口。
  - C. 视预算加 npm/PyPI 关键包与 Cursor/VS Code 市场 leaderboard 的低频巡检。

### 发现 6 · `source_gaps` 记录但不闭环：持续性失败无跨期跟踪与升级 —— P2

- **现状**：降级与记录机制见 `daily-runbook.md` 行 59 与 `README.md` §失败与降级。两期 `source_gaps` 均记录 `modelcontextprotocol.io/blog` 抓取失败——07-02（行 224）为超时、07-03（行 213）为 Mintlify SPA/错误页，**同一关键源连续 2 日失效**。
- **问题**：`source_gaps` 仅作单期一次性备注，缺"同一关键源连续 N 期失败即升级/换策略/告警"的闭环；MCP 官方博客连续失效，但每期仍以同一方式重复尝试，属静默重试而非策略切换。对单用户自用系统，持续性缺口若无提示，容易长期无人察觉。
- **依据**：两期 `source_gaps` 同源重复（上述行号）；可靠性工程角度，重复失败应触发既定降级链切换与显式提示。
- **改进建议（选项）**：
  - A. 为关键源建立跨期失败计数，连续失败即切到既定备用路径（如 blog → GitHub org commits/releases）。
  - B. 在日报显著位置提示"X 源已连续失效 N 天"，把隐性缺口显性化。
  - C. 为每类官方源固化一级/二级/三级降级链，避免每期临时决定替代来源。

### 发现 7 · 抓取层缺 star 量级/合理性守卫，观测星数量级异常（跨维度提示）—— P2

- **现状**：样本 star 量级异常之高——`obra/superpowers` 243,701（07-02 行 10）、`affaan-m/ECC` 225,218（07-03 行 80）、`mattpocock/skills` 153,443（07-02 行 46）、`msitarzewski/agency-agents` 125,563（07-03 行 150）、`github/spec-kit` 117,474（07-03 行 10）。`credibility-dedup-rules.md` §允许降级（行 56–60）只约束"页面取整值不得伪造精确数"，**无任何数值范围/内部一致性校验**。
- **问题**：高置信外部对标下，即便 GitHub 全站头部仓库星数也在约 40 万量级，单一"AI 编码资产"细分内**同时出现多个 >10 万、数个 >20 万**极不寻常；抓取层缺 sanity guard，一旦发生字段错读（如误取拼接数字、读错仓库/字段）会静默入库并直接喂给 star 门槛与站点。本报告仅从**抓取健壮性**角度提示"缺量级守卫"这一可靠性缺口；数值真伪的确证归属"事实准确性"审查维度。
- **依据**：GitHub 头部仓库星数分布（高置信外部对标）；本维度关注抓取层是否有异常检测能力，当前答案为"无"。
- **改进建议（选项）**：
  - A. 抓取后加轻量 sanity check（star/fork 量级上限、`stars ≥ forks` 等内部一致性），异常写入 `source_gaps` 并强制二次核验。
  - B. 对超大值强制"API + 页面"双源交叉确认后再入库。

### 发现 8 · 模板 star 阈值不一致 + 部分模板无 star 过滤（噪声/可比性）—— P2

- **现状**：`daily-runbook.md` §3 多数模板用 `stars:>50`（行 41/44/45/46/48/49），`pushed:…topic:mcp` 却用 `stars:>100`（行 47）；`"awesome claude code"`（行 42）与 `"awesome mcp servers"`（行 43）**无 star 过滤**。
- **问题**：阈值不统一且无书面理由，可比性差；无过滤的 awesome 模板可能返回大量"泛 AI awesome"噪声（`sources-and-landscape.md` §4.2 行 288 自述"容易混入泛 AI awesome 项目"），增加去噪成本并挤占 8–12 次的 search 预算（`daily-runbook.md` 行 36）。
- **依据**：`sources-and-landscape.md` §4.2 局限说明；模板内部阈值不一致（上述行号）。
- **改进建议（选项）**：
  - A. 统一阈值或在 SOP 写明差异化理由。
  - B. 给 awesome 模板加 `stars:>N` 或收窄为 `in:name`，降噪。
  - C. 在每条模板旁标注"预期命中类型"，便于日常做覆盖率自检（也直接支撑发现 1 的整改验证）。

---

## ③ 做得对的（值得保留）

1. **幂等保护**（`daily-runbook.md` §1.4 行 10–13）：当天文件已存在即整次跳过，防止同日重复触发覆盖，设计到位。
2. **实时事实纪律**（`README.md` §硬性原则 1–2、`credibility-dedup-rules.md` §关键事实采集行 40–54）：禁止模型记忆补 star/日期、禁止用旧调研数字当实时事实，并要求附采集时间与链接——发现层可信度的根基。
3. **官方 vs 社区分级 + 明确附加信号**（`credibility-dedup-rules.md` 行 5–38）：证据等级清晰，社区准入需 2 个以上可验证附加信号，抑制"唯 star 论"。
4. **规范化主键去重 + 多源合并 + 去 tracking 参数**（`daily-runbook.md` §5 行 73–80、`credibility-dedup-rules.md` §去重 行 83–95）：主键规范、fork/镜像不单列、多源命中合并，去重口径严谨。
5. **重大更新需晚于 `first_reported`/最新 `last_updates` 的可验证新证据**（`daily-runbook.md` 行 82、`credibility-dedup-rules.md` 行 101）：有效防止同一 release/commit 在日报节奏下连续 re-spam，07-03 spec-kit/claude-code 的 `is_update=true` 均附带了新版本证据，规则被正确执行。
6. **`source_gaps` 透明记录**（`daily-runbook.md` §6 行 101）：缺口显式落盘而非隐藏，两期均被真实填充——是可审计性的良好实践（闭环短板见发现 6）。
7. **API→HTML 降级路径明确**（`daily-runbook.md` 行 59、`credibility-dedup-rules.md` 行 56–60）：抓取失败有兜底，不阻断整体流程。
8. **固定模板而非无边界宽搜 + 8–12 次预算**（`daily-runbook.md` §3 行 36）：尊重 Search API 限流（研究 §4.7：认证态 30 次/分），避免高频宽搜——方向正确（模板**内容**需按发现 1/2 调整，但"固定模板"策略本身应保留）。

---

## ④ 高优先级改进候选（按性价比排序）

| 序 | 改进 | 对应发现 | 成本 | 收益 | 说明 |
|---|---|---|---|---|---|
| 1 | 补 subagent/hooks/prompt-lib 专用模板 + 低频 code-search | 发现 1 | 低 | 高 | 直接补齐 3 类零命中。现有 9 模板，增 3 条至约 12，仍在 8–12 预算的上限、且远低于 30 次/分 API 限——**预算不是覆盖缺口的真正约束** |
| 2 | `created:`/`pushed:` 改滚动窗口（-2/-7 天） | 发现 2 | 极低 | 高 | 近乎一行改动，救活恒零命中的新仓发现、消除昨日新增/更新丢失盲区 |
| 3 | briefs 去重/冷却 + "新发现/持续观察"分区 | 发现 4 | 低 | 中高 | 消除每日复读噪声，提升日报增量密度 |
| 4 | 新兴低星替代准入通道 / delta-star 判据 | 发现 3、4 | 中 | 高 | 从根上缓解"越收越窄"与时效性偏差，是本维度最核心的长期价值项 |
| 5 | 官方源补 Google + MCP registry `updated_since` 增量 | 发现 5 | 中 | 中高 | 补主流官方 harness 与 MCP 权威新增发现入口 |
| 6 | `source_gaps` 跨期闭环 + star 量级 sanity guard | 发现 6、7 | 低-中 | 中 | 把持续性缺口与异常抓取显性化，提升可靠性 |

> 组合建议：候选 1+2+3 属"低成本立即可做"，能在不动架构的前提下显著改善覆盖面与新鲜度；候选 4 是需要架构师权衡准入哲学的核心决策项，建议优先讨论。

---

## ⑤ 参考来源

**内部工件（行号见正文）**
- `docs/sop/daily-runbook.md` §1–§3、§5、§9
- `docs/sop/README.md` §固定来源面、§失败与降级、§30 分钟运行预算
- `docs/sop/credibility-dedup-rules.md` §证据等级、§关键事实采集、§去重规则、§重大更新规则
- `docs/specs/data-contract.md` v2.3
- `data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`、`data/ledger.json`、`data/issues/index.json`
- `docs/research/sources-and-landscape.md` §0、§2、§3、§4.2、§4.4、§4.6、§4.7、§7

**外部对标（高置信度）**
- GitHub 搜索语法（`created:`/`pushed:` 日期限定语义）：<https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax>
- GitHub 仓库搜索限定词（`stars:`、`topic:`、`in:`）：<https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories>
- GitHub REST Search API 限流（认证态约 30 次/分、`incomplete_results`）：<https://docs.github.com/en/rest/search/search>
- MCP 官方 registry API（`updated_since` 增量同步）：<https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md>
