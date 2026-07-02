# 每周执行 Runbook

本 Runbook 描述单次自动化运行的完整流程。执行时不要跳过事实查询、去重和校验步骤。

## 1. 初始化

1. 确认当前工作目录为仓库根目录。
2. 读取 `AGENTS.md`、`docs/specs/data-contract.md`、本目录全部 SOP。
3. 用系统时间计算当前 ISO 周，文件名必须是 `YYYY-Www`，例如 `2026-W27`。
4. 读取 `data/ledger.json`；不存在时创建空数组，存在时必须先解析成功。
5. 建立候选表，字段至少包含：`id`、`name`、`type`、`source_kind`、`stars`、`dates`、`links`、`evidence_signals`、`ledger_state`。

## 2. 官方源巡检

优先巡检以下来源：

- OpenAI：Codex docs、Skills docs/cookbook、官方 GitHub 仓库。
- Anthropic：Claude Code docs/changelog、skills/subagents 文档、官方 GitHub 仓库。
- Cursor：docs、changelog、blog。
- MCP：spec、blog、registry、`modelcontextprotocol/*`。
- Agent Skills：`agentskills.io`、`agentskills/agentskills`。

官方候选的准入条件：

- 页面或仓库本身来自官方域名、官方组织、官方 registry 或官方规范。
- 至少有 1 个实时来源链接。
- 如果报告使用 star、版本、日期，必须从本次查询结果中摘取并标注采集时间。

## 3. GitHub 社区候选检索

在 GitHub Search API 限流下使用固定模板，不做宽泛无边界搜索。建议总 search 请求控制在 12-20 次内。

固定模板：

```text
"agent skills" in:name,description,readme stars:>50 archived:false
"awesome claude code" in:name,description,readme
"awesome mcp servers" in:name,description,readme
"spec-driven development" in:name,description,readme stars:>50
"cursor rules" in:name,description,readme stars:>50
created:>=${week_start} stars:>50 archived:false
pushed:>=${week_start} stars:>100 topic:mcp
topic:agent-skills stars:>50
topic:mcp-servers stars:>50
```

对 Top 候选补抓：

- `GET /repos/{owner}/{repo}` 或 GitHub 仓库页面：stars、forks、watchers、issues/PR、archived、license、topics、updated/pushed。
- releases 或 tags：最近版本、发布时间。
- owner 页面或 README：作者/组织背景。
- issues/PR 或 commit 历史：维护活跃度。

如果 API 失败，使用 GitHub HTML 页面作为降级事实源，并把 API 失败写入 `source_gaps`。

## 4. 可信度判定

按 `credibility-dedup-rules.md` 执行：

- `official`：官方/权威直接准入。
- `community-verified`：`stars >= 1000` 且至少 2 个附加信号通过。
- 不满足门槛的项目不得进入 highlights，可作为 briefs 或舍弃。

每个重点条目必须写明证据等级；社区条目必须在 `evidence_notes` 中列出 star 数、采集时间、通过的附加信号。

## 5. 去重与重大更新

1. 规范化 ID：
   - GitHub：小写 `owner/repo`。
   - 官方页面/博客/规范：去除 tracking 参数后的 canonical URL。
2. 与 `data/ledger.json` 对照：
   - 不存在：`is_update = false`，可作为新条目。
   - 已存在：默认跳过。
   - 已存在但符合重大更新：`is_update = true`，写入 `last_updates`。
3. 多来源命中同一项目时合并证据，不重复创建条目。

重大更新包括：

- 大版本或明显版本序列推进。
- 官方发布核心新能力、新规范、新 registry/目录状态。
- 项目从社区清单进入官方 docs/registry/examples。
- 近 7-30 天明显重新活跃，且对使用范式有影响。

## 6. 生成当期 JSON

写入 `data/issues/YYYY-Www.json`，结构必须符合数据契约：

- `week`：ISO 周。
- `generated_at`：ISO 8601 时间戳。
- `highlights`：优先 3-5 个；无合格条目时为空数组。
- `briefs`：已验证但不够深度分析的简讯。
- `source_gaps`：无则空数组。

字段枚举：

- `type`：`skill | mcp | rules | hooks | subagent | prompt-lib | paradigm`
- `evidence_tier`：`official | community-verified`
- `stage_tags`：`requirements | design | implementation | review | testing | ops`

## 7. 生成 Markdown 报告

用 `report-template.md` 写入 `reports/YYYY-Www.md`。Markdown 与 JSON 必须同源：

- highlights 的名称、证据等级、`is_update`、主要链接一致。
- Markdown 可扩展分析正文，但不得引入 JSON 中没有来源支撑的新事实。
- 所有事实仍需附链接，不要只写“据 GitHub 显示”。

## 8. 更新 ledger

对每个 highlight：

- 新条目：追加完整 ledger item。
- 重大更新：更新对应 item 的 `last_updates`，并刷新 `state_snapshot`。
- 简讯不强制写入 ledger，除非它是明确值得后续去重追踪的资产。

`state_snapshot` 用一句可读文本记录采集时关键状态，例如：

```text
2026-07-02T09:43+08:00 GitHub page: 117k stars, 10.4k forks, latest release v0.12.3 on 2026-07-01.
```

## 9. 校验与提交

1. 解析 JSON。
2. 校验必填字段与枚举。
3. 对比 Markdown 和 JSON highlights。
4. 确认禁止范围未改动：`docs/prds/`、`docs/specs/`、`site/`。
5. `git status --short` 检查改动范围。
6. 提交信息使用（替换为当期 ISO 周）：

```text
docs: add YYYY-Www weekly issue
```

