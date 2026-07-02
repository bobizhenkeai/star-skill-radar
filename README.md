# Star-Skill Radar — AI 技术资产情报雷达

每周自动捕捉 GitHub 高星 AI 技术资产（skills / MCP servers / rules / hooks / subagents / 提示词库）与工作范式（harness 工程、agent loop、spec-driven、vibe coding）情报，产出中文精选深度报告。

## 交付物

- `reports/YYYY-Www.md`：每周 Markdown 报告（3-5 个重点条目深度分析 + 简讯），git 归档
- HTML 情报站（`site/`，GitHub Pages 托管）：历期索引、主题/阶段筛选，移动端友好
- `data/ledger.json`：已收录清单（历史去重，重大更新追踪）

## 使用边界（请先阅读）

| 问题 | 答案 |
|---|---|
| 需要常开 Cursor / 电脑吗？ | **不需要**。定时任务由 Cursor Automations 在云端（Cloud Agent）执行 |
| 前提条件 | 仓库推送至 GitHub 并授权 Cursor 的 GitHub 集成；Cloud Agent 运行消耗 Cursor 账户用量额度 |
| 只能在 Cursor 里看吗？ | **不是**。可在 ① Cursor 内 ② GitHub 网页/手机 App ③ GitHub Pages HTML 情报站（手机浏览器，推荐移动端入口）阅读 |
| 能远程推送吗？ | Automations 原生支持 Slack 通知；微信/邮件需后续扩展，本期不含 |
| 公开性 | GitHub Pages 免费托管 = HTML 站公开可访问；要求完全私有则移动端改用 GitHub App 阅读 |

## 文档索引

- 需求：`docs/prds/star-skill-radar-v1.0-prd.md`
- 数据契约：`docs/specs/data-contract.md`
- 项目约定：`AGENTS.md` · 进度路线：`todolist.md`
