# 自动化流水线审查报告 · 规范边界 / 事实纪律 / 工程健壮性

> 审查维度：把整份 SOP 当作"给自动化 Agent 执行的可执行规格"来审。
> 审查方式：只读审查，除本报告外未修改任何流水线工件。
> 审查时间：2026-07-04。
> 审查人：只读审查 subagent（规范边界·事实纪律·工程健壮性维度）。

---

## ① 审查范围与方法

**审查对象（截至本次快照的真实工件）**

| 类别 | 文件 | 用途 |
|---|---|---|
| 主 SOP | `docs/sop/daily-runbook.md`（166 行，10 步） | 每日执行主流程 |
| 判据 | `docs/sop/credibility-dedup-rules.md`（123 行） | 证据等级 / 采集纪律 / 去重 / 重大更新 / 竞品 |
| 入口 | `docs/sop/README.md`（66 行） | 硬性原则、预算、降级、提交前检查 |
| 版式 | `docs/sop/report-template.md`（97 行） | Markdown 报告模板与字段映射 |
| 契约 | `docs/specs/data-contract.md`（v2.3，115 行） | ledger / issues / index / Markdown 数据接口 |
| 数据 | `data/ledger.json`（13 条）、`data/issues/index.json`、`data/issues/2026-07-02.json`、`data/issues/2026-07-03.json` | 真实产出样本 |
| 报告 | `reports/2026-07-02.md`、`reports/2026-07-03.md` | Markdown 归档样本 |
| 交付 | `.github/workflows/notify-wechat.yml`（35 行） | Server酱 微信推送 |
| 治理 | `AGENTS.md`、`docs/automation-recipe.md`、`todolist.md` | 宪章 / 换号配方 / 进度 |

**方法**

1. 把 SOP 当"可执行规格"逐步走查：对每一步问"自动化 Agent 能否无歧义执行？失败/边缘时会怎样？"
2. 用两期真实样本（07-02、07-03）交叉印证规则被遵守 / 违反的证据（行号或字段级）。
3. 对"数据管道幂等与可观测性""给 LLM Agent 的 SOP 设计"做轻量高置信度外部对标（见 §⑤）。
4. 严格区分**事实**（可由行号/数据佐证）与**判断**（我的推断，已标注）。不臆造数值真伪——样本星数属未来合成数据，本报告只评估"规则与机制"，不断言某个星数对错。

---

## ② 关键发现

> 严重度定义：**P0** = 会规律性造成对外错误/数据损坏且无兜底；**P1** = 高危，特定路径会破坏核心承诺（事实准确 / 去重 / 一致性）且缺独立防线；**P2** = 中低危，影响健壮性/可维护性/边缘正确性。
> 结论前置：本次未发现单点即灾难的 **P0**；风险集中在 4 条 **P1**（事实不可验证、主键归一化违规、部分失败无对账、无独立校验关口）+ 若干 P2。

---

### 发现 1 —— 校验环节无法验证"事实是否实时查询"，生成者即校验者 【P1｜事实纪律】

