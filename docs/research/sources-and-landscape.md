# 每周自动捕捉 AI 编程技术资产情报：来源与生态调研
- 更新时间：2026-07-02（UTC+8）
- 报告目的：为“每周自动捕捉 AI 编程技术资产情报”的自动化项目建立来源地图、生态清单、检索策略与可信度校验框架。
- 覆盖范围：
  - 技术资产：skills、MCP servers、rules、hooks、subagents、提示词库
  - 工作范式：harness 工程、agent loop、spec-driven development、vibe coding 最佳实践
- 数据口径：
  - GitHub `stars`、`forks`、`updated_at`、`pushed_at` 均于 2026-07-02 通过 GitHub REST API 实时抓取
  - 官方 docs / blog / changelog / spec 页面均通过实时网页抓取或官方站内检索获取
- 证据等级：
  - A：官方文档、官方博客、官方规范、官方 API 文档
  - B：高星 GitHub 官方仓库或高星社区实现/清单
  - C：第三方聚合或可视化服务，仅作辅助，不单独作为结论依据
## 0. 关键判断

- 这个赛道在 2026-07 已形成较清晰的三层结构：官方产品面、开放规范/注册表、社区高星资产面。
- 对周更情报项目来说，最重要的不是“找最多仓库”，而是把官方变更面、生态发现面、可信同步面分开。
- `stars` 仍然有价值，但在本赛道必须联合作者背景、更新节奏、是否进入官方目录/registry、issue/release 质量一起看。
- MCP 与 Agent Skills 已出现比较明确的标准化轨迹；rules、hooks、subagents 则仍然更依赖产品私有约定和社区清单。
- “vibe coding 最佳实践”的高权威来源明显少于 MCP / GitHub API / Agent Skills 规范；官方工程博客与高星方法仓库更值得优先监控。
- 如果项目目标是“每周自动跑”，优先级应是：官方 changelog > 官方仓库 > 官方 registry / spec > 社区清单 > 第三方趋势工具。

## 1. 官方与权威来源清单

### 1.1 Anthropic

- [Claude Code Overview](https://docs.anthropic.com/en/docs/claude-code/overview)：Claude Code 总览入口，适合做产品能力基线页。
  更新特征：稳定入口页，结构变化通常滞后于 changelog 但权威；获取方式：网页抓取；等级：A。

- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)：Anthropic 官方 skills 说明页，明确提到 Agent Skills open standard。
  更新特征：中频，通常伴随 skills frontmatter、调用方式、subagent 集成变化而更新；获取方式：网页抓取；等级：A。

- [Claude Code Sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)：Anthropic 官方 subagents 说明页。
  更新特征：中频，适合跟踪字段、隔离模式、skill preload 等行为变化；获取方式：网页抓取；等级：A。

