const DATA_ROOT = "../data";
const ISSUE_ROOT = `${DATA_ROOT}/issues`;
const DISCOVERY_START = { year: 2026, week: 1 };
const DISCOVERY_LOOKAHEAD_WEEKS = 8;

const TYPE_OPTIONS = [
  ["all", "全部"],
  ["skill", "Skill"],
  ["mcp", "MCP"],
  ["rules", "Rules"],
  ["hooks", "Hooks"],
  ["subagent", "Subagent"],
  ["prompt-lib", "提示词库"],
  ["paradigm", "范式"]
];

const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS);

const STAGE_GROUPS = [
  ["all", "全部"],
  ["early", "前期"],
  ["middle", "中期"],
  ["late", "后期"]
];

const STAGE_LABELS = {
  requirements: "需求",
  design: "设计",
  implementation: "实现",
  review: "审查",
  testing: "测试",
  ops: "运维"
};

const STAGE_GROUP_MAP = {
  early: new Set(["requirements", "design"]),
  middle: new Set(["implementation", "review"]),
  late: new Set(["testing", "ops"])
};

const EVIDENCE_LABELS = {
  official: "官方证据",
  "community-verified": "社区验证"
};

const state = {
  ledger: [],
  issues: [],
  selectedWeek: null,
  filters: {
    type: "all",
    stage: "all"
  }
};

const nodes = {
  issueList: document.querySelector("#issueList"),
  issueDetail: document.querySelector("#issueDetail"),
  statusBar: document.querySelector("#statusBar"),
  typeFilters: document.querySelector("#typeFilters"),
  stageFilters: document.querySelector("#stageFilters"),
  statIssueCount: document.querySelector("#statIssueCount"),
  statHighlightCount: document.querySelector("#statHighlightCount"),
  statLatestWeek: document.querySelector("#statLatestWeek")
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", () => {
  syncRoute();
  render();
});

async function init() {
  renderFilterButtons();
  try {
    state.ledger = await loadLedger();
    state.issues = await discoverIssues(state.ledger);
    const initialHash = window.location.hash;
    syncRoute();
    if (!initialHash && state.selectedWeek) {
      history.replaceState(null, "", `#/week/${state.selectedWeek}`);
    }
    setStatus(statusMessage());
  } catch (error) {
    setStatus("读取数据时发生错误，页面已切换到空状态。", true);
    state.issues = [];
  }
  render();
}

function renderFilterButtons() {
  nodes.typeFilters.replaceChildren(
    ...TYPE_OPTIONS.map(([value, label]) =>
      filterButton(label, state.filters.type === value, () => {
        state.filters.type = value;
        render();
      })
    )
  );

  nodes.stageFilters.replaceChildren(
    ...STAGE_GROUPS.map(([value, label]) =>
      filterButton(label, state.filters.stage === value, () => {
        state.filters.stage = value;
        render();
      })
    )
  );
}

function filterButton(label, active, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `filter-button${active ? " is-active" : ""}`;
  button.textContent = label;
  button.setAttribute("aria-pressed", String(active));
  button.addEventListener("click", onClick);
  return button;
}

async function loadLedger() {
  const result = await fetchJson(`${DATA_ROOT}/ledger.json`, { optional: true });
  return Array.isArray(result) ? result : [];
}

async function discoverIssues(ledger) {
  const weeks = new Set(generateCandidateWeeks());
  for (const item of Array.isArray(ledger) ? ledger : []) {
    addWeekIfValid(weeks, item && item.first_reported);
    const updates = Array.isArray(item && item.last_updates) ? item.last_updates : [];
    for (const update of updates) {
      addWeekIfValid(weeks, update && update.week);
    }
  }

  const candidates = Array.from(weeks).sort(compareWeeksDesc);
  const issueResults = await Promise.all(
    candidates.map(async (week) => {
      const data = await fetchJson(`${ISSUE_ROOT}/${week}.json`, { optional: true });
      if (!isIssue(data)) return null;
      return normalizeIssue(data, week);
    })
  );

  return issueResults.filter(Boolean).sort((a, b) => compareWeeksDesc(a.week, b.week));
}