- **现状**：`daily-runbook.md` §10（第 152-165 行）"校验与提交"的全部动作是：解析 JSON（step1）、校验必填/枚举（step2）、校验 gist 文案格式（step3）、校验 index 与实际文件一致（step4）、对比 Markdown/JSON 名称·等级·更新状态（step5）、确认禁改范围（step6）、`git status`（step7）、提交（step8）。这些**全部是结构/格式/一致性检查**。README 硬性原则 1-2（第 19-20 行）与 `credibility-dedup-rules.md`"关键事实采集"（第 40-60 行）要求 star/日期"必须实时查询、禁模型记忆、禁旧调研数字、附链接"，但**没有任何一步能核实一个数字确实来自本次实时查询、且与来源当时的展示值一致**。
- **问题**：`evidence_notes` 里写"采集时间 2026-07-02T14:41+08:00。GitHub API 显示 243,701 stars"（见 `2026-07-02.json` 第 10 行）——但校验只检查"这句话存在且有链接"，不检查"243,701 是不是真的查出来的"。由于**生成与自查是同一个 LLM**，一个凭记忆/臆造的星数会通过 §10 全部检查。这使整套事实纪律实质上只靠生成 Agent 的自律，无独立验证。
- **依据**：§10 step1-8 逐条无"回查/快照比对/重查"动作；contra README 第 19-20 行的"禁止凭模型记忆"。判断部分：合成样本中社区项 `affaan-m/ECC` 225,218 stars、`msitarzewski/agency-agents` 125,563 stars（`ledger.json` 第 217、257 行）在数量级上高于官方 `anthropics/claude-code` 135,528（第 160 行）——**我不断言其真伪**，但正说明缺一道"合理性/量级"哨兵时，异常值会畅通无阻。
- **改进建议（选项式）**：
  - A. 要求把关键事实的**原始证据留痕**（如把 `GET /repos/{owner}/{repo}` 返回的 `stargazers_count`/`pushed_at` 原样写入一个 `evidence_raw` 附加字段或运行日志），使人工/CI 可事后比对。
  - B. 增加**独立校验通道**（见发现 4）：CI 在 push 后对少数 highlight 复查星数量级/存在性。
  - C. 增加**轻量合理性哨兵**：社区项星数 > 某阈值（如超过同期最高官方仓）时要求二次确认或标注"待复核"。
  - D. 明确"校验只能拦格式，不能拦事实"这一**局限性**写进 SOP，避免给出虚假安全感。

---

### 发现 2 —— GitHub 主键大小写归一化规则被实际数据违反，去重存在潜在漏配 【P1｜规范/去重/确定性】

- **现状**：`daily-runbook.md` §5 第 74 行与 `credibility-dedup-rules.md` 第 87 行均规定"GitHub：**小写** `owner/repo`"（后者举例 `github/spec-kit`）。但真实 `ledger.json` 中的 id 保留了原始大小写：`"affaan-m/ECC"`（第 211 行）、`"Fission-AI/OpenSpec"`（第 232 行）；对应 issues（`2026-07-03.json` 第 6/76/112 行等）也用同样的非小写串。
- **问题**：主键**没有按规则归一化**。当前之所以去重仍正常，仅仅因为 ledger 侧与 issue 侧"一致地都不小写"。但去重的正确性此刻依赖的是"巧合的一致"，而非规则。一旦某次运行**真的按 SOP 把候选 id 小写**（`fission-ai/openspec`）再与 ledger 里的 `Fission-AI/OpenSpec` 做字符串比较，就会判为"未收录"→**重复收录 / 重复 highlight**。叠加 LLM 非确定性（发现 12），"这次小写、下次不小写"完全可能。
- **依据**：规则文本（§5 第 74 行、credibility 第 87 行）要求小写；数据事实（`ledger.json` 第 211、232 行）未小写；`msitarzewski/agency-agents`（第 251 行）恰好本身全小写，掩盖了问题的普遍性。这是一条**规则与产出漂移**的确证。
- **改进建议**：
  - A. 迁移现有非小写 id 为小写（属数据订正，需架构师授权，本审查不改）。
  - B. 在校验步骤加"**主键归一化断言**"：所有 GitHub 型 id 必须 `== lower(id)`，否则失败（可正则/脚本判定，确定性强）。
  - C. 去重比较时**强制 case-insensitive**并回写归一化形式，从机制上消除依赖。

---

### 发现 3 —— 部分失败无事务/回滚，幂等门会"锁定"半成品；ledger/Markdown 无对账自愈 【P1｜幂等与状态一致性】

- **现状**：幂等门（§1 第 10-13 行）**只**以 `data/issues/YYYY-MM-DD.json` 是否存在为判据："已存在→立即停止，不重采、不生成、不提交"。而一次运行要顺序产出 4 件套：issue JSON（§6）→ Markdown（§7）→ index（§8）→ ledger（§9）→ 提交（§10）。其中只有 index 有全量对账自愈（§8 第 136 行"重新扫描…确认清单集合与实际日期文件集合完全一致"，§10 step4 复核）。**ledger 与 Markdown 没有任何等价的对账/自愈**。
- **问题**：若某次运行在写完 issue JSON 之后、写 ledger/Markdown 之前崩溃且已提交了 issue（或提交粒度非原子），则：
  1. 下次**同日**运行时，幂等门看到 issue 文件存在→**整次跳过**→ledger 永久缺项、Markdown 永久缺失，且**跳过发生在 §8/§9/§10 对账之前**，自愈逻辑根本不会执行。
  2. ledger 缺项的后果是**去重失效**——该条目未来会被当作"新条目"再次 highlight，且无任何检测。
  - 云端"每次全新 clone + 单次原子提交"的模型能缓解**未提交**的半成品（会被丢弃重跑），但 SOP **并未强制"恰好一次原子提交这 4 个文件"**（§10 step8 只给了提交信息模板，recipe 第 22 行说"将全部改动提交并推送"），提交/推送粒度不受约束时，部分提交仍可能发生。
