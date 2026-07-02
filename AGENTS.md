# AGENTS.md — Star-Skill Radar 仓库宪章

> 本文件是所有工作窗口的共同约定。进度与路线见 `todolist.md`，需求见 `docs/prds/`，规格见 `docs/specs/`。

## 项目一句话

每周自动捕捉 GitHub 高星 AI 技术资产（skills / MCP / rules / hooks / subagents / 提示词库）与工作范式情报，产出中文精选深度报告（Markdown 归档 + 移动端友好 HTML 情报站），由 Cursor Automations 云端定时驱动。

## 目录约定

| 路径 | 用途 | 负责方 |
|---|---|---|
| `docs/prds/` | 产品需求文档 | 架构师 |
| `docs/specs/` | 数据契约、设计规格 | 架构师定契约，实施窗口可提修订 |
| `docs/research/` | 调研报告（参考材料，非约束） | 架构师/调研 |
| `docs/sop/` | Automation Agent 每周执行的 SOP 指令体系 | SOP 窗口 |
| `data/` | 已收录清单索引 + 每期结构化数据 | SOP 窗口定义，Automation 运行时读写 |
| `reports/` | 每周 Markdown 报告归档（`YYYY-Www.md`） | Automation 运行时产出 |
| `site/` | HTML 情报站（静态，GitHub Pages 托管） | 站点窗口 |

## 硬性约定

- 报告与文档一律中文；文件编码 UTF-8。
- 报告中的 star 数、作者、日期等关键事实必须来自实时工具查询并附来源链接，禁止凭模型记忆填写。
- 数据文件格式以 `docs/specs/data-contract.md` 为准；需要变更契约时先在反馈中提出，由架构师确认后修订。
- 提交信息使用约定式前缀（feat: / fix: / docs: / chore:）。

## 验证要求

- 改动 `data/` 相关逻辑后，须验证 JSON 可被标准解析器解析且符合契约字段。
- `site/` 改动须在本地打开验证桌面 + 移动端视口渲染正常。
- 每个任务完成后向架构师反馈：修改文件清单、改动意图、commit hash、测试结果。

## 踩坑 Ledger

- `site/` 本地验证：需先起静态服务器（如 `python -m http.server`），`file://` 直开会因 `fetch()` 读不到 JSON 而卡在 loading。用 chrome-devtools MCP 测移动端视口时优先用 `emulate`（`viewport: "390x844x3,mobile,touch"`），`resize_page` 在浏览器窗口已最大化时会报 "Restore window to normal state" 错误。
- `browser-use` subagent 在本环境曾出现浏览器 MCP 连接中途断开、或声称找不到 `CallMcpTool` 而退化为纯代码走读（未真正验证）的情况；本地站点验证优先由主窗口直接调用 `user-chrome-devtools` MCP 工具（先读 `mcps/user-chrome-devtools/tools/*.json` 确认参数）驱动，比委派子代理更可靠。
- Cursor 云端 Automation 的账户归属状态无法从 agent 对话内查询/核实（`automate` 技能明确仅限创建、禁止查询已有自动化；隔离浏览器无用户真实登录态）；换号后需人工登录 cursor.com/dashboard 自查，参考 `docs/automation-recipe.md`。
