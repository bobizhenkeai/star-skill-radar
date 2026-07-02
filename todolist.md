# todolist.md — 进度与路线

> 需求详情 → `docs/prds/star-skill-radar-v1.0-prd.md`；数据契约 → `docs/specs/data-contract.md`；调研材料 → `docs/research/`；项目约定 → `AGENTS.md`

## 全局路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 | 脚手架 + 治理文件 + 数据契约 + 来源调研（架构师） | 完成 |
| Phase 2 / Round 1 | 窗口B：采集/验证/报告 SOP 体系（feat/sop-pipeline）；窗口C：HTML 情报站（feat/html-site）— 并行 | 完成并合并 |
| Phase 3 | 合并 → GitHub 仓库推送 → Pages 上线 → 手动全链路试跑首期报告 | 推送完成；待用户启用 Pages（首期 W27 已由 SOP 演练产出，全链路试跑视为完成） |
| Phase 3.5 / Round 2 | 周报→日报改造：窗口B：SOP 日报化 + 存量迁移（feat/daily-sop）；窗口C：站点按日发现（feat/daily-site）— 并行 | 完成并合并 |
| Phase 4 | 创建 Cursor Automation（每日 10:00 北京时间 cron）→ 观察首次自动运行 → 验收 | 完成：Automation 已创建激活，首次真实运行（手动触发）全链路验证通过，同日重复运行的幂等保护已补齐 |
| Phase 5 | 情报站前端信息架构与视觉系统改版：多 subagent 调研设计哲学 → 摘要看板（按 type 分类的一眼概览）+ 卡片证据态默认折叠 + 暖色可读性系统 | 完成（单窗口直接实施），本地桌面/移动端渲染 + 交互回归验证通过 |

## 关键决策摘要

- 运行载体：Cursor Automations（Cloud Agent，每周 cron），无需本机常开。
- 交付：每周中文报告（3-5 重点条目深度分析 + 简讯），Markdown 归档 + HTML 情报站（GitHub Pages）。
- 可信度：分级制 —— 官方/权威直接准入；社区项目 star ≥1k + 多信号交叉验证，报告标注证据等级。
- 去重：`data/ledger.json` 已收录清单；重大更新以"追踪更新"形式再现。
- 用户已拍板：仓库公开（bobizhenkeai/star-skill-radar），HTML 站走 GitHub Pages，手机浏览器/微信可直接打开。Pages 已上线。
- 用户 Round 2 反馈（PRD v1.1）：改日报（每日 10:00 北京时间）；微信推送经 GitHub Actions + Server酱（文件传输助手无接口，不可行）；契约升级 v2（YYYY-MM-DD）。
- 契约 v2.1：新增 data/issues/index.json 日期清单（SOP 写、站点读），根治站点逐日探测线性膨胀问题（代码审查高危项）。旧 #/week/ 深链兼容经裁决豁免（零流量）。
- Server酱 推送链路已实测可用（pushid 43788474）；SERVERCHAN_SENDKEY 已由用户加入 GitHub Secrets。
- open_automation 预填两次均未能将草案送达用户可见界面（原因未明），最终改为手动指导用户在 UI 内逐字段创建，创建成功。经验记录：该环境下预填自动打开在实践中不可靠，需备好手动配方兜底——已固化为 docs/automation-recipe.md。
- 首次真实运行（14:38 手动 Test run）验证全链路打通：commit b230bd7、情报站更新、微信推送均确认成功。同时发现同日两次生成（今晨 SOP 演练 + 今下午真实测试）会静默覆盖，因两者共用同一天文件名主键。根因已查明（git log 证实 b230bd7 为"修改"而非"新增"）。用户选择"跳过"策略：已在 daily-runbook.md/README.md 加入幂等保护（27495ac）——当天文件已存在则整次运行直接跳过，不覆盖不提交。
- 用户反馈 Cursor 本地+云端账户已切换，自动化绑定账户与当前账户不一致。诊断结论：GitHub 侧（Actions、Pages、数据文件）经公开 API 直接核实健康；Cursor 云端 Automation 的账户归属**无法由 agent 侧工具验证**——`automate` 技能明确禁止从对话中查询/列出已有 Automation，隔离浏览器也没有用户的 Cursor 登录态。已请用户自行在 cursor.com/dashboard 核实，换号补救配方见 `docs/automation-recipe.md`（已有幂等保护兜底，重建不会导致重复出报）。
- 情报站前端改版（Phase 5）：用户设计方向为"羊皮卷手写纸"暖色基调 + 摘要优先/证据默认折叠的渐进式披露。3 个 subagent 完成 Anthropic 品牌语言、渐进式披露 UX、暖色+中文排版三方向调研（落盘 `docs/research/frontend-redesign-*.md`），经用户确认保留原有墨绿主题色（`--accent` 不变）后单窗口直接实施：新增"今日摘要"看板（按 `type` 分类分组、点击跳转对应卡片）；`highlight-card` 拆分为核心态（项目介绍+为什么重要+怎么用，始终可见）与证据态（证据要点/竞品对比/来源链接/条目标识，`<details>` 默认折叠，触发文案含数量提示）；中性色系去除冷绿色偏（`--ink`/`--muted` 改为暖褐黑/暖灰，均重新验算 WCAG 对比度）；新增 7 类目专用低饱和配色；正文/UI 字体改为系统级中文字体优先（不接入 Google Fonts，避免境外字体 CDN 在中文移动端不可达的风险），大标题新增系统衬线字体做展示层。本地起静态服务器 + chrome-devtools MCP 直接验证：桌面/移动视口渲染正常，摘要看板跳转、证据折叠展开、类型/阶段筛选、归档导航均无回归，控制台无报错。

## 进度日志

- 2026-07-02：需求澄清 3 轮完成，PRD v1.0 落盘；仓库脚手架初始化（5dc9f8f）；来源调研报告落盘（fb4f2ce）；Round 1 双窗口指令下发（B=feat/sop-pipeline，C=feat/html-site）。
- 2026-07-02：Round 1 验收完成。SOP 线（49da9d5）自审通过，runbook 提交信息模板参数化修正（3a2923b）后并入 master；HTML 线经代码审查发现 3 项问题（跨年 W53 时区 bug / optional 加载吞错 / 无 JS 降级），窗口C 修复（f50b876）后合并（72aed00），冲突文件 2026-W27.json 保留真实数据，删除虚构示例 W28。合并后契约校验通过（5 highlights / 9 briefs / 5 ledger items）。