- **依据**：幂等判据单一（§1 第 10 行）；index 有对账（§8 第 136 行）而 ledger/Markdown 无；§10 未规定原子提交。外部对标：可靠数据管道要求"业务状态与去重键在**同一事务**内落库""用**对账（reconciliation）**修复部分失败逃逸的漂移"（见 §⑤ 对标 2）。本流水线用文件系统模拟多表写入却无事务、无对账。
- **改进建议**：
  - A. **完成语义与"文件存在"解耦**：以"4 件套齐备"或 issue 内 `status:"complete"` 标记作为幂等判据，避免半成品被锁定。
  - B. 强制**单次原子提交**恰好这批文件（一次 `git add` 明确列表 + 一次 commit + 一次 push）。
  - C. 为 ledger/Markdown 补**对账自愈**：init 阶段扫描所有 issue 的 highlights，断言其 id 全部在 ledger、每期都有同名 Markdown，缺失则修复或告警。

---

### 发现 4 —— 无独立于生产者的校验/CI 关口，畸形产出会直接上线 【P1｜工程健壮性/交付】

- **现状**：仓库唯一的 workflow 是 `notify-wechat.yml`（推送通知），它**只发微信、零校验**（第 18-34 行）。契约合规、JSON 可解析、index/ledger 一致等**全部**由生成 Agent 在 §10 内自查后自行提交。没有任何 push 后的独立 schema 校验 / 一致性门禁。
- **问题**：站点是只读消费 `data/issues/*.json` 与 `ledger.json`（`data-contract.md` 第 111 行）。若某天 Agent 产出**非法 JSON**或**违约字段**并提交推送，微信照发"今日已更新"，但站点解析该期时可能抛错（archive/index 视图受影响），形成对外可见故障，而**没有任何自动关口在发布前拦下**。对"无人值守的每日自动化"，这是防御纵深的缺失（生产者 == 校验者 == 同一 LLM）。
- **依据**：`.github/workflows/` 下仅 notify（无 validate 作业）；§10 自查全部在生成 Agent 内。外部对标：成熟管道普遍"**把监控/校验与执行分离**"（§⑤ 对标 1 第 7 条、对标 2 的 reconciliation/dashboards）。
- **改进建议**：
  - A. 新增一个 **CI 作业**（push 触发，`data/**` `reports/**` 变更时）：JSON schema 校验 + 枚举校验 + index↔文件对账 + ledger↔highlights 对账 + 主键小写断言（发现 2）+ gist 长度/前缀正则（发现 9），红灯即拦（或红灯即回滚/告警）。此项一次性投入、确定性强，**同时堵住发现 1/2/3/9 的相当部分**。
  - B. 让微信推送**依赖校验作业成功**（`needs:`），避免"校验红灯但仍推送"。

---

### 发现 5 —— Markdown 简讯与 JSON `one_liner` 已实际漂移，"同源"不变式被破坏 【P2｜规范/一致性】

- **现状**：§7 第 125 行与 §10 step5（第 158 行）要求"Markdown 简讯使用清洗后的 `briefs[].one_liner`""不得把任何 gist 作为 Markdown 正文"，即 Markdown 简讯应与 JSON `one_liner` 同源。但实测两者**不一致**：
  - `2026-07-02.json` 第 183 行 `one_liner`："社区最广 MCP server 清单之一，发现后应回到官方 Registry 核验元数据；GitHub Search/API 显示 90,153 stars。"（描述先行、star 置尾）
  - `reports/2026-07-02.md` 第 123 行简讯："…：**采集时间 2026-07-02T14:41+08:00。GitHub Search/API 显示 90,153 stars**；社区最广 MCP server 清单之一…"（旧式"采集时间…stars"前缀，恰是 `one_liner` 规范所禁止的写法）。
