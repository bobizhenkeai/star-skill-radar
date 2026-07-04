import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateRepository } from "../scripts/validate-data.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR_CLI = path.join(PROJECT_ROOT, "scripts", "validate-data.mjs");

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
    one_liner: "代理规则辅助清单，适合后续观察。",
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

function reportFor(issue, { briefOverrideText, firstLinkOverride } = {}) {
  const highlight = issue.highlights[0];
  const brief = issue.briefs[0];
  const status = highlight?.is_update ? "重大更新追踪" : "新收录";
  const briefText = briefOverrideText ?? brief.one_liner;
  const highlightsSection = highlight
    ? `### 1. ${highlight.name}

- 类型：${highlight.type}
- 证据等级：${highlight.evidence_tier}
- 更新状态：${status}
- 适用阶段：${highlight.stage_tags.join(" / ")}
- 关键来源：[GitHub 仓库](${firstLinkOverride ?? highlight.links[0]})

**证据要点**：${highlight.evidence_notes}

**项目介绍**：${highlight.summary}

**竞品/替代项**：

**推荐理由**：${highlight.recommendation}

**最佳使用范式**：${highlight.usage_paradigm}`
    : "本期无重点条目。";
  return `# Star-Skill Radar 日报 ${issue.date}

生成时间：${issue.generated_at}

## 本期结论

- 本期重点条目：${issue.highlights.length} 个
- 官方/权威：${issue.highlights.filter((item) => item.evidence_tier === "official").length} 个
- 社区验证：${issue.highlights.filter((item) => item.evidence_tier === "community-verified").length} 个
- 来源缺口：${issue.source_gaps.length} 个

## 重点条目

${highlightsSection}

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

async function validateWithFetch(root, fetchImpl, options = { githubRecheck: "latest" }) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await validateRepository(root, options);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function githubResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  };
}

test("valid minimal repository passes without blocking errors", async () => {
  const root = makeTempRepo();
  writeFixture(root);
  const result = await validateRepository(root);
  assert.equal(result.errors.length, 0);
});

test("empty highlights report passes explicitly", async () => {
  const root = makeTempRepo();
  writeFixture(root, { issue: { highlights: [] }, ledger: [] });
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

test("brief star claims enter numeric sanity gate", async () => {
  const root = makeTempRepo();
  const official = baseHighlight({
    id: "openai/flagship",
    name: "Official Flagship",
    evidence_tier: "official",
    evidence_notes: "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 openai/flagship 有 100,000 stars、1 forks、0 open issues。",
    links: ["https://github.com/openai/flagship"]
  });
  const brief = baseBrief({
    name: "Acme Brief",
    one_liner:
      "代理规则辅助清单，适合后续观察；GitHub API 显示 acme/brief 有 150,000 stars、MIT license。",
    link: "https://github.com/acme/brief"
  });
  writeFixture(root, {
    issue: { highlights: [official], briefs: [brief] },
    ledger: [baseLedgerEntry({ id: "openai/flagship", name: "Official Flagship", evidence_tier: "official", links: ["https://github.com/openai/flagship"] })]
  });
  const codes = await validateCodes(root);
  assert.ok(codes.has("COMMUNITY_STAR_ABOVE_THRESHOLD"));
  assert.ok(codes.has("COMMUNITY_STAR_ABOVE_OFFICIAL"));
});

test("anchored star parser ignores thresholds and previous star mentions", async () => {
  const root = makeTempRepo();
  const highlight = baseHighlight({
    evidence_notes:
      "社区 highlights 门槛是 1,000 stars；昨日参考项曾有 135,528 stars。采集时间 2026-07-10T10:00+08:00。GitHub API 显示 acme/tool 有 2,500 stars、300 forks、12 open issues，archived=false。"
  });
  writeFixture(root, { issue: { highlights: [highlight] } });
  const result = await validateRepository(root);
  assert.equal(result.errors.length, 0);
});

test("high-base star jump below 2x is blocked", async () => {
  const root = makeTempRepo();
  const previousIssue = {
    date: "2026-07-09",
    generated_at: "2026-07-09T10:00:00+08:00",
    highlights: [
      baseHighlight({
        id: "openai/flagship",
        name: "Official Flagship",
        evidence_tier: "official",
        evidence_notes: "采集时间 2026-07-09T10:00+08:00。GitHub API 显示 openai/flagship 有 135,528 stars、1 forks、0 open issues。",
        links: ["https://github.com/openai/flagship"]
      })
    ],
    briefs: [baseBrief()],
    source_gaps: []
  };
  const currentIssue = {
    date: "2026-07-10",
    generated_at: "2026-07-10T10:00:00+08:00",
    highlights: [
      baseHighlight({
        id: "openai/flagship",
        name: "Official Flagship",
        evidence_tier: "official",
        evidence_notes: "采集时间 2026-07-10T10:00+08:00。GitHub API 显示 openai/flagship 有 225,218 stars、1 forks、0 open issues。",
        links: ["https://github.com/openai/flagship"]
      })
    ],
    briefs: [baseBrief()],
    source_gaps: []
  };
  writeJson(path.join(root, "data", "ledger.json"), [
    baseLedgerEntry({ id: "openai/flagship", name: "Official Flagship", evidence_tier: "official", links: ["https://github.com/openai/flagship"] })
  ]);
  writeJson(path.join(root, "data", "issues", "index.json"), ["2026-07-09", "2026-07-10"]);
  writeJson(path.join(root, "data", "issues", "2026-07-09.json"), previousIssue);
  writeJson(path.join(root, "data", "issues", "2026-07-10.json"), currentIssue);
  writeText(path.join(root, "reports", "2026-07-09.md"), reportFor(previousIssue));
  writeText(path.join(root, "reports", "2026-07-10.md"), reportFor(currentIssue));
  const codes = await validateCodes(root);
  assert.ok(codes.has("STAR_JUMP_ANOMALY"));
});

test("brief gist allows semantic release and license wording", async () => {
  const root = makeTempRepo();
  const brief = baseBrief({
    gist: "Release自动化工具，辅助License合规扫描",
    one_liner: "Release 自动化工具，辅助 License 合规扫描。"
  });
  writeFixture(root, { issue: { briefs: [brief] } });
  const result = await validateRepository(root);
  assert.equal(result.errors.some((item) => item.code === "BRIEF_GIST_EVIDENCE_TAIL"), false);
  assert.equal(result.errors.length, 0);
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

test("markdown highlight first source link drift fails", async () => {
  const root = makeTempRepo();
  writeFixture(root, { reportOptions: { firstLinkOverride: "https://github.com/acme/wrong" } });
  const codes = await validateCodes(root);
  assert.ok(codes.has("MARKDOWN_HIGHLIGHT_LINK_MISMATCH"));
});

test("github recheck covers matching highlight and brief star claims", async () => {
  const root = makeTempRepo();
  const briefClaim = baseHighlight().evidence_notes.replaceAll("acme/tool", "acme/brief");
  writeFixture(root, {
    issue: {
      briefs: [
        baseBrief({
          one_liner: `Brief candidate for follow-up; ${briefClaim}`
        })
      ]
    }
  });

  const urls = [];
  const result = await validateWithFetch(root, async (url) => {
    urls.push(String(url));
    return githubResponse(200, { stargazers_count: 2500 });
  });

  assert.equal(result.errors.some((item) => item.code.startsWith("GITHUB_RECHECK_")), false);
  assert.deepEqual([...new Set(urls)].sort(), [
    "https://api.github.com/repos/acme/brief",
    "https://api.github.com/repos/acme/tool"
  ]);
});

test("github recheck star mismatch is blocking error", async () => {
  const root = makeTempRepo();
  writeFixture(root);

  const result = await validateWithFetch(root, async () => githubResponse(200, { stargazers_count: 3200 }));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === "GITHUB_RECHECK_STAR_MISMATCH"));
});

test("github recheck 404 is blocking error", async () => {
  const root = makeTempRepo();
  writeFixture(root);

  const result = await validateWithFetch(root, async () => githubResponse(404, {}));

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.code === "GITHUB_RECHECK_REPO_NOT_FOUND"));
});

test("github recheck rate limit is non-blocking warning", async () => {
  const root = makeTempRepo();
  writeFixture(root);

  const result = await validateWithFetch(root, async () => githubResponse(429, {}));

  assert.equal(result.ok, true);
  assert.equal(result.errors.some((item) => item.code.startsWith("GITHUB_RECHECK_")), false);
  assert.ok(result.warnings.some((item) => item.code === "GITHUB_RECHECK_REQUEST_FAILED" && item.message.includes("HTTP 429")));
});

test("github recheck network failure is non-blocking warning", async () => {
  const root = makeTempRepo();
  writeFixture(root);

  const result = await validateWithFetch(root, async () => {
    throw new Error("network down");
  });

  assert.equal(result.ok, true);
  assert.equal(result.errors.some((item) => item.code.startsWith("GITHUB_RECHECK_")), false);
  assert.ok(result.warnings.some((item) => item.code === "GITHUB_RECHECK_REQUEST_FAILED" && item.message.includes("network down")));
});

test("github recheck malformed response is non-blocking warning", async () => {
  const root = makeTempRepo();
  writeFixture(root);

  const result = await validateWithFetch(root, async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("invalid json");
    }
  }));

  assert.equal(result.ok, true);
  assert.equal(result.errors.some((item) => item.code.startsWith("GITHUB_RECHECK_")), false);
  assert.ok(result.warnings.some((item) => item.code === "GITHUB_RECHECK_BAD_RESPONSE" && item.message.includes("invalid JSON")));
});

test("CLI missing option values exit with code 2", () => {
  for (const args of [["--root"], ["--root", "--json"], ["--github-recheck"], ["--github-recheck", "--json"]]) {
    const result = spawnSync(process.execPath, [VALIDATOR_CLI, ...args], {
      cwd: PROJECT_ROOT,
      encoding: "utf8"
    });
    assert.equal(result.status, 2);
  }
});
