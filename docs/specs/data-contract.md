# 数据契约 v2.1（docs/specs/data-contract.md）

> 目的：解耦「SOP 体系」与「HTML 情报站」两条并行开发线。双方以本契约为接口；字段可由实施窗口提出修订，经架构师确认后更新版本号。
>
> v2 变更（2026-07-02）：发布节奏由每周改为**每日**。周期标识从 ISO 周（`YYYY-Www`）改为日期（`YYYY-MM-DD`），涉及文件名与下列字段。存量首期 `2026-W27` 三件套由 SOP 线迁移为日期命名，仓库中不保留周命名文件。
>
> v2.1 变更（2026-07-02）：新增**日期清单** `data/issues/index.json`（见第 2.1 节），替代站点对历史日期的逐日探测。每日运行方每次产出新一期时必须同步更新该清单。

## 1. 已收录清单 `data/ledger.json`

JSON 数组，每个元素代表一个已收录条目：

```json
{
  "id": "owner/repo 或规范化 URL（唯一主键，用于去重）",
  "name": "展示名称",
  "type": "skill | mcp | rules | hooks | subagent | prompt-lib | paradigm",
  "evidence_tier": "official | community-verified",
  "first_reported": "2026-07-02",
  "last_updates": [{ "date": "2026-07-15", "note": "重大更新简述" }],
  "state_snapshot": "收录时的版本/星数快照，用于后续重大更新判断",
  "stage_tags": ["requirements", "design", "implementation", "review", "testing", "ops"],
  "links": ["主链接", "其他证据链接"]
}
```

## 2. 每期结构化数据 `data/issues/YYYY-MM-DD.json`

```json
{
  "date": "2026-07-02",
  "generated_at": "ISO 8601 时间戳",
  "highlights": [
    {
      "id": "同 ledger 主键",
      "name": "名称",
      "type": "同 ledger type 枚举",
      "evidence_tier": "official | community-verified",
      "evidence_notes": "证据要点（star 数/作者背景/机构背书等，含数据采集时间）",
      "summary": "项目介绍（深度分析正文可在 Markdown 报告中更长）",
      "competitors": [{ "name": "竞品名", "link": "URL", "verdict": "对比结论一句话" }],
      "recommendation": "推荐理由（解释高星合理性）",
      "usage_paradigm": "最佳使用范式说明",
      "stage_tags": ["review"],
      "is_update": false,
      "links": ["URL"]
    }
  ],
  "briefs": [{ "name": "简讯条目", "one_liner": "一句话", "link": "URL" }],
  "source_gaps": ["本期缺失的来源及原因（无则空数组）"]
}
```

## 2.1 日期清单 `data/issues/index.json`

已发布期数的权威清单，JSON 数组，元素为日期字符串，顺序不作保证（消费方自行排序）：

```json
["2026-07-02", "2026-07-03"]
```

- **生产方（SOP / 每日运行）**：每次产出新一期时，将当日日期加入清单（幂等，已存在则不重复）；清单必须与 `data/issues/` 下实际存在的 JSON 文件一致。
- **消费方（站点）**：以清单为发现历期的主渠道，不得对全历史做逐日探测；清单缺失或滞后时的降级策略由站点自行决策（如仅对极小的近期窗口做补充探测）。

## 3. Markdown 报告 `reports/YYYY-MM-DD.md`

- 文件名：日期命名，如 `reports/2026-07-02.md`。
- 内容结构与 `data/issues/` 同源（同一期的 JSON 与 Markdown 由同一次运行产出，内容一致）。
- 版式模板由 SOP 线定义于 `docs/sop/`。
- 日报体量约束：重点条目 1-5 个（可少于周报的 3-5），无合格条目时使用"本期无重点条目"模板。

## 4. 消费方约定

- HTML 情报站只读消费 `data/issues/*.json` 与 `data/ledger.json`，不解析 Markdown。
- 站点需容忍字段缺失（如 `competitors` 为空数组）与未来新增字段（向前兼容）。
- 枚举值以本契约为准；`stage_tags` 的中文展示映射由站点自行决定。
- 新一期 JSON（日期命名）加入后，站点无需改代码即可展示，含跨月、跨年边界。