- **问题**：契约 v2.2/v2.3 回填（`data-contract.md` 第 9、11、88-89 行）把 JSON `one_liner` 改成了描述先行，但**归档的 Markdown 未同步回填**，导致同一期 JSON 与 Markdown 简讯文本漂移。若对 07-02 重跑 §10 step5 会 fail。这暴露：①"同源"不变式在**契约迁移/回填**时未被维护；② §10 step5 的对比在回填流程外未被执行（回填是架构师带外操作，可理解，但结果是不变式静默破坏）。用户侧影响低（站点只读 JSON、不解析 Markdown，见契约第 111 行），故定 P2。
- **依据**：`2026-07-02.json` 第 183 行 vs `reports/2026-07-02.md` 第 123 行文本级不一致；契约回填条款（第 88-89 行）只承诺改 JSON。
- **改进建议**：
  - A. 契约回填条款显式声明"回填只动 JSON、Markdown 归档冻结、`one_liner` 同源校验只对**生成当期**生效"，把"漂移"降级为"有意的历史冻结"。
  - B. 或补一次性把 07-02 Markdown 简讯与 JSON `one_liner` 对齐（需授权）。
  - C. §10 step5 增补：对比范围明确包含简讯 `one_liner` 文本（当前措辞偏"名称/等级/更新状态"）。

---

### 发现 6 —— "强制重新生成当天"路径存在自噬逻辑缺陷 【P2｜幂等/边缘】

- **现状**：§1 第 13 行给了幂等例外："只有用户明确指示强制覆盖当天日报时，才允许跳过幂等检查。"但该例外**没有规定重生成前要先回滚上次同日已写入的状态**。
- **问题**：设想 run1（上午）已提交 issue+ledger（追加了 A/B/C 三条，`first_reported=今日`）。用户不满意→触发强制重生成。run2 读 ledger（此时已含 A/B/C），执行 §5 去重（第 76-79 行）："已存在→默认跳过"。于是 A/B/C **被判为已收录而跳过**（当日不构成重大更新）→run2 产出的报告**反而缺失 A/B/C**，甚至可能空 highlights。force-regen 的目的被其自身上次写入的 ledger 击败。§9（第 140-144 行）"新条目追加"也没有"同 id 去重写入"守卫，另一种实现下会造成 ledger 重复条目。
- **依据**：§1 第 13 行例外无回滚要求；§5 第 78 行"已存在默认跳过"；§9 第 142 行"追加"无去重。
- **改进建议**：
  - A. force-regen SOP 增补前置步骤："先移除当日 issue/Markdown，并从 ledger 回滚 `first_reported==当日` 的新增条目、撤销当日的 `last_updates`，再重跑。"
  - B. §9 写入改为"按 id upsert"，避免重复追加。

---

### 发现 7 —— 提交范围守卫脆弱且覆盖不全 【P2｜安全/交付】

- **现状**：禁改守卫有两处：§10 step6（第 159 行）"确认禁止范围未改动：`docs/prds/`、`docs/specs/`、`site/`"；README 第 65 行给了方法 `git diff -- docs/prds docs/specs site` 为空。
- **问题**：
  1. **纯 advisory**：靠 Agent 自觉执行，无 pre-commit hook / CI 强制。
  2. **方法有盲区**：`git diff -- <paths>` 只看**未暂存**改动；若 Agent 先 `git add -A` 再执行该命令，已暂存的禁改改动会**看不到**（应 `git diff HEAD -- ...` 或依赖 `git status`）。§10 step7 的 `git status --short` 能看到但未与 step6 绑定判定。
  3. **覆盖不全**：守卫只列 `docs/prds`/`docs/specs`/`site` 三处，**未含** `docs/sop/`（Agent 自身指令！）、`AGENTS.md`、`todolist.md`、`.github/`。recipe 让 Agent"提交全部改动"，若它误改了自己的 SOP 或 workflow，无守卫拦截。
