import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateRepository } from "../scripts/validate-data.mjs";

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function makeTempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "star-skill-validator-"));
  fs.mkdirSync(path.join(root, "data", "issues"), { recursive: true });
  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  return root;
}

function baseHighlight(overrides = {}) {
  return {
    id: "acme/tool",
    name: "Acme Tool",
    type: "skill",
    evidence_tier: "community-verified",
    evidence_notes:
      "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 acme/tool 有 2,500 stars、300 forks、12 open issues，MIT license，archived=false；latest release v1.0.0 发布于 2026-07-09；附加信号：近期 push、README 有安装路径。",
    gist: "工程技能工具包，沉淀可复用代理流程",
    summary: "Acme Tool 是工程技能工具包，提供可复用代理流程。",
    competitors: [],
    recommendation: "stars 超过 1k，license 与近期维护信号明确。",
    usage_paradigm: "用于 implementation 与 review 阶段。",
    stage_tags: ["implementation", "review"],
    is_update: false,
    links: ["https://github.com/acme/tool"],
    ...overrides
  };
}

function baseBrief(overrides = {}) {
  return {
    name: "Acme Brief",
    gist: "代理规则辅助清单，适合后续观察",
    one_liner: "代理规则辅助清单，适合后续观察；2,000 stars，MIT license。",
    link: "https://github.com/acme/brief",
    ...overrides
  };
}

function baseLedgerEntry(overrides = {}) {
  return {
    id: "acme/tool",
    name: "Acme Tool",
    type: "skill",
    evidence_tier: "community-verified",
    first_reported: "2026-07-10",
    last_updates: [],
    state_snapshot:
      "2026-07-10T10:00+08:00 GitHub API: 2,500 stars, 300 forks; skill tool with install path.",
    stage_tags: ["implementation", "review"],
    links: ["https://github.com/acme/tool"],
    ...overrides
  };
}

function reportFor(issue, { briefOverrideText } = {}) {
  const highlight = issue.highlights[0];
  const brief = issue.briefs[0];
  const status = highlight.is_update ? "重大更新追踪" : "新收录";
  const briefText = briefOverrideText ?? brief.one_liner;
  return `# Star-Skill Radar 日报 ${issue.date}

生成时间：${issue.generated_at}

## 本期结论

- 本期重点条目：${issue.highlights.length} 个
- 官方/权威：${issue.highlights.filter((item) => item.evidence_tier === "official").length} 个
- 社区验证：${issue.highlights.filter((item) => item.evidence_tier === "community-verified").length} 个
- 来源缺口：${issue.source_gaps.length} 个

## 重点条目

### 1. ${highlight.name}

- 类型：${highlight.type}
- 证据等级：${highlight.evidence_tier}
- 更新状态：${status}
- 适用阶段：${highlight.stage_tags.join(" / ")}
- 关键来源：[GitHub 仓库](${highlight.links[0]})

**证据要点**：${highlight.evidence_notes}

**项目介绍**：${highlight.summary}

**竞品/替代项**：

**推荐理由**：${highlight.recommendation}

**最佳使用范式**：${highlight.usage_paradigm}

## 简讯

- [${brief.name}](${brief.link})：${briefText}

## 来源缺口

`;
}

function writeFixture(root, overrides = {}) {
  const issue = {
    date: "2026-07-10",
    generated_at: "2026-07-10T10:00:00+08:00",
    highlights: [baseHighlight()],
    briefs: [baseBrief()],
    source_gaps: [],
    ...(overrides.issue ?? {})
  };
  const ledger = overrides.ledger ?? [baseLedgerEntry()];
  writeJson(path.join(root, "data", "ledger.json"), ledger);
  writeJson(path.join(root, "data", "issues", "index.json"), overrides.index ?? [issue.date]);
  writeJson(path.join(root, "data", "issues", `${issue.date}.json`), issue);
  writeText(path.join(root, "reports", `${issue.date}.md`), reportFor(issue, overrides.reportOptions));
  return { issue, ledger };
}

async function validateCodes(root) {
  const result = await validateRepository(root);
  return new Set(result.findings.map((item) => item.code));
}

test("valid minimal repository passes without blocking errors", async () => {
  const root = makeTempRepo();
  writeFixture(root);
  const result = await validateRepository(root);
  assert.equal(result.errors.length, 0);
});

test("bad enum fails", async () => {
  const root = makeTempRepo();
  const highlight = baseHighlight({ type: "bad-type" });
  writeFixture(root, {
    issue: { highlights: [highlight] },
    ledger: [baseLedgerEntry({ type: "bad-type" })]
  });
  const codes = await validateCodes(root);
  assert.ok(codes.has("INVALID_ENUM"));
});

