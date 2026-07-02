# Cursor Automation 配方（换账户时按此重建，约 2 分钟）

自动化绑定在创建它的 Cursor 账户上。更换账户后，在新账户完成两步即可恢复：

1. **连接 GitHub 集成**：cursor.com Dashboard → Integrations → GitHub，授权访问 `bobizhenkeai/star-skill-radar`。
2. **新建 Automation**，按下表填写：

| 字段 | 值 |
|---|---|
| 名称 | Star-Skill Radar 每日情报 |
| 描述 | 每日生成 AI 技术资产日报并发布 |
| 触发 | 每日 10:00（北京时间；若编辑器按 UTC 显示则为 02:00，cron `0 2 * * *`） |
| 仓库 / 分支 | `bobizhenkeai/star-skill-radar` / `master` |
| 工具 | 无需额外工具 |

**指令（Prompt）原文**：

```text
你是 Star-Skill Radar 的每日运行 Agent。进入仓库后，首先阅读 docs/sop/README.md，
并严格按 docs/sop/daily-runbook.md 执行当日全流程：采集 → 可信度验证 → 去重 →
生成当日 data/issues/YYYY-MM-DD.json 与 reports/YYYY-MM-DD.md → 更新 data/ledger.json
与 data/issues/index.json → 完成提交前检查 → 将全部改动提交并推送到 master。
关键事实（star 数、作者、日期、版本）必须实时查询并附来源链接，禁止凭模型记忆填写。
数据格式以 docs/specs/data-contract.md 为准。
```

## 与 Cursor 账户无关、换号不受影响的部分

- GitHub 仓库、历史报告与数据（都在 git 里）
- GitHub Pages 情报站（**永久访问地址，请收藏**）
- 微信推送（GitHub Actions + Server酱，密钥存 GitHub Secrets）

## 永久访问地址（不依赖推送有效期）

Server酱 消息里的跳转链接可能过期；以下地址由 GitHub Pages 托管，**长期有效**，可随时查看全部历史日报：

**https://bobizhenkeai.github.io/star-skill-radar/site/**

建议保存到：手机浏览器书签、微信收藏、或「文件传输助手」/备忘录。推送仅作「今日已更新」提醒，日常阅读请用固定地址。

## 换号 / 断档的影响与信号

- 旧账户额度耗尽后，自动化运行会失败或暂停，日报**静默断更**；最直观的信号是**早上 10 点后微信没有收到推送**。
- 断档期间不丢数据，恢复运行后 SOP 的去重机制会正常衔接（漏掉的天数不会自动补跑，如需补跑可手动触发一次并指定日期）。