- **依据**：§10 step6 第 159 行、README 第 65 行的路径清单与 `git diff` 语义；recipe 第 22 行"将全部改动提交并推送"。
- **改进建议**：
  - A. 用 `git diff HEAD -- <禁改清单>` 或"白名单提交"（只允许 `git add data/ reports/`）替代黑名单。
  - B. 守卫清单补齐 `docs/sop`、`AGENTS.md`、`todolist.md`、`.github`。
  - C. 用 CI（发现 4）在服务器侧做强制守卫，而非只靠 Agent 自觉。

---

### 发现 8 —— 微信推送失败半静默 + 推送日期与报告文件解耦 【P2｜安全/交付/边缘】

- **现状**：`notify-wechat.yml` 触发于 push 到 `reports/**`（第 4-7 行）；SendKey 走 `secrets.SERVERCHAN_SENDKEY`（第 15 行）经 env 注入，未硬编码；未配置时优雅 `exit 0`（第 19-22 行）；日期用 `TODAY=$(TZ=Asia/Shanghai date +%F)`（第 23 行）**独立计算**，链接指向 `reports/${TODAY}.md`（第 31 行）。
- **问题**：
  1. **失败半静默**：Server酱 的 API 错误（配额耗尽 / key 失效等）通常以 **HTTP 200 + 错误 code JSON** 返回，`curl` exit 0→step 通过→GitHub Actions 绿灯→用户误以为"已推送"。workflow 未解析返回体的 `code`（第 32-34 行）。这与"失败是否静默"关切一致——**是，部分静默**。
  2. **日期与报告解耦**：workflow 用**推送时的墙钟**（`date +%F`）算 `TODAY`，而报告文件名由 Agent 侧算北京日期。二者是两次独立日期计算：
     - 若推送**跨北京零点**（如运行超时，10:00 跑、次日 00:xx 才推）→ `TODAY`=次日→链接 `reports/{次日}.md` **不存在→404**。
     - recipe 第 44 行明确允许"手动触发补跑并指定日期"——补跑历史日期 D 今天推送时，链接仍指向 `reports/{today}.md`（错日期，404）。
  - 因 10:00 运行 + 30 分钟预算，正常路径远离零点，概率低，故 P2；但补跑/超时路径为真实缺陷。
- **依据**：workflow 第 23、31-34 行；recipe 第 44 行"补跑指定日期"。
- **改进建议**：
  - A. 解析 Server酱 返回 JSON 的 `code`，非 0 显式 `exit 1`（让失败可见）。
  - B. 推送日期**从被改动的 `reports/*.md` 文件名提取**（如取本次 push 新增/修改的 report 文件名），而非墙钟；或校验 `reports/${TODAY}.md` 存在再发。
  - C. `curl` 加 `-m`（超时）与 `--retry`。

---

### 发现 9 —— gist / one_liner 文案规范可执行性弱，仍回落到 LLM 自判 【P2｜事实纪律/规范】

- **现状**：§10 step3（第 156 行）要求 gist"约 18-42 个中文字符、单句、无换行、无证据前缀、无机械省略截断"，`briefs[].gist` 还须"无 star/license/release/日期尾巴、只依据同条 `one_liner` 提炼"。契约 §2.2（第 63-75 行）同款约束并强调"不得引入新事实"。
- **问题**：
  1. **"约"18-42** 是近似量，自动校验无法给出确定的通过/失败边界。
  2. **字符计数口径不明**：gist 普遍混入拉丁词（`2026-07-02.json` 第 213 行"跨Claude Code、Codex、Gemini和Cursor的技能发现索引"、第 182 行"广覆盖MCP服务器…Registry核验"），`MCP`/`Registry`/`Claude Code` 按"中文字符"如何计数无定义。
  3. **"无机械省略截断""不引入新事实"是语义判断**：正则至多能查 `…`/`...` 字面，但"是否机械截断""是否引入 summary/one_liner 外的新事实"只能靠**同一个生成 LLM 自判**，与发现 1 同源无独立性。
