# 数据契约 v1（docs/specs/data-contract.md）

> 目的：解耦「SOP 体系」与「HTML 情报站」两条并行开发线。双方以本契约为接口；字段可由实施窗口提出修订，经架构师确认后更新版本号。

## 1. 已收录清单 `data/ledger.json`

JSON 数组，每个元素代表一个已收录条目：

```json
{
  "id": "owner/repo 或规范化 URL（唯一主键，用于去重）",
  "name": "展示名称",
  "type": "skill | mcp | rules | hooks | subagent | prompt-lib | paradigm",
  "evidence_tier": "official | community-verified",
  "first_reported": "2026-W27",
  "last_updates": [{ "week": "2026-W30", "note": "重大更新简述" }],
  "state_snapshot": "收录时的版本/星数快照，用于后续重大更新判断",
  "stage_tags": ["requirements", "design", "implementation", "review", "testing", "ops"],
  "links": ["主链接", "其他证据链接"]
}
```

## 2. 每期结构化数据 `data/issues/YYYY-Www.json`

```json
{
  "week": "2026-W27",
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

## 3. Markdown 报告 `reports/YYYY-Www.md`

- 文件名：ISO 周编号，如 `reports/2026-W27.md`。
- 内容结构与 `data/issues/` 同源（同一期的 JSON 与 Markdown 由同一次运行产出，内容一致）。
- 版式模板由 SOP 窗口定义于 `docs/sop/`。

## 4. 消费方约定

- HTML 情报站只读消费 `data/issues/*.json` 与 `data/ledger.json`，不解析 Markdown。
- 站点需容忍字段缺失（如 `competitors` 为空数组）与未来新增字段（向前兼容）。
- 枚举值以本契约为准；`stage_tags` 的中文展示映射由站点自行决定。