- [Claude Code Changelog](https://code.claude.com/docs/en/changelog.md)：官方 release notes 汇总页，页面明确写明由 GitHub `CHANGELOG.md` 生成。
  更新特征：高频；2026-07-01 可见 `v2.1.198`，版本节奏接近每日/隔日；获取方式：网页抓取；等级：A。

- [Anthropic Engineering](https://www.anthropic.com/engineering)：工程长文入口，覆盖 skills、context engineering、evals、harness、安全等主题。
  更新特征：事件驱动但频率不低，2026 上半年已有多篇 Claude Code / agent 文章；获取方式：网页抓取；等级：A。

- [How we built Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)：自动审批/权限分类器的一手工程材料。
  更新特征：深度工程文，适合作为“agent autonomy 边界设计”长期参考；获取方式：网页抓取；等级：A。

### 1.2 OpenAI

- [Codex Changelog](https://developers.openai.com/codex/changelog)：Codex app / CLI / Remote / plugin / skill / SDK 变更的主入口。
  更新特征：高频；页面列出 `2026-07-01`、`2026-06-29`、`2026-06-25`、`2026-06-22` 等连续节点；获取方式：网页抓取；等级：A。

- [Codex Skills](https://developers.openai.com/codex/skills)：OpenAI 官方 skills 说明页。
  更新特征：中频，技能 authoring、plugin 分发、repo-local workflow 变化时会更新；获取方式：网页抓取；等级：A。

- [Codex SDK](https://developers.openai.com/codex/sdk)：程序化控制 Codex 的官方入口。
  更新特征：中频，与 SDK、sandbox、runtime 能力变化同步；获取方式：网页抓取；等级：A。

- [Codex Blog Topic Index](https://developers.openai.com/blog/topic/codex)：Codex 专题博客入口。
  更新特征：专题型，2026H1 持续出现 skills、Remote、long-horizon、evals 文章；获取方式：网页抓取；等级：A。

- [OpenAI Engineering](https://openai.com/news/engineering/)：OpenAI 工程文章总入口。
  更新特征：中高频；2026 上半年含 sandbox、Codex、agent workflow、Responses API 文章；获取方式：网页抓取；等级：A。

- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)：围绕 harness engineering、repo-as-system-of-record、execution plans 的关键长文。
  更新特征：深度方法文，适合做长期基准；获取方式：网页抓取；等级：A。

- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)：OpenAI 对 agent loop 与 context management 的官方拆解。
  更新特征：系列文章的一部分，适合持续跟踪 loop 设计语言；获取方式：网页抓取；等级：A。

### 1.3 Cursor

- [Cursor Docs](https://cursor.com/docs)：Cursor 文档主入口。
  更新特征：稳定入口；细节变化需结合 changelog 才容易观察；获取方式：网页抓取；等级：A。

- [Cursor Changelog](https://cursor.com/changelog)：Cursor 产品与 agent 能力发布日志。
  更新特征：高频；2026-06-17、06-18、06-22、06-29、06-30 持续更新；获取方式：网页抓取；等级：A。

- [Cursor Blog](https://cursor.com/blog)：产品、研究、客户案例、agent 经验文聚合页。
  更新特征：中高频；2026-06 可见 cloud agents、Auto-review、Design Mode、SDK 相关内容；获取方式：网页抓取；等级：A。

- [Cursor CLI Changelog](https://cursor.com/docs/cli/changelog)：CLI 维度变更日志。
  更新特征：高频，适合抓 CLI 专属行为变化；获取方式：网页抓取；等级：A。

### 1.4 MCP（Model Context Protocol）

- [MCP Stable Specification](https://modelcontextprotocol.io/specification/2025-11-25/index)：当前稳定规范基线。
  更新特征：低频但高影响；页面明确提供 `llms.txt` 索引；获取方式：网页抓取；等级：A。

- [MCP Draft Changelog](https://modelcontextprotocol.io/specification/draft/changelog)：草案与正式版之间差异的官方清单。
  更新特征：规范演进期尤为活跃，适合监控协议 drift；获取方式：网页抓取；等级：A。

- [MCP Blog](https://blog.modelcontextprotocol.io/)：维护者发布 release candidate、extensions、治理更新的官方博客。
  更新特征：事件驱动型；获取方式：网页抓取；等级：A。

- [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry)：官方 registry 的实现与文档仓库。
  更新特征：中高频；适合观察 registry schema 与发现机制变化；获取方式：GitHub REST API + 页面抓取；等级：A/B。

- [Official Registry API Doc](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md)：官方 registry API 文档。
  更新特征：对 `updated_since`、`search`、`version` 等增量同步参数尤其关键；获取方式：GitHub 页面抓取；等级：A。

### 1.5 Agent Skills 开放规范

- [Agent Skills Overview](https://agentskills.io/home)：开放规范总览页，说明 skill 是目录 + `SKILL.md` + progressive disclosure。
  更新特征：稳定入口页；获取方式：网页抓取；等级：A。

- [Agent Skills Specification](https://agentskills.io/specification)：字段与目录结构的正式规范页。
  更新特征：低频但高影响，适合监控 `name`、`description`、`compatibility`、`allowed-tools` 等字段变化；获取方式：网页抓取；等级：A。

- [agentskills/agentskills](https://github.com/agentskills/agentskills)：规范与文档的官方 GitHub 仓库。
  更新特征：中频，可作为 issue / PR / examples 层面的补充观察面；获取方式：GitHub REST API + 页面抓取；等级：A/B。

- [Best practices for skill creators](https://agentskills.io/skill-creation/best-practices)：开放规范方给出的技能编写建议。
  更新特征：比纯规范更偏经验层，适合抓“推荐实践”的变化；获取方式：网页抓取；等级：A。

### 1.6 GitHub 平台与 API 文档

- [Searching for repositories](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories)：仓库搜索限定词官方文档。
  作用重点：`in:`、`topic:`、`repo:`、`stars:`；获取方式：网页抓取；等级：A。

- [Searching topics](https://docs.github.com/en/search-github/searching-on-github/searching-topics)：topic 搜索官方文档。
  作用重点：`is:featured`、`is:curated`、`repositories:n`；获取方式：网页抓取；等级：A。

- [Understanding the search syntax](https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax)：通用搜索语法文档。
  作用重点：`>n`、`<=n`、范围、排除符；获取方式：网页抓取；等级：A。

- [REST API: Search](https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28)：Search API 文档。
  作用重点：速率限制、分页、`incomplete_results`；获取方式：网页抓取；等级：A。

- [REST API: Repositories](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28)：仓库元数据入口。
  作用重点：`GET /repos/{owner}/{repo}`、topics、contributors；获取方式：网页抓取；等级：A。

- [REST API: Issues](https://docs.github.com/en/rest/issues/issues)：issue / PR 列表接口文档。
  作用重点：`sort=updated/comments`、`updated_at`、`comments`；获取方式：网页抓取；等级：A。

- [REST API: Releases](https://docs.github.com/rest/releases/releases)：release 接口文档。
  作用重点：`GET /repos/{owner}/{repo}/releases` 与 `.../latest`；获取方式：网页抓取；等级：A。

- [GraphQL: Repositories](https://docs.github.com/en/graphql/reference/repos)：GraphQL `Repository` 对象文档。
  作用重点：`stargazerCount`、`stargazers`、仓库图谱字段；获取方式：网页抓取；等级：A。

- [GraphQL: Users / StargazerEdge](https://docs.github.com/en/graphql/reference/users)：GraphQL `StargazerEdge.starredAt` 官方字段来源。
  作用重点：构造 star 时间线；获取方式：网页抓取；等级：A。

## 2. GitHub 高星生态盘点

- 说明：本节 star/fork/更新时间均来自 2026-07-02 的 GitHub REST API 实时抓取。
- 说明：作者背景优先采用 owner profile 自报；官方组织按组织属性标注。

### 2.1 宿主 / coding-agent / harness 框架

- [`anthropics/claude-code`](https://github.com/anthropics/claude-code)：135,338 stars；`pushed_at=2026-07-01`。
  背景：Anthropic 官方组织；定位：Claude Code 官方宿主，是 Anthropic agent 能力变更的第一手开源面。

- [`openai/codex`](https://github.com/openai/codex)：94,901 stars；`pushed_at=2026-07-02`。
  背景：OpenAI 官方组织；定位：Codex CLI / app-server / plugin / MCP / skills 的代码面。

- [`google-gemini/gemini-cli`](https://github.com/google-gemini/gemini-cli)：105,701 stars；`pushed_at=2026-07-02`。
  背景：Google Gemini 官方组织；定位：Claude Code / Codex 之外的官方终端 agent 竞品。

- [`anomalyco/opencode`](https://github.com/anomalyco/opencode)：181,310 stars；`pushed_at=2026-07-02`。
  背景：Anomaly 官方组织；定位：高热度开源 coding agent 宿主，适合做开放生态竞品观察。

- [`OpenHands/OpenHands`](https://github.com/OpenHands/OpenHands)：79,031 stars；`pushed_at=2026-07-02`。
  背景：OpenHands 官方组织；定位：更偏通用 agentic development 平台，与 coding-agent 宿主有交集。

- [`cline/cline`](https://github.com/cline/cline)：64,189 stars；`pushed_at=2026-07-01`。
  背景：Cline 官方组织；定位：IDE extension / CLI / SDK 一体的自主 coding agent。

- [`Aider-AI/aider`](https://github.com/Aider-AI/aider)：46,926 stars；`pushed_at=2026-05-22`。
  背景：Aider AI 官方组织；定位：终端式 AI pair programming 老牌项目。

- [`RooCodeInc/Roo-Code`](https://github.com/RooCodeInc/Roo-Code)：24,303 stars；`archived=true`；`pushed_at=2026-05-15`。
  背景：官方 GitHub 组织；定位：历史影响仍在，但作为“新信号源”的权重应下调。

### 2.2 Skills / rules / subagents / prompts 资产

- [`anthropics/skills`](https://github.com/anthropics/skills)：157,353 stars；`pushed_at=2026-07-01`。
  背景：Anthropic 官方组织；定位：官方技能样例库，是 skill 结构与命名的重要风向标。

- [`openai/skills`](https://github.com/openai/skills)：23,122 stars；`pushed_at=2026-06-24`。
  背景：OpenAI 官方组织；定位：Codex 技能目录，可与 Anthropic 官方技能库直接对照。

- [`agentskills/agentskills`](https://github.com/agentskills/agentskills)：21,351 stars；`pushed_at=2026-07-01`。
  背景：Agent Skills 官方组织；定位：开放规范仓库，不是内容库，而是格式与文档源。

- [`mattpocock/skills`](https://github.com/mattpocock/skills)：153,056 stars；`pushed_at=2026-07-01`。
  背景：Matt Pocock；profile 标注 `Total TypeScript`、`Ex-Vercel`；定位：个人品牌驱动的高传播 skill 库。

- [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills)：68,397 stars；`pushed_at=2026-06-28`。
  背景：Addy Osmani；profile 标注 `Google`；定位：高信号工程技能仓，适合作为社区最佳实践样本。

- [`hesreallyhim/awesome-claude-code`](https://github.com/hesreallyhim/awesome-claude-code)：47,726 stars；`pushed_at=2026-06-29`。
  背景：个人维护者；profile 标注 `Really Engineering`；定位：Claude Code 周边资产最重要的清单之一。

- [`PatrickJS/awesome-cursorrules`](https://github.com/PatrickJS/awesome-cursorrules)：40,182 stars；`pushed_at=2026-05-30`。
  背景：PatrickJS；profile 标注 PwC、Qwik core 等经历；定位：Cursor rules 赛道代表性社区目录。

- [`VoltAgent/awesome-claude-code-subagents`](https://github.com/VoltAgent/awesome-claude-code-subagents)：22,686 stars；`pushed_at=2026-06-24`。
  背景：VoltAgent 组织；profile 标注 “AI Agent Engineering Platform”；定位：subagents 细分赛道目录。

- [`VoltAgent/awesome-agent-skills`](https://github.com/VoltAgent/awesome-agent-skills)：27,043 stars；`pushed_at=2026-06-30`。
  背景：VoltAgent 官方组织；定位：跨 Claude Code / Codex / Cursor / Gemini CLI 的技能聚合目录。

- [`f/prompts.chat`](https://github.com/f/prompts.chat)：164,600 stars；`pushed_at=2026-07-01`。
  背景：个人维护者；定位：泛 LLM prompt library，非纯 coding-agent 仓库，但仍代表“提示词库”维度的上游供给。

### 2.3 MCP 核心实现与发现面

- [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers)：87,935 stars；`pushed_at=2026-06-29`。
  背景：MCP 官方组织；定位：官方 server examples，适合观察官方覆盖面与弃用方向。

- [`modelcontextprotocol/typescript-sdk`](https://github.com/modelcontextprotocol/typescript-sdk)：12,770 stars；`pushed_at=2026-07-01`。
  背景：MCP 官方组织；定位：TypeScript SDK，是协议 breaking change 的高价值入口。

- [`punkpeye/awesome-mcp-servers`](https://github.com/punkpeye/awesome-mcp-servers)：90,130 stars；`pushed_at=2026-06-26`。
  背景：Frank Fiegel；profile 标注 `Glama`、`Engineer turned founder`；定位：最重要的社区 MCP server 清单之一。

- [`modelcontextprotocol/registry`](https://github.com/modelcontextprotocol/registry)：6,974 stars；`pushed_at=2026-07-01`。
  背景：MCP 官方组织；定位：虽然 stars 不高，但 registry 权威性高于清单仓库。

- [`punkpeye/awesome-mcp-clients`](https://github.com/punkpeye/awesome-mcp-clients)：6,503 stars；`pushed_at=2026-06-07`。
  背景：个人维护者；定位：如未来监控范围扩展到“宿主/客户端”，该仓库有补充价值。

### 2.4 方法论 / meta-harness / workflow 仓库

- [`github/spec-kit`](https://github.com/github/spec-kit)：117,117 stars；`pushed_at=2026-07-01`。
  背景：GitHub 官方组织；定位：spec-driven development + AI coding agent integration 的高权威仓库。

- [`obra/superpowers`](https://github.com/obra/superpowers)：243,470 stars；`pushed_at=2026-07-01`。
  背景：Jesse Vincent；profile 标注 `Prime Radiant`；定位：高传播的 agentic skills framework / methodology 仓库。

- [`affaan-m/ECC`](https://github.com/affaan-m/ECC)：224,671 stars；`pushed_at=2026-07-01`。
  背景：Affaan Mustafa；profile 中直接标注 `ECC-Tools`；定位：强调 harness optimization、memory、安全与 research-first workflow。

- [`shanraisshan/claude-code-best-practice`](https://github.com/shanraisshan/claude-code-best-practice)：61,764 stars；`pushed_at=2026-07-01`。
  背景：Shayan Rais；profile 标注 `Software Architect @ disrupt.com`；定位：直接连接“vibe coding”与“agentic engineering”。

- [`wshobson/agents`](https://github.com/wshobson/agents)：37,411 stars；`pushed_at=2026-06-29`。
  背景：Seth Hobson；profile 标注 `Senior AI Engineer`；定位：multi-harness plugin marketplace，兼具资产目录与方法库属性。

## 3. 同类竞品聚集的类别

- 宿主型 coding agents 是最拥挤的类别之一。
  - 官方阵营：Claude Code、Codex、Gemini CLI
  - 开源/社区阵营：OpenCode、Cline、Aider、OpenHands、Roo-Code（已归档）

- Skills 生态已经不是单一“仓库集合”，而是四层并存。
  - 官方样例库：`anthropics/skills`、`openai/skills`
  - 开放规范：`agentskills/agentskills`
  - 个人品牌技能库：`mattpocock/skills`、`addyosmani/agent-skills`
  - 聚合目录：`VoltAgent/awesome-agent-skills`

- MCP 生态的发现层是并行结构，不是单点真相源。
  - 官方规范/样例：`modelcontextprotocol/servers`、`typescript-sdk`
  - 官方 registry：`modelcontextprotocol/registry`
  - 社区清单：`awesome-mcp-servers`

- Rules / hooks / subagents 的标准化程度低于 MCP / skills。
  - Rules 更偏产品私有约定
  - Hooks 常散落在 methods / skill 仓库内部
  - Subagents 开始出现独立清单，但尚未形成统一 registry

- Prompt library 仍是“大而泛”的类别。
  - 高星 prompt 仓库很多，但并不都直接服务 coding-agent
  - 真正与工程工作流强耦合的“提示资产”，正在向 skills / rules / agent profiles 迁移

- 方法论仓库已经形成两条主要支线。
  - spec-driven：`github/spec-kit`
  - meta-harness / best-practice：`superpowers`、`ECC`、`claude-code-best-practice`

## 4. 可行的检索策略

### 4.1 从官方源反推社区生态

- 先抓官方 changelog / docs / engineering blog，再顺藤摸瓜抓其对应 GitHub 仓库和社区清单，通常噪声最低。
- 推荐先固定以下官方种子：
  - Anthropic：docs + changelog + engineering
  - OpenAI：codex changelog + skills + engineering
  - Cursor：blog + changelog + docs
  - MCP：spec + blog + registry
  - Agent Skills：spec + overview + official repo

### 4.2 GitHub repository search 的有效查询方式

- 查目录型项目：
  - `"awesome claude code" in:name,description,readme`
  - `"awesome mcp servers" in:name,description,readme`
  - 适用：快速找到生态总表
  - 局限：容易混入“泛 AI awesome”项目

- 查方法论与框架：
  - `"spec-driven development" in:name,description,readme`
  - `"agent skills" in:name,description,readme`
  - `("cursor rules" OR ".cursor/rules") in:name,description,readme`
  - 适用：发现概念型/方法型仓库
  - 局限：命中结果经常需要二次去噪

- 查按日期爆发的新项目：
  - `created:>=2026-06-25 stars:>50 archived:false`
  - `pushed:>=2026-06-25 stars:>100 topic:mcp`
  - 适用：找“本周刚出现”的仓库
  - 局限：对老仓库二次爆发不敏感

- 查官方组织：
  - `org:anthropics`
  - `org:openai`
  - `org:modelcontextprotocol`
  - `org:github`
  - 适用：低噪声、高权威
  - 局限：抓不到社区创新

### 4.3 Topic 与目录页联动

- topic 检索适合找标签规范的项目：
  - `topic:mcp`
  - `topic:mcp-servers`
  - `topic:agent-skills`
  - `topic:ai-agents`

- topic 的优势：
  - 对机器聚合更友好
  - 适合做每周固定查询

- topic 的劣势：
  - rules / hooks / subagents 类项目 often 不打 topic
  - 个人方法仓库的 topic 完整性差异很大

- 因此更可行的做法是：
  - topic 检索用于广撒网
  - awesome 清单 / registry 用于补漏
  - 官方组织仓库用于校准

### 4.4 Code search 的补充价值

- 对 skills：
  - `filename:SKILL.md`
  - `path:.agents/skills`
  - `path:.claude/skills`

- 对 Cursor rules：
  - `path:.cursor/rules`
  - `mdc`
  - `RULE.md`

- 对 hooks：
  - `hooks.json`
  - `pre-commit`
  - `agent_completed`
  - `agent_needs_input`

- 对 subagents：
  - `subagents`
  - `agents:`
  - `agentType`

- 注意事项：
  - GitHub Search 官方文档显示 search API 有单独速率限制
  - Search code 端点更严格，且认证要求更高
  - 周更任务更适合“少量高质量 code search + 本地缓存”

### 4.5 Awesome 列表、registry、官方目录的角色分工

- 官方 registry / official repo：
  - 更适合做可信同步源
  - 更适合做 schema / API / examples 变化监控

- Awesome 列表：
  - 更适合做新项目发现
  - 更适合观察分类扩张和社区热点

- 官方 skills / examples 仓库：
  - 更适合做“最佳实践样本集”
  - 更适合观察命名与结构演进

### 4.6 发现“本周新出现 / 新爆发”的可行路径

- 路径一：按 `created:` 窗口抓新仓库。
  - 优点：简单、稳
  - 缺点：抓不到老仓库二次爆发

- 路径二：对候选仓库做定期星数快照。
  - 做法：每日或每周抓 `GET /repos/{owner}/{repo}`
  - 产出：`delta_stars_7d`
  - 这是最容易审计的做法

- 路径三：GraphQL `StargazerEdge.starredAt`。
  - 优点：时间粒度最细
  - 缺点：分页重，对大仓库成本高

- 路径四：抓取 `https://github.com/trending?since=weekly`
  - 优点：更接近“本周热度”
  - 缺点：GitHub 官方文档未公开对应 REST/GraphQL 接口，HTML 更偏发现面而非稳定 API

- 路径五：MCP registry 增量同步。
  - 依据：官方 registry API 文档支持 `updated_since`
  - 适合：MCP server 新增/更新周报

- 路径六：第三方辅助工具。
  - `star-history.com`：适合人工复核 star 曲线，等级：C
  - `ecosyste.ms`：适合辅助看 repo / commits / issues 时间线，等级：C
  - 原则：辅助可用，核心结论回到 GitHub API 与官方页面

### 4.7 GitHub Search 的官方限制

- GitHub REST Search 文档显示：
  - 认证请求：大多数 search endpoints 每分钟最多 30 次
  - 未认证请求：每分钟最多 10 次
  - 单页最多 100 条
  - 响应可能出现 `incomplete_results=true`

- 这意味着周更任务不宜做：
  - 大范围、低限定词的宽搜
  - 高频轮询
  - 没有缓存的重复请求

- 更适合的方式是：
  - 固定查询模板
  - 固定观察面清单
  - 本地存档快照
  - 结果分层去重

## 5. 可信度验证信号

### 5.1 除 stars 外优先级较高的信号

- 作者身份 / 组织属性。
  - 获取：`GET /users/{login}`
  - 字段：`type`、`company`、`blog`、`bio`
  - 价值：区分官方组织、公司团队、个人品牌、创业团队

- 最近维护活跃度。
  - 获取：`GET /repos/{owner}/{repo}`
  - 字段：`updated_at`、`pushed_at`
  - 价值：比“总 stars”更能反映是否仍值得纳入周更面

- release 节奏。
  - 获取：`GET /repos/{owner}/{repo}/releases` 与 `.../latest`
  - 字段：`created_at`
  - 价值：可区分“持续发布的软件/规范”与“纯内容仓库”

- 贡献者广度。
  - 获取：`GET /repos/{owner}/{repo}/contributors`
  - 字段：`contributions`
  - 价值：判断是否单点维护

- issue / PR 互动质量。
  - 获取：`GET /repos/{owner}/{repo}/issues`
  - 字段：`updated_at`、`comments`
  - 价值：看维护者是否回复、讨论是否有实质内容

- 是否被官方目录 / 官方 registry / 官方 examples 收录。
  - 获取：官方 docs、registry、official repo 页面
  - 价值：提高项目的可验证性与长期可发现性

- license 与可复用性。
  - 获取：`GET /repos/{owner}/{repo}`
  - 字段：`license`
  - 价值：对企业内自动同步和复用尤其关键

- 是否归档。
  - 获取：`GET /repos/{owner}/{repo}`
  - 字段：`archived`
  - 价值：归档仓库不宜继续当作新信号源

- topic 标注完整性。
  - 获取：`GET /repos/{owner}/{repo}` 或 `GET /repos/{owner}/{repo}/topics`
  - 价值：topic 完整的项目更适合自动聚合

### 5.2 GitHub API 到信号的映射

- 仓库基础热度与元数据：
  - API：`GET /repos/{owner}/{repo}`
  - 字段：`stargazers_count`、`forks_count`、`subscribers_count`、`open_issues_count`、`topics`、`updated_at`、`pushed_at`

- 贡献者结构：
  - API：`GET /repos/{owner}/{repo}/contributors`
  - 字段：`contributions`

- 提交节奏：
  - API：`GET /repos/{owner}/{repo}/commits`
  - 参数：`since`、`until`

- issue 健康度：
  - API：`GET /repos/{owner}/{repo}/issues`
  - 参数：`sort=updated`、`sort=comments`
  - 字段：`updated_at`、`comments`

- release 节奏：
  - API：`GET /repos/{owner}/{repo}/releases`、`GET /repos/{owner}/{repo}/releases/latest`
  - 字段：`created_at`

- star 时间线：
  - API：GraphQL `StargazerEdge.starredAt`
  - 用途：构造更精细的 star 增长曲线

### 5.3 更稳妥的组合判定方式

- 官方组织 + 高频更新 + docs/changelog 完整。
  - 典型对象：`anthropics/claude-code`、`openai/codex`、`modelcontextprotocol/servers`
  - 解释：适合列为高优先级观察面

- 社区高星 + 高频 push + owner 背景清晰。
  - 典型对象：`mattpocock/skills`、`addyosmani/agent-skills`、`obra/superpowers`
  - 解释：适合列为社区风向标

- 清单仓库 + issue / PR 活跃。
  - 典型对象：`awesome-claude-code`、`awesome-mcp-servers`
  - 解释：更能反映生态发现效率，而非单个实现质量

- 官方 registry / official repo + 社区清单配对。
  - 典型对象：`modelcontextprotocol/registry` + `awesome-mcp-servers`
  - 解释：前者偏可信同步，后者偏广覆盖

## 6. 工作范式类信息源

### 6.1 Harness engineering / agent loop

- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
  - 类型：OpenAI 官方工程长文
  - 价值：解释 repo-as-system-of-record、execution plans、observability 进 agent loop 的做法
  - 等级：A

- [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
  - 类型：OpenAI 官方工程长文
  - 价值：直接讨论 harness、context crafting、agent loop 设计
  - 等级：A

- [How we built Claude Code auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode)
  - 类型：Anthropic 官方工程长文
  - 价值：适合跟踪权限分类、自动审批、恢复策略与安全边界
  - 等级：A

- [Anthropic Engineering](https://www.anthropic.com/engineering)
  - 类型：官方工程索引
  - 价值：可持续提供 harness、skills、context engineering、evals 相关长文
  - 等级：A

- [Cursor Blog](https://cursor.com/blog)
  - 类型：官方产品/研究博客
  - 价值：2026-06 已出现 cloud agents、Auto-review、self-driving codebases 等主题
  - 等级：A

### 6.2 Spec-driven development

- [github/spec-kit](https://github.com/github/spec-kit)
  - 类型：GitHub 官方仓库
  - 价值：当前最具代表性的 spec-driven + AI agent 工具体系之一
  - 等级：A/B

- [spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)
  - 类型：官方仓库内文档
  - 价值：把 spec-first 流程具体化为 agent 可执行步骤
  - 等级：A/B

- [Codex Harness Engineering](https://openai.com/index/harness-engineering/)
  - 类型：官方工程文
  - 价值：虽然不只谈 spec-driven，但明确强调 plan、docs、execution plans 与质量门槛
  - 等级：A

### 6.3 Vibe coding 与工程化最佳实践

- [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
  - 类型：高星社区方法仓库
  - 价值：repo 描述直接写出 “from vibe coding to agentic engineering”
  - 等级：B

- [obra/superpowers](https://github.com/obra/superpowers)
  - 类型：高星社区方法仓库
  - 价值：兼有 skills framework 与 methodology 双重属性
  - 等级：B

- [affaan-m/ECC](https://github.com/affaan-m/ECC)
  - 类型：高星社区 meta-harness 仓库
  - 价值：强调 memory、安全、research-first workflow 与 harness performance
  - 等级：B

- [mattpocock/skills](https://github.com/mattpocock/skills)
  - 类型：高星技能仓库
  - 价值：体现“个人经验 -> skill 包 -> 社区分发”的新型知识资产路径
  - 等级：B

- [Using skills to accelerate OSS maintenance](https://developers.openai.com/blog/skills-agents-sdk)
  - 类型：OpenAI 官方博客
  - 价值：把 skills、GitHub Actions、repo maintenance、review workflow 连接起来
  - 等级：A

### 6.4 一个必须单独说明的事实

- “vibe coding best practices” 的高权威文档源少于 MCP / GitHub API / Agent Skills。
- 该主题的大量流行内容分布在个人博客、课程、社交媒体与视频中。
- 按本报告证据约束，这些内容不作为核心证据源。
- 因此，若自动化项目要覆盖该主题，建议把它视为“社区方法论信号”，而不是“标准化规范信号”。

## 7. 局限与使用边界

- GitHub stars 容易受传播效应、名人效应、清单仓库效应影响。
- 高星清单仓库不等于高质量底层实现。
- Search API 有速率限制与 `incomplete_results` 风险，不适合做无缓存全量宽搜。
- Trending 页适合做“发现”，不适合做唯一结构化事实源。
- rules / hooks / subagents 命名未完全标准化，自动检索噪声高于 MCP / skills。
- prompt library 与 skill library 的边界正在模糊，分类时应允许交叉标签。
- 对企业实际可复用性的判断，仍需额外看 license、release、docs、官方收录状态。