- **依据**：§10 step3 第 156 行、契约第 63-75 行的措辞；样本 gist 混合中英（第 182、213 行）。
- **改进建议**：
  - A. 给出**可判定口径**：明确"字符=Unicode 码点/或中文按 1、连续 ASCII 串按 N"，把"约"改成硬区间（如 14-46 码点）供 CI 正则化。
  - B. 把可机械化的部分（长度、换行、前缀黑名单词表、结尾证据词表）落到 CI（发现 4）。
  - C. 承认"不引入新事实"不可自动判定，作为**人工抽检**项而非"校验通过"项。

---

### 发现 10 —— 瞬时全故障日被幂等永久固化，无缺报告告警 【P2｜边缘/可观测性】

- **现状**：README"失败与降级"（第 48-53 行）与 daily-runbook §2-3 规定来源失败写 `source_gaps`、GitHub API 失败降级到 HTML 页面（§3 第 59 行）。若"来源全失败"，SOP 让其"继续完成可验证部分"，无可验证时走"本期无重点条目"模板。
- **问题**：若 10:00 窗口恰逢 GitHub/官方全挂，Agent 产出一份**空报告**并提交→当日 issue 文件存在→幂等门认定"当日已完成"→**API 恢复后不重试、不补跑**（recipe 第 44 行"漏掉的天数不会自动补跑"）。且系统**无 heartbeat / 缺报告告警**：微信推送是"有推送=成功"的在场信号，不是"无推送=告警"的缺席信号。断更只能靠用户"早上没收到推送"这种人肉观察（recipe 第 43 行自认）。
- **依据**：幂等固化（§1 第 10-11 行）+ 无重试（recipe 第 44 行）+ 无缺席告警（仅 notify-wechat 在场信号）。外部对标：关键 cron 的"单一最重要实践"是 **dead man's switch / heartbeat**——对"任务根本没跑/跑了没产出"这种无错误信号的静默失败，必须**以缺席触发告警**（§⑤ 对标 1）。
- **改进建议**：
  - A. 接一个**外部 heartbeat**：仅当当日成功产出新报告后再 ping，监控侧设 90 分钟宽限（对标推荐值），缺 ping 即告警。
  - B. 空报告 / 全 `source_gaps` 的日子标注 `degraded:true`，允许人工触发补跑覆盖（配合发现 6 的 force-regen 修复）。

---

### 发现 11 —— community-verified 门槛在三处表述不一致 【P2｜规范一致性】

- **现状**：`credibility-dedup-rules.md` 第 22-26 行给出**三条**准入：①stars≥1000 ②archived=false（或页面无归档信号）③≥2 附加信号。但 `daily-runbook.md` §4 第 66 行只写"stars≥1000 且至少 2 个附加信号"，README 硬性原则 4（第 22 行）同样只写"stars≥1000 + 至少 2 信号"——**两处摘要都漏了 archived=false 条件**。
- **问题**：同一门槛三处表述，两处少一个必要条件。Agent 若只读 §4/README 摘要，可能把一个已归档但 star 高的项目错误纳入 highlights。
- **依据**：credibility 第 22-26 行（3 条）vs §4 第 66 行 / README 第 22 行（2 条）。
- **改进建议**：统一为单一权威表述（建议 §4/README 明确"详见 credibility 三条"或补齐 archived 条件）。

---

### 发现 12 —— LLM 非确定性对可复现/可审计的影响，缺不可变证据快照 【P2｜确定性/可复现】

- **现状**：SOP 已有若干缓解：固定 search 模板（§3 第 40-50 行）、search 预算 8-12 次（§3 第 36 行）、`evidence_notes` 附采集时间+链接、ledger 稳定主键去重、幂等冻结首个产出。
- **问题**：
  1. **选择的非确定性**：从候选池挑 1-5 个 highlight（§ README 预算表第 34 行）本质非确定，两次运行可能选不同仓库；幂等虽冻结首个产出，也**锁定其质量**（若首个产出偏弱，无自动纠偏，只能走有缺陷的 force-regen，见发现 6）。
  2. **无不可变证据快照**：只存"采集时间+链接"，未存原始 API 响应。而 star 只增不减，过去报告的星数**永不可精确回验**（点开链接看到的是"今天的"值）。采集时间戳只说明"何时采"，不构成可复算的证据。
