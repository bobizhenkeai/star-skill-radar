# Star-Skill Radar 每日 SOP 入口

本目录是 Cursor Automations 云端 Agent 每日 10:00（北京时间）运行时的唯一操作手册。新上下文 Agent 必须先读本文件，再按 `daily-runbook.md` 执行，可信度与去重判据以 `credibility-dedup-rules.md` 为准，报告版式以 `report-template.md` 为准。

## 运行目标

每日生成一期中文情报日报，并提交以下产物：

- `data/issues/YYYY-MM-DD.json`
- `data/issues/index.json`
- `reports/YYYY-MM-DD.md`
- `data/ledger.json`

本仓库的数据契约固定见 `docs/specs/data-contract.md`。不要自行新增、删除、改名 JSON 字段；确需变更时，只在本次完成反馈中向架构师提出。

## 硬性原则

0. **幂等**：当天 `data/issues/YYYY-MM-DD.json` 若已存在，本次运行立即停止，不重新生成、不覆盖、不提交（见 `daily-runbook.md` 第 1 节）。同一天只允许有一次正式产出，无论触发方式是定时还是手动。仅在用户明确要求"强制重新生成当天"时例外。
1. 禁止凭模型记忆填写 star 数、作者、发布日期、更新时间、版本号、官方背书等关键事实。
2. 所有关键事实必须来自本次运行期间的实时工具查询，并在 JSON 的 `evidence_notes` 与 Markdown 报告中附来源链接和采集时间。
3. 官方/权威来源可直接进入 `official`，但仍需来源链接。
4. 社区项目必须达到 `stars >= 1000`，并通过至少 2 个附加信号，才可进入 `community-verified` 重点条目。
5. 以规范化 `owner/repo` 为 GitHub 项目主键；非 GitHub 资产使用规范化 URL。
6. 已在 `data/ledger.json` 出现的条目默认不重复，除非符合重大更新规则。
7. 来源失败时记录到 `source_gaps`，继续完成可验证部分；不得硬凑低可信条目。

## 30 分钟运行预算

| 时间 | 动作 | 产出 |
|---|---|---|
| 0-5 分钟 | 读 `ledger.json`、确定北京时间运行日期、巡检官方 changelog/docs/spec/registry | 官方候选与 source gap |
| 5-12 分钟 | 固定观察仓库快照与 GitHub Search 精简模板 | 候选池，含实时 star/日期 |
| 12-20 分钟 | 对 Top 候选补证据：owner、release、issues/PR、contributors、官方收录 | 可信度判定 |
| 20-25 分钟 | 去重、重大更新判断、挑选 1-5 个重点条目 | highlights/briefs 草案 |
| 25-30 分钟 | 生成 JSON + Markdown、更新日期清单与 ledger、校验、提交 | 日报产物与 commit |

预算不足时的优先级：先保证 1-3 个重点条目的事实准确与 JSON 合规，再补简讯；无合格条目时走“本期无重点条目”降级，不要为了数量牺牲可信度。

## 固定来源面

优先级从高到低：

1. 官方 changelog/docs/spec/API/registry：OpenAI、Anthropic、Cursor、Model Context Protocol、Agent Skills。
2. 官方 GitHub 仓库：`openai/*`、`anthropics/*`、`modelcontextprotocol/*`、`github/spec-kit` 等。
3. 社区高星资产：skills、MCP servers、rules、hooks、subagents、prompt-lib、agent 工作范式。
4. 第三方趋势站、star-history、ecosyste.ms：只能辅助发现，核心事实必须回到 GitHub 或官方页面。

## 失败与降级

- 某来源不可访问：写入 `source_gaps`，说明来源、失败方式、替代来源。
- GitHub API/Search 限流或失败：改用 GitHub 仓库网页、release 页面或官方页面；若只能得到四舍五入的 star 展示值，必须在证据中写明“GitHub 页面展示值”。
- 本期无合格重点条目：`highlights` 写空数组，Markdown 使用“本期无重点条目”模板，`briefs` 可保留已验证简讯。
- 竞品资料不足：`competitors` 可为空数组，但 Markdown 中需说明未做强比较的原因。

## 提交前检查

运行完成前必须确认：

- `data/ledger.json` 与当期 `data/issues/YYYY-MM-DD.json` 可被标准 JSON 解析器解析。
- `data/issues/index.json` 可被标准 JSON 解析器解析，内容与 `data/issues/` 下实际日期文件一致。
- 当期 JSON 使用顶层 `date` 字段，且不得保留旧周期字段。
- `type`、`evidence_tier`、`stage_tags` 枚举值符合 `docs/specs/data-contract.md`。
- 每个 highlight 都有 `links`，社区重点条目 evidence notes 包含 star 与采集时间。
- Markdown 报告与 JSON highlights 的名称、证据等级、更新状态一致。
- `git diff -- docs/prds docs/specs site` 为空。
