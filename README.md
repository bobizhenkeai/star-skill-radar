# Star-Skill Radar — AI 技术资产情报雷达

每日自动捕捉 GitHub 高星 AI 技术资产（skills / MCP servers / rules / hooks / subagents / 提示词库）与工作范式（harness 工程、agent loop、spec-driven、vibe coding）情报，产出中文精选深度报告。

## 永久访问入口（请收藏）

微信推送里的链接可能有时效；**下面这个地址长期有效**，可随时在浏览器或微信中打开，查看全部历史日报：

**https://bobizhenkeai.github.io/star-skill-radar/site/**

建议：手机浏览器打开后「添加到桌面 / 收藏」，或把上述链接存到微信「文件传输助手」或备忘录，不依赖每次推送。

## 交付物

- `reports/YYYY-MM-DD.md`：每日 Markdown 报告（1-5 个重点条目深度分析 + 简讯），git 归档
- HTML 情报站（`site/`，GitHub Pages 托管）：历期索引、主题/阶段筛选，移动端友好
- `data/ledger.json`：已收录清单（历史去重，重大更新追踪）

## 使用边界（请先阅读）

| 问题 | 答案 |
|---|---|
| 需要常开 Cursor / 电脑吗？ | **不需要**。定时任务由 Cursor Automations 在云端（Cloud Agent）执行 |
| 前提条件 | 仓库推送至 GitHub 并授权 Cursor 的 GitHub 集成；Cloud Agent 运行消耗 Cursor 账户用量额度 |
| 只能在 Cursor 里看吗？ | **不是**。推荐永久入口：[情报站](https://bobizhenkeai.github.io/star-skill-radar/site/)（GitHub Pages，长期有效）；也可在 GitHub 网页/App 看 Markdown |
| 能远程推送吗？ | 微信经 Server酱 推送**更新提醒**；推送内链接可能过期，**请收藏情报站固定地址**（见上文） |
| 公开性 | GitHub Pages 免费托管 = HTML 站公开可访问；要求完全私有则移动端改用 GitHub App 阅读 |

## 文档索引

- 需求：`docs/prds/star-skill-radar-v1.0-prd.md`
- 数据契约：`docs/specs/data-contract.md`
- 项目约定：`AGENTS.md` · 进度路线：`todolist.md`