- **依据**：§3/README 的缓解措施；evidence 仅文本+链接（如 `2026-07-02.json` 第 10 行）无原始响应留痕。
- **改进建议**：
  - A. 关键事实留原始响应（配合发现 1-A），实现"同源可复现/可审计"。
  - B. 明确接受"报告是某时刻快照、不追求逐字复现"，把审计目标定为"证据链接+采集时间可支撑当时结论"，写进 SOP 以正确设定预期。

---

### 发现 13 —— 幂等为 check-then-act（TOCTOU），并发/重复触发无锁 【P2｜幂等/并发】

- **现状**：幂等门（§1 第 10 行）是"先检查文件是否存在，再决定是否生成"的 check-then-act，无锁、无租约。
- **问题**：手动+定时**同分钟并发**两个 run，都可能读到"文件不存在"→都生成→都尝试提交。云端"全新 clone + push 非快进冲突"可兜底其一失败，但这是**依赖 git 冲突的偶然兜底**，非显式设计；若两者以 merge/retry 收敛，可能双份产出或状态交错。
- **依据**：§1 第 10 行判据 + 无并发控制条款。单用户/每日 cron 下概率低，故 P2。
- **改进建议**：显式声明"同一天单飞"策略（如以提交/推送的原子性 + 冲突即放弃为准），或在 SOP 注明"手动触发前确认无进行中的定时运行"。

---

## ③ 做得对的

1. **幂等保护针对真实事故补齐**：07-02 曾发生"同日两次生成静默覆盖"（`todolist.md` 第 31 行），SOP 随即加入"当天文件已存在则整次跳过"（§1 第 10-13 行、README 第 18 行），方向正确——尽管留下发现 3/6/10 的次生问题。
2. **index.json 有全量重扫对账 + 自愈**：§1 第 15 行（缺失则按实际文件重建）+ §8 第 136 行（重扫确认集合一致）+ §10 step4（复核）。这是三件套里做得最扎实的一致性设计，值得复用到 ledger。
3. **日期命名根治跨年 bug**：契约 v2 从 ISO 周（`YYYY-Www`）改为 `YYYY-MM-DD`（契约第 5 行），天然规避了历史上的 W53 跨年时区 bug（`todolist.md` 第 43 行），跨月/跨年边界安全（契约第 114 行）。
4. **重大更新纪律在真实数据中被正确执行**：07-03 的 `github/spec-kit` `is_update=true`，证据为 v0.12.4（2026-07-02）晚于 ledger 快照 v0.12.3（2026-07-01）（`2026-07-03.json` 第 10、25 行），满足 §5 第 82 行"必须有晚于 first_reported/last_updates 的可验证新证据"；`anthropics/claude-code` v2.1.199>v2.1.198 同理。规则被遵守。
5. **证据链接 + 采集时间戳提供基本可审计性**：每个 highlight 均带 `links` 与"采集时间"，人工可回溯官方/GitHub 核验（虽有发现 12 的快照局限）。
6. **无合格条目走明确降级、不硬凑**：`report-template.md` 第 48-72 行"本期无重点条目"模板 + README 第 37 行"不为数量牺牲可信度"，且 07-02/07-03 的 `source_gaps` 如实记录了 WebFetch 超时、当日新仓 0 命中（`2026-07-02.json` 第 223-226 行）。
7. **SendKey 走 Secrets + env、未硬编码、未配置优雅跳过**：`notify-wechat.yml` 第 15、19-22 行，符合基本密钥卫生。
8. **社区门槛在样本中被守住**：两期社区 highlights 星数 37k-243k，均远超 1k（虽数量级偏高，但规则本身被遵守）；highlights 数量均为 5，落在 1-5 区间（契约第 107 行）。
9. **gist 回填已完成且格式基本达标**：07-02 highlights 5/5、briefs 7/7，07-03 highlights 5/5、briefs 5/5 均带 gist，且无一以证据前缀开头（抽检 `2026-07-02.json` 第 182-220 行）。

---

## ④ 高优先级改进候选（按性价比排序）

> 排序依据：一次性投入 × 覆盖问题面 × 确定性收益。

