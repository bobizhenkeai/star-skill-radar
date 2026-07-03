# 数据契约 v2.3（docs/specs/data-contract.md）

> 目的：解耦「SOP 体系」与「HTML 情报站」两条并行开发线。双方以本契约为接口；字段可由实施窗口提出修订，经架构师确认后更新版本号。
>
> v2 变更（2026-07-02）：发布节奏由每周改为**每日**。周期标识从 ISO 周（`YYYY-Www`）改为日期（`YYYY-MM-DD`），涉及文件名与下列字段。存量首期 `2026-W27` 三件套由 SOP 线迁移为日期命名，仓库中不保留周命名文件。
>
> v2.1 变更（2026-07-02）：新增**日期清单** `data/issues/index.json`（见第 2.1 节），替代站点对历史日期的逐日探测。每日运行方每次产出新一期时必须同步更新该清单。
>
> v2.2 变更（2026-07-03）：为情报站 overview「今日摘要」层新增**概览一句话**能力（见第 2.2 节）。highlights 新增可选字段 `gist`；briefs 的 `one_liner` 明确内容规范（描述先行、去采集时间前缀）。`gist` 为可选、向前兼容——站点缺失时降级为对 `summary` 的语义提炼。存量 `2026-07-02`/`2026-07-03` 两期按本节回填。
>
> v2.3 变更（2026-07-04）：overview 概览一句话能力**扩展至简讯**。briefs 新增可选字段 `gist`（看板专用自洽短句，无证据前缀/尾巴、不截断）；`one_liner` 仍为**详情简讯区**正文（可含 star 等证据）。`gist` 可选、向前兼容——站点缺失时降级为对 `one_liner` 的语义提炼（尽量剥离证据尾）。存量 `2026-07-02`/`2026-07-03` 两期为每条 brief 补 `gist`。

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
      "gist": "概览一句话（overview 层用；自洽短句、约 18–42 中文字符、不含采集时间/star 前缀；可选但推荐，见 §2.2）",
      "summary": "项目介绍（深度分析正文可在 Markdown 报告中更长）",
      "competitors": [{ "name": "竞品名", "link": "URL", "verdict": "对比结论一句话" }],
      "recommendation": "推荐理由（解释高星合理性）",
      "usage_paradigm": "最佳使用范式说明",
      "stage_tags": ["review"],
      "is_update": false,
      "links": ["URL"]
    }
  ],
  "briefs": [{ "name": "简讯条目", "gist": "概览一句话（overview 简讯层用；自洽短句、约 18–42 中文字符、无证据前缀/尾巴；可选但推荐，见 §2.2）", "one_liner": "详情简讯区正文（描述先行、自洽；star 等证据置句尾，见 §2.2）", "link": "URL" }],
  "source_gaps": ["本期缺失的来源及原因（无则空数组）"]
}
```

## 2.2 overview 概览字段规范（v2.2；v2.3 扩展至简讯）

情报站首屏「今日摘要」层需要**一眼可读、自洽完整**的一句话，而不是对正式介绍的截断。为此约定：

**highlights[].gist（新增，可选但推荐）**
- 定位：overview 层专用的一句话概览；`summary` 仍是卡片「项目介绍」的较长正文，二者分工，不互相替代。
- 内容：一个**自洽的短句**，从「它是什么 / 为什么重要 / 今天变了什么」中**取其一**（不要三者并陈）；关键区分词前置。
- 长度：约 **18–42 个中文字符**，单句；确保在移动端 1–2 行内**完整读完**，不需要再截断。
- 禁止：以「采集时间 …」「GitHub API 显示 … stars」等采集/证据前缀开头（这些属于 `evidence_notes`）。
- 事实纪律：`gist` 是对已有 `summary` 的提炼改写，**不得引入 `summary`/`evidence_notes` 之外的新事实**。

**briefs[].gist（v2.3 新增，可选但推荐）**
- 定位：overview 简讯层专用的一句话概览；与 highlights 的 `gist` 同理分工，`one_liner` 保留为详情简讯区正文，二者不互相替代。
- 内容：一个**自洽短句**，说清「它是什么 / 为什么值得看」其一；关键区分词前置。
- 长度：约 **18–42 个中文字符**，单句；移动端 1–2 行内**完整读完**，不需要再截断。
- 禁止：以「采集时间 …」「GitHub … stars」等采集/证据前缀开头，或在句尾堆叠 star/license/release 等证据（证据留给 `one_liner`）。
- 事实纪律：`gist` 是对已有 `one_liner` 的提炼改写，**不得引入 `one_liner` 之外的新事实**。

**briefs[].one_liner（详情简讯区正文，schema 不变）**
- 写成**描述先行**的自洽一句话：先说"这是什么/为什么值得看"，star 等证据信息**置于句尾**且从简。
- **不得**以「采集时间 …。」前缀开头（采集时间不进入展示文案）。
- 用于详情「简讯」区正文；overview 简讯文案优先用 `gist`（见消费方约定）。

**消费方（站点）约定**
- overview 的 highlight 概览文案：有 `gist` 用 `gist`；缺失则降级为对 `summary` 的语义提炼（现有兜底逻辑）。
- overview 的 brief 概览文案：有 `gist` 用 `gist`（不截断）；缺失则降级为对 `one_liner` 的语义提炼（截断前尽量剥离证据尾）。
- 详情「简讯」区正文：始终使用 `one_liner`（含证据），不受 `gist` 影响。
- 站点必须容忍 `gist` 缺失（向前/向后兼容）；`gist` 存在时不得再对其做截断。

**存量回填**
- `2026-07-02`、`2026-07-03` 两期：为每个 highlight 补 `gist`、**为每条 brief 补 `gist`（v2.3）**，并保持 briefs 的 `one_liner` 为描述先行；均只依据各条目既有 `summary`/`evidence_notes`/`one_liner` 改写，不新增事实、不改动其它字段。

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
