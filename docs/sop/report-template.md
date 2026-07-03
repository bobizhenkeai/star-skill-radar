# 日报 Markdown 模板

文件路径：`reports/YYYY-MM-DD.md`

```markdown
# Star-Skill Radar 日报 YYYY-MM-DD

生成时间：YYYY-MM-DDTHH:mm:ss+08:00

## 本期结论

- 本期重点条目：N 个
- 官方/权威：N 个
- 社区验证：N 个
- 来源缺口：N 个

## 重点条目

### 1. 名称

- 类型：skill | mcp | rules | hooks | subagent | prompt-lib | paradigm
- 证据等级：official | community-verified
- 更新状态：新收录 | 重大更新追踪
- 适用阶段：requirements / design / implementation / review / testing / ops
- 关键来源：[主链接](URL)；[证据链接](URL)

**证据要点**：写 star 数、作者/组织、版本/日期、官方背书、采集时间。不要写无来源事实。

**项目介绍**：说明它是什么，解决什么问题。

**竞品/替代项**：

- [竞品名](URL)：一句话结论。

**推荐理由**：解释为什么值得进入本期重点，尤其要解释高星或官方信号的合理性。

**最佳使用范式**：说明在 AI 开发周期中如何使用，落到具体阶段和动作。

## 简讯

- [名称](URL)：描述先行的一句话。

## 来源缺口

- 无。
```

## 本期无重点条目模板

当没有条目达到准入门槛时使用：

```markdown
# Star-Skill Radar 日报 YYYY-MM-DD

生成时间：YYYY-MM-DDTHH:mm:ss+08:00

## 本期结论

本期未发现同时满足可信度门槛、去重规则和主题范围的新重点条目；不硬凑 highlights。已验证但不足以深度分析的信号列入简讯或来源缺口。

## 重点条目

本期无重点条目。

## 简讯

- [名称](URL)：描述先行的一句话。

## 来源缺口

- 来源名：失败原因；是否有替代来源。
```

## JSON 到 Markdown 映射

| JSON 字段 | Markdown 位置 |
|---|---|
| `date` | H1 日期 |
| `generated_at` | 生成时间 |
| `highlights[].name` | 重点条目标题 |
| `highlights[].type` | 类型 |
| `highlights[].evidence_tier` | 证据等级 |
| `highlights[].evidence_notes` | 证据要点 |
| `highlights[].gist` | 不直接进入 Markdown；仅供站点 overview「今日摘要」使用，不替代 `summary` |
| `highlights[].summary` | 项目介绍 |
| `highlights[].competitors` | 竞品/替代项 |
| `highlights[].recommendation` | 推荐理由 |
| `highlights[].usage_paradigm` | 最佳使用范式 |
| `highlights[].stage_tags` | 适用阶段 |
| `highlights[].is_update` | 更新状态 |
| `highlights[].links` | 关键来源 |
| `briefs[].name/link/one_liner` | 简讯 |
| `source_gaps` | 来源缺口 |

Markdown 可以比 JSON 有更自然的中文段落，但不得引入未经链接支撑的新事实。