1. **新增 push 触发的 CI 校验作业**（堵 发现 4，并大幅缓解 1/2/3/9/11）。一份 GitHub Actions + 一个校验脚本即可做：JSON schema + 枚举、index↔文件对账、**ledger↔全 highlights 对账**、**主键小写断言**、gist 长度/前缀正则、禁改范围服务器侧强制。**性价比最高**：一次性、确定性强、把"生产者==校验者"变成"生产者 + 独立校验"。
2. **主键归一化落地**（堵 发现 2）：迁移现有非小写 id + 去重强制 case-insensitive + CI 断言。低成本、直接保住去重承诺。
3. **幂等升级 + ledger 对账自愈**（堵 发现 3/6/13）：完成语义与"文件存在"解耦（`status:complete` 或四件套齐备）、强制单次原子提交、init 阶段 ledger/Markdown 缺项对账、force-regen 明确"先回滚同日状态"。
4. **微信推送修正**（堵 发现 8）：解析 Server酱 返回 `code` 非 0 即 fail；推送日期从被改动的 `reports/*.md` 文件名提取而非墙钟；加超时/重试。改动小、消除 404 与假成功。
5. **接 heartbeat / dead-man's switch**（堵 发现 10）：成功产报后 ping 外部监控，缺 ping 90 分钟即告警。把"静默断更"从人肉发现变为主动告警。
6. **文案规范可判定化**（堵 发现 9/11）：gist 长度改硬区间 + 明确字符计数口径 + 前缀/尾缀黑名单词表；统一 community-verified 三处表述。可与候选 1 的 CI 合并实现。
7. **事实留痕 + 审计预期对齐**（堵 发现 1/12）：关键事实存原始 API 响应字段；SOP 明确"校验只能拦格式、事实靠留痕+抽检"，避免虚假安全感。
8. **同源不变式在回填/迁移时的处置**（堵 发现 5）：契约声明"Markdown 归档冻结、同源校验仅对生成当期生效"，或一次性回填 07-02 Markdown 简讯。

---

## ⑤ 参考来源

**内部工件（行号级引用见 §②）**
- `docs/sop/daily-runbook.md`、`docs/sop/credibility-dedup-rules.md`、`docs/sop/README.md`、`docs/sop/report-template.md`
- `docs/specs/data-contract.md`（v2.3）
- `data/ledger.json`、`data/issues/index.json`、`data/issues/2026-07-02.json`、`data/issues/2026-07-03.json`
- `reports/2026-07-02.md`、`reports/2026-07-03.md`
- `.github/workflows/notify-wechat.yml`、`docs/automation-recipe.md`、`AGENTS.md`、`todolist.md`

**外部对标（轻量、高置信度）**
- 对标 1 · Cron 静默失败监控 / dead man's switch（heartbeat）：关键 cron 的"单一最重要实践"是以**缺席触发告警**、成功后才 ping、宽限窗设为约 2×运行时长 + 缓冲、监控须与执行分离。
  - Cronradar《Cron Job Monitoring Best Practices》https://cronradar.com/comparisons/cron-monitoring-best-practices
  - WatchCron《What is a dead man's switch…》https://watchcron.com/blog/what-is-dead-mans-switch-cron-jobs
  - Hooklistener《Cron Job Monitoring: Catch Silent Failures…（2026）》https://www.hooklistener.com/guides/cron-job-monitoring
- 对标 2 · 幂等 / 部分失败 / 对账（transactional outbox·inbox·reconciliation）：业务状态与去重键须在**同一事务**内落库；"整个工作单元难以天然幂等"时用去重键 + 幂等消费；用**对账定期比对权威来源、修复部分失败逃逸的漂移**。
  - NILUS《Idempotency as a First-Class Concern in Microservices》https://www.nilus.be/blog/idempotency_as_a_first-class_concern_in_microservices/
  - AWS Prescriptive Guidance《Transactional outbox pattern》https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
  - KloudVin《Transactional Outbox and Inbox Pattern…》https://kloudvin.com/article/transactional-outbox-inbox-exactly-once-event-publishing/

---

> 免责声明：本报告只评估"规则与机制"，不断言样本中任一 star/日期数值的真伪（样本为未来合成数据）。所有"问题"均标注了行号/字段依据；凡属推断均已标注为"判断"。