test("index and issue file mismatch fails", async () => {
  const root = makeTempRepo();
  writeFixture(root, { index: ["2026-07-09"] });
  const codes = await validateCodes(root);
  assert.ok(codes.has("INDEX_MISMATCH"));
});

test("highlight missing from ledger fails", async () => {
  const root = makeTempRepo();
  writeFixture(root, { ledger: [] });
  const codes = await validateCodes(root);
  assert.ok(codes.has("HIGHLIGHT_LEDGER_MISSING"));
});

test("bad URL fails", async () => {
  const root = makeTempRepo();
  const highlight = baseHighlight({ links: ["not-a-url"] });
  writeFixture(root, {
    issue: { highlights: [highlight] },
    ledger: [baseLedgerEntry({ links: ["not-a-url"] })]
  });
  const codes = await validateCodes(root);
  assert.ok(codes.has("INVALID_URL"));
});

test("brief one_liner cannot start with collection evidence", async () => {
  const root = makeTempRepo();
  const brief = baseBrief({ one_liner: "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 2,000 stars。" });
  writeFixture(root, { issue: { briefs: [brief] } });
  const codes = await validateCodes(root);
  assert.ok(codes.has("BRIEF_ONE_LINER_PREFIX"));
});

test("gist evidence prefix and multiline fail", async () => {
  const root = makeTempRepo();
  const highlight = baseHighlight({ gist: "GitHub API 显示 2500 stars\n不应展示" });
  writeFixture(root, { issue: { highlights: [highlight] } });
  const codes = await validateCodes(root);
  assert.ok(codes.has("GIST_EVIDENCE_PREFIX"));
  assert.ok(codes.has("GIST_MULTILINE"));
});

test("bad numeric sanity fails for community threshold, official comparison, id case, and jump", async () => {
  const root = makeTempRepo();
  const official = baseHighlight({
    id: "openai/flagship",
    name: "Official Flagship",
    evidence_tier: "official",
    evidence_notes: "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 openai/flagship 有 100,000 stars、1 forks、0 open issues。",
    links: ["https://github.com/openai/flagship"]
  });
  const community = baseHighlight({
    id: "Acme/Tool",
    name: "Acme Tool",
    evidence_notes:
      "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 Acme/Tool 有 150,000 stars、300 forks、12 open issues，MIT license，archived=false。",
    links: ["https://github.com/Acme/Tool"]
  });
  const previousIssue = {
    date: "2026-07-09",
    generated_at: "2026-07-09T10:00:00+08:00",
    highlights: [
      baseHighlight({
        id: "acme/tool",
        evidence_notes:
          "采集时间 2026-07-09T10:00+08:00。GitHub API 显示 acme/tool 有 2,000 stars、300 forks、12 open issues，MIT license，archived=false。"
      })
    ],
    briefs: [baseBrief()],
    source_gaps: []
  };
  const currentIssue = {
    date: "2026-07-10",
    generated_at: "2026-07-10T10:00:00+08:00",
    highlights: [official, community],
    briefs: [baseBrief()],
    source_gaps: []
  };
  writeJson(path.join(root, "data", "ledger.json"), [
    baseLedgerEntry({ id: "openai/flagship", name: "Official Flagship", evidence_tier: "official", links: ["https://github.com/openai/flagship"] }),
    baseLedgerEntry({ id: "Acme/Tool", links: ["https://github.com/Acme/Tool"] })
  ]);
  writeJson(path.join(root, "data", "issues", "index.json"), ["2026-07-09", "2026-07-10"]);
  writeJson(path.join(root, "data", "issues", "2026-07-09.json"), previousIssue);
  writeJson(path.join(root, "data", "issues", "2026-07-10.json"), currentIssue);
  writeText(path.join(root, "reports", "2026-07-09.md"), reportFor(previousIssue));
  writeText(path.join(root, "reports", "2026-07-10.md"), reportFor(currentIssue));

  const codes = await validateCodes(root);
  assert.ok(codes.has("COMMUNITY_STAR_ABOVE_THRESHOLD"));
  assert.ok(codes.has("COMMUNITY_STAR_ABOVE_OFFICIAL"));
  assert.ok(codes.has("GITHUB_ID_NOT_LOWERCASE"));
  assert.ok(codes.has("STAR_JUMP_ANOMALY"));
});

test("markdown brief drift fails", async () => {
  const root = makeTempRepo();
  writeFixture(root, { reportOptions: { briefOverrideText: "这条 Markdown 简讯被改写，已不再同源。" } });
  const codes = await validateCodes(root);
  assert.ok(codes.has("MARKDOWN_BRIEF_MISMATCH"));
});
