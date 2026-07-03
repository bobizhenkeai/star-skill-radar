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
| Phase 6 | 情报站前端 v2：用户实测反馈（Q1 简讯展开不可逆 / Q2 头部统计块不协调 + "现代看板/高可读"方向）→ 两条线并行 5 份循证调研 → 架构师决策简报 → 单窗口实施 | 完成：v2 实施（`f3bd9f8`）+ code-review 无阻断 + should-fix 修复（`25b762a`：`累计收录` 改用 `ledger.length`、收起加 `preventScroll`）；与自动化 07-03 日报合并（`28be652`）后推送上线，Pages 部署已验证 |
| Phase 7 | overview 概览一句话（契约 v2.2 `gist`）+ 资产总表 `#/catalog` 视图 + 分享元数据（OG/Twitter/favicon）：两窗口并行（B=SOP 补规范+回填 gist；C=站点消费 gist/catalog/OG）→ code-review should-fix 回收 → 一次推送上线 | 完成：契约 `e6b7261`；数据/SOP `2d49298`；站点 `91ba6dc`/`89aa8e6`/`030fc48`；微修复 `e4df3ec`；已推送 origin（`e6b7261..e4df3ec`）并线上验证（07-03 gist 5/5、ledger 13 项、OG/favicon 均 200 生效） |

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
- 账户切换后自动化仍正常（经验性确认）：origin 出现 `ef69e7e`「docs: add 2026-07-03 daily issue」，作者 `Cursor Agent <cursoragent@cursor.com>`、时间 2026-07-03 10:04 北京时间——即 07-03 定时任务真实产出了当日日报（`data/issues/2026-07-03.json` + `reports/2026-07-03.md` + ledger 增长）。这是对"换号后自动化是否还跑"的经验性回答：仍在跑。注意此仅证明"当天绑定账户仍有效"，长期冗余仍建议按 `docs/automation-architecture-guide.md` §四 做多账户配方。
- 情报站前端 Phase 7：契约升级 **v2.2** 新增 `highlights.gist`（overview 专用自洽短句 18–42 字，缺失降级为对 `summary` 的语义提炼）+ `briefs.one_liner` 描述先行规范；站点消费 `gist`、新增 `#/catalog` 资产总表（读 `ledger.json`、类型筛选、安全外链）、补 OG/Twitter/favicon 分享元数据。两窗口并行（B=SOP 补 gist 生成/校验规范 + 回填 07-02/07-03 两期；C=站点实现）。code-review should-fix 已回收（微修复 `e4df3ec`：`normalizeGistString` 归一化脏 `gist`、gist 兜底移除 `recommendation` 回退只留 `summary`、`#/catalog` 状态栏不再以"日报"为主语标红）。全部推送并线上验证（app.js 含 `normalizeGistString`/catalog、index.html 含 OG/Twitter/#catalog/favicon、og-image.png+favicon.svg 均 200、07-03 highlight 5/5 带 gist、ledger 13 项）。
- 情报站前端 v2（Phase 6）：用户实测反馈 Q1（简讯展开不可逆）/Q2（头部统计块不协调），并要求以"现代看板/日报/高可读第一性原理"为依据、启用多 subagent 两条线并行调研。架构师执行：Line A 主窗口 3 个 `deep-tech-researcher` subagent（看板一眼可读第一性原理 / 可逆渐进披露交互 / 头部 KPI 展示）+ Line B 子窗口 2 任务（高可读性排版+`ui-ux-pro-max` 工具落地 / 现代看板×羊皮纸美学融合含参考图）→ 5 份报告落盘 `docs/research/frontend-v2-*.md` → 架构师汇总裁决为 `docs/specs/frontend-v2-design-decisions.md`（关键裁决：① Q1 硬底线消灭单向展开，保留展开须为可逆 disclosure；② 不做同权三列/masonry，以"总览条+分组短列表+少量加权"为主；③ overview 独立 briefing copy 字段属数据契约变更，本轮不做）。单窗口实施（`f3bd9f8`）：hero grouped brief band 修 Q2（`最新日期` 主指标 `<time>`+nowrap、文案改「累计重点」）、`overviewMoreButton` 改常驻可逆 `button[aria-expanded][aria-controls]`+`panel[hidden]` 修 Q1、overview masthead+分组短列表+内联 SVG 类目图标、语义截断替代纯字符裁剪、16px 阅读基线+`--line-ui`/暖纸 token+reduced-motion。本地 headless Chrome（playwright-core 兜底）桌面/移动验证通过。code-review 无阻断项；遗留 should-fix：`累计重点` 文案与"仅累加已加载期"的计算不符（数据增多后会少算），拟改用 `state.ledger.length` 做真·累计收录。**尚未推送**，origin/master 仍 `a8446ae`。

## 进度日志

- 2026-07-02：需求澄清 3 轮完成，PRD v1.0 落盘；仓库脚手架初始化（5dc9f8f）；来源调研报告落盘（fb4f2ce）；Round 1 双窗口指令下发（B=feat/sop-pipeline，C=feat/html-site）。
- 2026-07-02：Round 1 验收完成。SOP 线（49da9d5）自审通过，runbook 提交信息模板参数化修正（3a2923b）后并入 master；HTML 线经代码审查发现 3 项问题（跨年 W53 时区 bug / optional 加载吞错 / 无 JS 降级），窗口C 修复（f50b876）后合并（72aed00），冲突文件 2026-W27.json 保留真实数据，删除虚构示例 W28。合并后契约校验通过（5 highlights / 9 briefs / 5 ledger items）。
- 2026-07-03：Phase 5 前端改版落库（`b03f329` 永久链接文档、`a8446ae` 摘要看板+渐进式披露）并推送，Pages 部署验证线上生效。随后 Phase 6 前端 v2：两条线并行 5 份调研 → 决策简报 → 单窗口实施（`f3bd9f8`，本地验证通过、未推送），code-review 无阻断项、遗留 1 项 should-fix 待定。
- 2026-07-03（晚）：Phase 6 收尾。should-fix 修复（`25b762a`：累计收录改用 `ledger.length` + 收起 `preventScroll`）。推送前 fetch 发现 origin 已被自动化 07-03 运行推进到 `ef69e7e`（data/reports），与本地 site/docs 改动零重叠，merge 合并（`28be652`）无冲突后一次推送上线（含 `f3bd9f8`/`a0d2fa0`/`25b762a`/`28be652`）。同时据 `ef69e7e` 作者与时间确认：账户切换后自动化 07-03 仍真实运行。
- 2026-07-04（凌晨）：Phase 7 收尾。回收站点 should-fix 微修复（`e4df3ec`：`gist` 类型守卫 + 兜底仅 `summary` + `#/catalog` 状态栏），子窗口本地四条兜底路径 + `node --check` 均通过。推前 `fetch` 确认 origin 未被自动化推进（07-04 10:00 未到、`0/4`），一次推送 `e6b7261..e4df3ec`（含 `2d49298`/`91ba6dc`/`89aa8e6`/`030fc48`/`e4df3ec`）。线上验证全通过（见 Phase 7 决策摘要）。踩坑：PowerShell 下 git commit 用 bash heredoc 会 ParserError，已记入 AGENTS.md。