async function fetchJson(url, { optional = false } = {}) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return optional ? null : Promise.reject(new Error(`${url} ${response.status}`));
    }
    return await response.json();
  } catch (error) {
    if (optional) return null;
    throw error;
  }
}

function generateCandidateWeeks() {
  const weeks = [];
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + DISCOVERY_LOOKAHEAD_WEEKS * 7);
  const end = isoWeek(endDate);
  let cursor = { ...DISCOVERY_START };

  while (compareWeeksAsc(formatWeek(cursor), formatWeek(end)) <= 0) {
    weeks.push(formatWeek(cursor));
    cursor = nextWeek(cursor);
  }
  return weeks;
}

function nextWeek({ year, week }) {
  const max = weeksInIsoYear(year);
  if (week < max) return { year, week: week + 1 };
  return { year: year + 1, week: 1 };
}

function weeksInIsoYear(year) {
  return isoWeek(new Date(Date.UTC(year, 11, 28))).week;
}

function isoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  return { year: target.getUTCFullYear(), week };
}

function formatWeek({ year, week }) {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function parseWeek(week) {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(week || ""));
  if (!match) return null;
  return { year: Number(match[1]), week: Number(match[2]) };
}

function addWeekIfValid(weeks, week) {
  if (parseWeek(week)) weeks.add(week);
}

function compareWeeksAsc(a, b) {
  const left = parseWeek(a);
  const right = parseWeek(b);
  if (!left || !right) return String(a).localeCompare(String(b));
  if (left.year !== right.year) return left.year - right.year;
  return left.week - right.week;
}

function compareWeeksDesc(a, b) {
  return -compareWeeksAsc(a, b);
}

function isIssue(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}

function normalizeIssue(data, fallbackWeek) {
  return {
    week: parseWeek(data.week) ? data.week : fallbackWeek,
    generated_at: typeof data.generated_at === "string" ? data.generated_at : "",
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    briefs: Array.isArray(data.briefs) ? data.briefs : [],
    source_gaps: Array.isArray(data.source_gaps) ? data.source_gaps : []
  };
}

function syncRoute() {
  const match = /^#\/week\/([^/]+)$/.exec(window.location.hash || "");
  const requestedWeek = match ? decodeURIComponent(match[1]) : null;
  if (requestedWeek && state.issues.some((issue) => issue.week === requestedWeek)) {
    state.selectedWeek = requestedWeek;
  } else if (state.issues.length > 0) {
    state.selectedWeek = state.issues[0].week;
  } else {
    state.selectedWeek = null;
  }
}

function render() {
  renderFilterButtons();
  renderStats();
  renderIssueList();
  renderIssueDetail();
}

function renderStats() {
  const highlightCount = state.issues.reduce((sum, issue) => sum + issue.highlights.length, 0);
  nodes.statIssueCount.textContent = String(state.issues.length);
  nodes.statHighlightCount.textContent = String(highlightCount);
  nodes.statLatestWeek.textContent = state.issues[0] ? state.issues[0].week : "--";
}

function renderIssueList() {
  if (state.issues.length === 0) {
    nodes.issueList.replaceChildren(emptyMini("暂无可展示的期数"));
    return;
  }

  const template = document.querySelector("#issueButtonTemplate");
  nodes.issueList.replaceChildren(
    ...state.issues.map((issue) => {
      const fragment = template.content.cloneNode(true);
      const link = fragment.querySelector("a");
      const title = issue.highlights[0] ? safeText(issue.highlights[0].name, "本期情报") : "本期无重点条目";
      link.href = `#/week/${encodeURIComponent(issue.week)}`;
      link.classList.toggle("is-active", issue.week === state.selectedWeek);
      fragment.querySelector(".issue-week").textContent = issue.week;
      fragment.querySelector(".issue-title").textContent = title;
      fragment.querySelector(".issue-meta").textContent = `${issue.highlights.length} 个重点 · ${issue.briefs.length} 条简讯`;
      return fragment;
    })
  );
}

