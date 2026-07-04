# 可信度、去重与重大更新规则

## 证据等级

### official

满足任一条件可标为 `official`：

- 官方文档、官方 changelog、官方博客、官方规范、官方 API 文档。
- 官方 registry 或官方目录。
- 官方 GitHub 组织仓库，例如 `openai/*`、`anthropics/*`、`modelcontextprotocol/*`、`github/*` 中明确承载对应产品/规范的仓库。
- 由官方页面直接链接并作为当前推荐入口的仓库或文档。

要求：

- 必须保留官方来源链接。
- star、日期、版本、作者等事实仍需实时查询。
- 官方旧仓库、弃用仓库可收录，但推荐语必须说明弃用或迁移状态。

### community-verified

社区项目进入 highlights 必须同时满足：

1. GitHub stars `>= 1000`。
2. archived 为 false，或页面没有归档信号。
3. 至少 2 个附加信号通过。

附加信号：

- 作者/组织背景清晰，README、owner profile、官网或公开文章可验证。
- 近 30 天有 commit、release、issue/PR 活动或仓库页面显示持续维护信号。
- release/tag 节奏清楚，或 changelog 可读。
- contributor、issue、PR 数量显示不是一次性空壳项目。
- 被官方 docs/registry/examples 或高质量 awesome 清单收录。
- license 明确，便于复用。
- README 给出安装、使用、适配 agent/harness 的明确路径。

未达到 `stars >= 1000` 的社区项目不得进入 highlights；即使很新，也只能作为 briefs，并写明“观察中”。

## 关键事实采集

必须实时查询并记录来源：

- star/fork/watch 数。
- 作者、组织、官方背书。
- 发布日期、更新时间、版本号、release 名称。
- 是否归档、license、主要 topic。
- 竞品对比中涉及的定量或状态事实。

禁止：

- 用模型记忆补 star 或日期。
- 用旧调研报告中的数字当成本期实时事实。
- 用第三方趋势站数字替代 GitHub/官方页面作为核心结论。

允许降级：

- GitHub API 失败时使用 GitHub 页面展示值。
- 页面只显示 `117k` 这类四舍五入值时，证据中写“GitHub 页面展示 117k stars”，不要伪造精确数。
- 无法获取某字段时，不要猜；写入 `source_gaps` 或在条目中说明未取到。

## 数值合理性与验证入口

提交前必须运行 `node scripts/validate-data.mjs`。校验器只证明结构、一致性与数值合理性，不替代实时事实查询；关键事实仍必须来自本次运行期间的工具查询。

与 `scripts/validation-rules.json` 保持一致的硬规则：

- `community-verified` 条目 stars `> 120000`：阻断，必须二次核验；若无法确认，降级为 briefs 或写入 `source_gaps`，不得进入 highlights。
- 同期 `community-verified` 条目 stars `>` 同期 `official` 旗舰最大 stars：阻断，必须二次核验。
- 同一 GitHub repo 与上一期相比 stars 跳变同时满足绝对差 `> 50000` 且倍数 `> 2.0`：阻断，必须二次核验。
- 同一 GitHub repo 在 `>= 100000` stars 的高基数区间，跨期绝对差 `> 75000`：即使未超过 2 倍也阻断，必须二次核验。
- 任意条目 stars `> 120000`：触发人工复核警告，即使该条目为 official。

highlights 与 briefs 中的 star claim 同口径进入上述数值门禁。高星 GitHub 条目必须提供可点击验证入口，优先 `https://github.com/{owner}/{repo}` 或 GitHub API repo URL。`evidence_notes` 或 `one_liner` 声称“GitHub API 显示”且命中上述异常时，视为高风险信号，必须先回源确认数值再提交。

## 类型判定

- `skill`：可复用的 Agent Skill、技能库、技能标准、技能样例。
- `mcp`：MCP server、registry、SDK、规范、发现目录。
- `rules`：Cursor rules、CLAUDE/AGENTS 指令集、编码规则集合。
- `hooks`：agent 生命周期 hook、pre/post tool hook、CI/自动化 hook。
- `subagent`：专门的子代理集合、角色库、调度模板。
- `prompt-lib`：提示词库、prompt 模板集合。
- `paradigm`：spec-driven、agent loop、harness、vibe coding治理、开发方法论。

一个资产可有多重属性，但 JSON 的 `type` 只能取主类型。其余属性写进 summary 或 stage tags。

## stage_tags 判定

- `requirements`：需求澄清、PRD、spec、用户故事。
- `design`：架构、接口、方案、UX/系统设计。
- `implementation`：编码、生成、迁移、集成。
- `review`：代码审查、质量门禁、安全/规范检查。
- `testing`：测试、评测、QA、回归、性能验证。
- `ops`：部署、监控、发布、运行维护、自动化运营。

## 去重规则

主键：

- GitHub 仓库：小写 `owner/repo`，例如 `github/spec-kit`。
- 官方页面：canonical URL，去除 `utm_*` 等 tracking 参数。
- 同一项目迁移：优先保留当前 canonical ID，并在 `links` 中保留旧链接。

合并：

- 官方 registry、awesome 清单、GitHub search 命中同一 repo 时，只保留一个候选。
- fork、镜像、搬运仓库默认不单独收录，除非它已经形成独立维护与独立价值。
- 同一作者同一主题的多个小仓库可合并为一个简讯，不强行拆条。

## 重大更新规则

ledger 中已有条目只有符合以下条件才可再次进入 highlights：

- 日报节奏下，不得用同一 release、commit、changelog、registry 状态或页面快照连续重复收录；必须有晚于该条目 `first_reported` 或最新 `last_updates[].date` 的可验证新证据。
- 发布大版本、重要 release，或官方 changelog 明确说明核心能力变化。
- 从社区项目进入官方 docs/registry/examples。
- 增加新的主流 agent/harness 支持，改变使用范式。
- 安全、弃用、迁移、破坏性变更会影响用户选型。
- 旧项目重新活跃，并有可验证的 release/commit/issue 证据。

不算重大更新：

- star 自然增长但没有功能、规范或生态变化。
- README 文案微调。
- 未合并的 issue/PR 讨论。
- 第三方媒体单独报道但项目本身没有变化。

## 竞品对比要求

每个 highlight 尽量给 1-3 个竞品或替代项：

- 同类官方资产优先。
- 社区项目必须说明它相对官方样例、清单或竞品的差异。
- 证据不足时 `competitors` 可为空数组，但不得编造比较。

