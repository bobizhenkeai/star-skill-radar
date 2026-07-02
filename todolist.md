# todolist.md — 进度与路线

> 需求详情 → `docs/prds/star-skill-radar-v1.0-prd.md`；数据契约 → `docs/specs/data-contract.md`；调研材料 → `docs/research/`；项目约定 → `AGENTS.md`

## 全局路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 | 脚手架 + 治理文件 + 数据契约 + 来源调研（架构师） | 完成 |
| Phase 2 / Round 1 | 窗口B：采集/验证/报告 SOP 体系（feat/sop-pipeline）；窗口C：HTML 情报站（feat/html-site）— 并行 | 完成并合并 |
| Phase 3 | 合并 → GitHub 仓库推送 → Pages 上线 → 手动全链路试跑首期报告 | 未开始 |
| Phase 4 | 创建 Cursor Automation（每周 cron）→ 观察首次自动运行 → 验收 | 未开始 |

## 关键决策摘要

- 运行载体：Cursor Automations（Cloud Agent，每周 cron），无需本机常开。
- 交付：每周中文报告（3-5 重点条目深度分析 + 简讯），Markdown 归档 + HTML 情报站（GitHub Pages）。
- 可信度：分级制 —— 官方/权威直接准入；社区项目 star ≥1k + 多信号交叉验证，报告标注证据等级。
- 去重：`data/ledger.json` 已收录清单；重大更新以"追踪更新"形式再现。
- 待用户拍板：GitHub 仓库公开 vs 私有（影响 Pages 公开托管）。

## 进度日志

- 2026-07-02：需求澄清 3 轮完成，PRD v1.0 落盘；仓库脚手架初始化（5dc9f8f）；来源调研报告落盘（fb4f2ce）；Round 1 双窗口指令下发（B=feat/sop-pipeline，C=feat/html-site）。
- 2026-07-02：Round 1 验收完成。SOP 线（49da9d5）自审通过，runbook 提交信息模板参数化修正（3a2923b）后并入 master；HTML 线经代码审查发现 3 项问题（跨年 W53 时区 bug / optional 加载吞错 / 无 JS 降级），窗口C 修复（f50b876）后合并（72aed00），冲突文件 2026-W27.json 保留真实数据，删除虚构示例 W28。合并后契约校验通过（5 highlights / 9 briefs / 5 ledger items）。