function renderIssueDetail() {
  const issue = state.issues.find((item) => item.week === state.selectedWeek);
  if (!issue) {
    nodes.issueDetail.replaceChildren(emptyState("暂无情报数据", "当 `data/issues/YYYY-Www.json` 加入仓库后，站点会在下一次加载时自动尝试发现并展示。"));
    return;
  }

  const filteredHighlights = issue.highlights.filter(matchesFilters);
  const container = document.createDocumentFragment();
  container.append(issueHeader(issue, filteredHighlights.length));
  container.append(sectionTitle("重点条目", `${filteredHighlights.length}/${issue.highlights.length} 个匹配`));

  if (filteredHighlights.length === 0) {
    container.append(emptyState("没有匹配的条目", "调整主题类型或开发阶段筛选后再查看。"));
  } else {
    const list = document.createElement("div");
    list.className = "highlight-list";
    list.append(...filteredHighlights.map(highlightCard));
    container.append(list);
  }

  container.append(briefSection(issue.briefs));
  container.append(sourceGapSection(issue.source_gaps));
  nodes.issueDetail.replaceChildren(container);
}

function issueHeader(issue, filteredCount) {
  const header = document.createElement("header");
  header.className = "issue-header";

  const copy = document.createElement("div");
  copy.append(textBlock("eyebrow", "Issue"));
  const title = document.createElement("h2");
  title.id = "contentTitle";
  title.textContent = `${issue.week} 情报周报`;
  copy.append(title);
  const generated = document.createElement("p");
  generated.className = "hero-text";
  generated.textContent = issue.generated_at ? `生成时间：${formatDate(issue.generated_at)}` : "生成时间未提供";
  copy.append(generated);

  const stats = document.createElement("div");
  stats.className = "issue-summary";
  stats.append(summaryTile(String(issue.highlights.length), "重点条目"));
  stats.append(summaryTile(String(issue.briefs.length), "简讯"));
  stats.append(summaryTile(String(issue.source_gaps.length), "来源缺口"));
  stats.append(summaryTile(String(filteredCount), "当前匹配"));

  header.append(copy, stats);
  return header;
}

function summaryTile(value, label) {
  const tile = document.createElement("div");
  tile.className = "summary-tile";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  tile.append(strong, span);
  return tile;
}

function highlightCard(item) {
  const card = document.createElement("section");
  card.className = "highlight-card";

  const top = document.createElement("div");
  top.className = "highlight-top";

  const titleBlock = document.createElement("div");
  titleBlock.className = "highlight-title";
  const title = document.createElement("h3");
  title.textContent = safeText(item.name, "未命名条目");
  titleBlock.append(title, chipRow([
    chip(TYPE_LABELS[item.type] || safeText(item.type, "未分类"), "type"),
    chip(EVIDENCE_LABELS[item.evidence_tier] || safeText(item.evidence_tier, "证据未标注"), "evidence"),
    item.is_update ? chip("追踪更新", "update") : null
  ].filter(Boolean)));

  const stageTags = toArray(item.stage_tags).map((tag) => chip(STAGE_LABELS[tag] || tag));
  top.append(titleBlock, chipRow(stageTags));
  card.append(top);

  card.append(copyBlock("项目介绍", item.summary, "暂无项目介绍。"));

  const fields = document.createElement("div");
  fields.className = "field-grid";
  fields.append(fieldBox("证据要点", item.evidence_notes, "暂无证据说明。"));
  fields.append(fieldBox("推荐理由", item.recommendation, "暂无推荐理由。"));
  fields.append(fieldBox("使用范式", item.usage_paradigm, "暂无使用范式说明。"));
  fields.append(fieldBox("条目标识", item.id, "未提供 ID。"));
  card.append(fields);

  const competitors = toArray(item.competitors);
  if (competitors.length > 0) {
    card.append(listBlock("竞品对比", competitorList(competitors)));
  }

  const links = toArray(item.links).filter(Boolean);
  if (links.length > 0) {
    card.append(listBlock("来源链接", linkList(links)));
  }

  return card;
}

function chipRow(items) {
  const row = document.createElement("div");
  row.className = "chip-row";
  row.append(...items);
  return row;
}

function chip(label, variant = "") {
  const span = document.createElement("span");
  span.className = `chip${variant ? ` ${variant}` : ""}`;
  span.textContent = label;
  return span;
}

function copyBlock(title, value, fallback) {
  const block = document.createElement("div");
  block.className = "copy-block";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = safeText(value, fallback);
  block.append(heading, paragraph);
  return block;
}

function fieldBox(title, value, fallback) {
  const box = document.createElement("div");
  box.className = "field-box";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = safeText(value, fallback);
  box.append(heading, paragraph);
  return box;
}

function listBlock(title, list) {
  const block = document.createElement("div");
  block.className = "copy-block";
  const heading = document.createElement("h4");
  heading.textContent = title;
  block.append(heading, list);
  return block;
}

function competitorList(items) {
  const list = document.createElement("ul");
  list.className = "competitor-list";
  for (const item of items) {
    const li = document.createElement("li");
    li.append(linkOrText(item.link, safeText(item.name, "未命名竞品")));
    const verdict = document.createElement("p");
    verdict.textContent = safeText(item.verdict, "暂无对比结论。");
    li.append(verdict);
    list.append(li);
  }
  return list;
}

function linkList(links) {
  const list = document.createElement("ul");
  list.className = "link-list";
  for (const href of links) {
    const li = document.createElement("li");
    li.append(linkOrText(href, readableLink(href)));
    list.append(li);
  }
  return list;
}

function briefSection(briefs) {
  const fragment = document.createDocumentFragment();
  fragment.append(sectionTitle("简讯", `${briefs.length} 条`));
  if (briefs.length === 0) {
    fragment.append(emptyState("本期暂无简讯", "当期 JSON 中没有提供 briefs。"));
    return fragment;
  }

  const list = document.createElement("ul");
  list.className = "brief-list";
  for (const brief of briefs) {
    const li = document.createElement("li");
    li.append(linkOrText(brief.link, safeText(brief.name, "未命名简讯")));
    const p = document.createElement("p");
    p.textContent = safeText(brief.one_liner, "暂无一句话说明。");
    li.append(p);
    list.append(li);
  }
  fragment.append(list);
  return fragment;
}

function sourceGapSection(gaps) {
  const fragment = document.createDocumentFragment();
  fragment.append(sectionTitle("来源缺口", `${gaps.length} 项`));
  if (gaps.length === 0) {
    fragment.append(emptyState("本期无来源缺口", "结构化数据未记录采集失败或不可访问来源。"));
    return fragment;
  }

  const list = document.createElement("ul");
  list.className = "gap-list";
  for (const gap of gaps) {
    const li = document.createElement("li");
    const p = document.createElement("p");
    p.textContent = safeText(gap, "未说明的来源缺口。");
    li.append(p);
    list.append(li);
  }
  fragment.append(list);
  return fragment;
}

function sectionTitle(title, meta) {
  const row = document.createElement("div");
  row.className = "section-title";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const span = document.createElement("span");
  span.textContent = meta;
  row.append(heading, span);
  return row;
}

function emptyState(title, message) {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const p = document.createElement("p");
  p.textContent = message;
  wrapper.append(heading, p);
  return wrapper;
}

function emptyMini(message) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = message;
  return div;
}

function textBlock(className, value) {
  const p = document.createElement("p");
  p.className = className;
  p.textContent = value;
  return p;
}

function matchesFilters(item) {
  const typeOk = state.filters.type === "all" || item.type === state.filters.type;
  if (!typeOk) return false;
  if (state.filters.stage === "all") return true;
  const accepted = STAGE_GROUP_MAP[state.filters.stage] || new Set();
  return toArray(item.stage_tags).some((tag) => accepted.has(tag));
}

function setStatus(message, isError = false) {
  nodes.statusBar.textContent = message;
  nodes.statusBar.classList.toggle("is-error", isError);
}

function statusMessage() {
  if (state.issues.length === 0) {
    return "未发现可读取的期数。请添加 data/issues/YYYY-Www.json 后刷新。";
  }
  if (state.ledger.length === 0) {
    return "已读取期数数据；ledger.json 缺失或为空，站点按契约降级展示。";
  }
  return "数据读取完成。";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function safeText(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function linkOrText(href, label) {
  if (!href || !isSafeHref(href)) {
    const span = document.createElement("span");
    span.textContent = label;
    return span;
  }
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  return a;
}

function isSafeHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function readableLink(href) {
  try {
    const url = new URL(href);
    return `${url.hostname}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return String(href);
  }
}
