const DATA_ROOT = "../data";
const ISSUE_ROOT = `${DATA_ROOT}/issues`;
const ISSUE_INDEX_URL = `${ISSUE_ROOT}/index.json`;
const FALLBACK_RECENT_DAYS = 3;
const PREFETCH_RECENT_LIMIT = 14;
const DISCOVERY_CONCURRENCY = 6;

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
  issueDates: [],
  issueCache: new Map(),
  issueErrors: new Map(),
  pendingDates: new Set(),
  selectedDate: null,
  loadErrors: [],
  routeNotice: "",
  discoveryMode: "index",
  ledgerSupplementCount: 0,
  filters: {
    type: "all",
    stage: "all"
  }
};

const nodes = {
  archiveShell: document.querySelector("#archiveShell"),
  issueList: document.querySelector("#issueList"),
  issueDetail: document.querySelector("#issueDetail"),
  statusBar: document.querySelector("#statusBar"),
  typeFilters: document.querySelector("#typeFilters"),
  stageFilters: document.querySelector("#stageFilters"),
  statIssueCount: document.querySelector("#statIssueCount"),
  statHighlightCount: document.querySelector("#statHighlightCount"),
  statLatestDate: document.querySelector("#statLatestDate")
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", async () => {
  syncRoute();
  setStatus(statusMessage(), hasVisibleError());
  render();
  if (state.selectedDate) {
    await loadIssueByDate(state.selectedDate);
    setStatus(statusMessage(), hasVisibleError());
    render();
  }
});

async function init() {
  renderFilterButtons();
  setArchiveDefaultOpen();

  state.loadErrors = [];
  state.issueCache = new Map();
  state.issueErrors = new Map();
  state.pendingDates = new Set();
  state.ledger = await loadLedger();
  const discovery = await discoverIssueDates(state.ledger);
  state.issueDates = discovery.dates;
  state.discoveryMode = discovery.mode;
  state.ledgerSupplementCount = discovery.ledgerSupplementCount;
  state.loadErrors.push(...discovery.errors);

  const initialHash = window.location.hash;
  syncRoute();
  if (!initialHash && state.selectedDate) {
    history.replaceState(null, "", `#/date/${state.selectedDate}`);
  }

  setStatus(statusMessage(), hasVisibleError());
  render();

  if (state.selectedDate) {
    await loadIssueByDate(state.selectedDate);
    setStatus(statusMessage(), hasVisibleError());
    render();
    prefetchRecentIssues();
  }
}

function setArchiveDefaultOpen() {
  if (!nodes.archiveShell) return;
  nodes.archiveShell.open = window.matchMedia("(min-width: 740px)").matches;
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
  try {
    const result = await fetchJson(`${DATA_ROOT}/ledger.json`, { optional: true });
    return Array.isArray(result) ? result.filter(isPlainObject) : [];
  } catch (error) {
    state.loadErrors.push(errorMessage(error));
    return [];
  }
}

async function discoverIssueDates(ledger) {
  const errors = [];
  const dates = new Set();
  const index = await loadIssueIndex();
  let mode = index.loaded ? "index" : "fallback";

  if (index.error) errors.push(index.error);
  for (const date of index.dates) dates.add(date);

  const beforeLedger = dates.size;
  addLedgerDates(dates, ledger);
  const ledgerSupplementCount = dates.size - beforeLedger;

  if (!index.loaded && dates.size === 0) {
    const fallback = await discoverRecentIssues();
    for (const date of fallback.dates) dates.add(date);
    errors.push(...fallback.errors);
  }

  return {
    dates: Array.from(dates).sort(compareDatesDesc),
    errors,
    mode,
    ledgerSupplementCount
  };
}

async function loadIssueIndex() {
  try {
    const result = await fetchJson(ISSUE_INDEX_URL, { optional: true });
    if (result === null) return { loaded: false, dates: [], error: "" };
    if (!Array.isArray(result)) {
      return { loaded: false, dates: [], error: "解析 data/issues/index.json 失败：日期清单必须是数组。" };
    }
    return {
      loaded: true,
      dates: uniqueValidDates(result),
      error: ""
    };
  } catch (error) {
    return { loaded: false, dates: [], error: errorMessage(error) };
  }
}

function addLedgerDates(dates, ledger) {
  for (const item of Array.isArray(ledger) ? ledger : []) {
    addDateIfValid(dates, item && item.first_reported);
    const updates = Array.isArray(item && item.last_updates) ? item.last_updates : [];
    for (const update of updates) {
      addDateIfValid(dates, update && update.date);
    }
  }
}

async function discoverRecentIssues() {
  const recentDates = recentIsoDates(FALLBACK_RECENT_DAYS);
  const results = await mapWithConcurrency(
    recentDates,
    DISCOVERY_CONCURRENCY,
    (date) => fetchIssueForDiscovery(date)
  );
  const dates = [];
  const errors = [];
  for (const result of results) {
    if (!result) continue;
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    if (result.issue) {
      state.issueCache.set(result.issue.date, result.issue);
      dates.push(result.issue.date);
    }
  }
  return { dates, errors };
}

async function fetchIssueForDiscovery(date) {
  const url = `${ISSUE_ROOT}/${date}.json`;
  try {
    const data = await fetchJson(url, { optional: true });
    if (!isIssue(data)) return null;
    return { issue: normalizeIssue(data, date) };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

async function loadIssueByDate(date) {
  if (!parseIsoDate(date) || state.issueCache.has(date) || state.pendingDates.has(date)) return;

  state.pendingDates.add(date);
  state.issueErrors.delete(date);
  render();

  const url = `${ISSUE_ROOT}/${date}.json`;
  try {
    const data = await fetchJson(url);
    if (!isIssue(data)) throw new Error(`解析 ${url} 失败：JSON 顶层必须是对象`);
    const issue = normalizeIssue(data, date);
    state.issueCache.set(issue.date, issue);
    if (issue.date !== date) {
      state.issueCache.set(date, issue);
    }
  } catch (error) {
    const message = errorMessage(error);
    state.issueErrors.set(date, message);
    addLoadError(message);
  } finally {
    state.pendingDates.delete(date);
  }
}

function prefetchRecentIssues() {
  const dates = state.issueDates
    .filter((date) => !state.issueCache.has(date) && !state.issueErrors.has(date))
    .slice(0, PREFETCH_RECENT_LIMIT);
  if (dates.length === 0) return;

  setTimeout(async () => {
    await mapWithConcurrency(dates, DISCOVERY_CONCURRENCY, async (date) => {
      await loadIssueByDate(date);
    });
    setStatus(statusMessage(), hasVisibleError());
    render();
  }, 0);
}

async function fetchJson(url, { optional = false } = {}) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    throw new Error(`无法连接 ${url}：${error instanceof Error ? error.message : "网络异常"}`);
  }

  if (!response.ok) {
    if (optional && [404, 410].includes(response.status)) return null;
    throw new Error(`读取 ${url} 失败：HTTP ${response.status}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`解析 ${url} 失败：${error instanceof Error ? error.message : "JSON 格式错误"}`);
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.min(Math.max(limit, 1), items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function todayIsoDate() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

function recentIsoDates(days) {
  const today = parseIsoDate(todayIsoDate());
  if (!today) return [];
  return Array.from({ length: days }, (_, offset) => formatIsoDate(addUtcDays(today, -offset)));
}

function parseIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatIsoDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addDateIfValid(dates, date) {
  if (parseIsoDate(date)) dates.add(date);
}

function uniqueValidDates(value) {
  const dates = new Set();
  for (const item of toArray(value)) {
    addDateIfValid(dates, item);
  }
  return Array.from(dates);
}

function compareDatesAsc(a, b) {
  const left = parseIsoDate(a);
  const right = parseIsoDate(b);
  if (!left || !right) return String(a).localeCompare(String(b));
  return left.getTime() - right.getTime();
}

function compareDatesDesc(a, b) {
  return -compareDatesAsc(a, b);
}

function isIssue(data) {
  return isPlainObject(data);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeIssue(data, fallbackDate) {
  const date = parseIsoDate(data.date) ? data.date : fallbackDate;
  return {
    date,
    generated_at: typeof data.generated_at === "string" ? data.generated_at : "",
    highlights: normalizeHighlights(data.highlights),
    briefs: normalizeBriefs(data.briefs),
    source_gaps: toArray(data.source_gaps).map((gap) => String(gap)).filter(Boolean)
  };
}

function normalizeHighlights(value) {
  return toArray(value)
    .filter(isPlainObject)
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      evidence_tier: item.evidence_tier,
      evidence_notes: item.evidence_notes,
      summary: item.summary,
      competitors: toArray(item.competitors).filter(isPlainObject),
      recommendation: item.recommendation,
      usage_paradigm: item.usage_paradigm,
      stage_tags: toArray(item.stage_tags).map((tag) => String(tag)).filter(Boolean),
      is_update: Boolean(item.is_update),
      links: toArray(item.links).map((link) => String(link)).filter(Boolean)
    }));
}

function normalizeBriefs(value) {
  return toArray(value)
    .filter(isPlainObject)
    .map((brief) => ({
      name: brief.name,
      one_liner: brief.one_liner,
      link: brief.link
    }));
}

function syncRoute() {
  state.routeNotice = "";
  const hash = window.location.hash || "";
  const match = /^#\/date\/([^/]+)$/.exec(hash);
  const requestedDate = match ? safeDecode(match[1]) : null;

  if (requestedDate && state.issueDates.includes(requestedDate)) {
    state.selectedDate = requestedDate;
    return;
  }

  state.selectedDate = state.issueDates.length > 0 ? state.issueDates[0] : null;

  if (!hash || hash === "#/") return;

  if (requestedDate) {
    state.routeNotice = parseIsoDate(requestedDate)
      ? `未找到 ${requestedDate} 的日报，已显示最新日报。`
      : "日期路由格式无效，已显示最新日报。";
    return;
  }

  state.routeNotice = "未识别的路由，已显示最新日报。";
}

function render() {
  renderFilterButtons();
  renderStats();
  renderIssueList();
  renderIssueDetail();
}

function renderStats() {
  const highlightCount = Array.from(state.issueCache.values())
    .filter(uniqueIssueByDate())
    .reduce((sum, issue) => sum + issue.highlights.length, 0);
  nodes.statIssueCount.textContent = String(state.issueDates.length);
  nodes.statHighlightCount.textContent = String(highlightCount);
  nodes.statLatestDate.textContent = state.issueDates[0] || "--";
}

function renderIssueList() {
  if (state.issueDates.length === 0) {
    nodes.issueList.replaceChildren(emptyMini("暂无可展示的日报"));
    return;
  }

  const groups = groupDatesByMonth(state.issueDates);
  const latestMonth = state.issueDates[0].slice(0, 7);
  const selectedMonth = state.selectedDate ? state.selectedDate.slice(0, 7) : latestMonth;
  nodes.issueList.replaceChildren(
    ...groups.map(([month, dates]) => issueMonthGroup(month, dates, latestMonth, selectedMonth))
  );
}

function groupDatesByMonth(dates) {
  const groups = new Map();
  for (const date of dates) {
    const month = date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(date);
  }
  return Array.from(groups.entries());
}

function issueMonthGroup(month, dates, latestMonth, selectedMonth) {
  const details = document.createElement("details");
  details.className = "issue-month";
  details.open = month === latestMonth || month === selectedMonth;

  const summary = document.createElement("summary");
  const label = document.createElement("span");
  label.textContent = monthLabel(month);
  const count = document.createElement("strong");
  count.textContent = `${dates.length} 期`;
  summary.append(label, count);

  const list = document.createElement("div");
  list.className = "issue-month-list";
  list.append(...dates.map(issueLink));

  details.append(summary, list);
  return details;
}

function issueLink(date) {
  const template = document.querySelector("#issueButtonTemplate");
  const fragment = template.content.cloneNode(true);
  const link = fragment.querySelector("a");
  const issue = state.issueCache.get(date);
  const error = state.issueErrors.get(date);
  const isPending = state.pendingDates.has(date);
  const title = issue && issue.highlights[0] ? safeText(issue.highlights[0].name, "本期情报") : "点击查看日报";
  link.href = `#/date/${encodeURIComponent(date)}`;
  link.classList.toggle("is-active", date === state.selectedDate);
  if (date === state.selectedDate) link.setAttribute("aria-current", "page");
  fragment.querySelector(".issue-date").textContent = date;
  fragment.querySelector(".issue-title").textContent = title;
  fragment.querySelector(".issue-meta").textContent = issue
    ? `${issue.highlights.length} 重点 · ${issue.briefs.length} 简讯`
    : error
      ? "读取失败"
      : isPending
        ? "正在读取"
        : "按需加载";
  return fragment;
}

function renderIssueDetail() {
  if (!state.selectedDate) {
    const message = state.loadErrors.length > 0
      ? "部分数据读取失败，详情见上方状态栏。修复 JSON 后刷新即可恢复。"
      : "当 `data/issues/index.json` 与 `data/issues/YYYY-MM-DD.json` 加入仓库后，站点会在下一次加载时自动发现并展示。";
    nodes.issueDetail.replaceChildren(emptyState("暂无情报数据", message));
    return;
  }

  if (state.pendingDates.has(state.selectedDate)) {
    nodes.issueDetail.replaceChildren(emptyState("正在读取日报", `${state.selectedDate} 的结构化数据正在加载。`));
    return;
  }

  const issueError = state.issueErrors.get(state.selectedDate);
  if (issueError) {
    nodes.issueDetail.replaceChildren(emptyState("日报读取失败", issueError));
    return;
  }

  const issue = state.issueCache.get(state.selectedDate);
  if (!issue) {
    nodes.issueDetail.replaceChildren(emptyState("尚未读取日报", "选择日期后将按需读取对应 JSON。"));
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
  copy.append(textBlock("eyebrow", "Daily Issue"));
  const title = document.createElement("h2");
  title.id = "contentTitle";
  title.textContent = `${issue.date} 情报日报`;
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

  const competitors = toArray(item.competitors).filter(isPlainObject);
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
  if (!isPlainObject(item)) return false;
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
  const messages = [];
  if (state.routeNotice) messages.push(state.routeNotice);

  if (state.issueDates.length === 0) {
    messages.push("未发现可读取的日报。请添加 data/issues/index.json 与 data/issues/YYYY-MM-DD.json 后刷新。");
  } else if (state.discoveryMode === "fallback") {
    messages.push(`日期清单缺失，已用降级策略发现 ${state.issueDates.length} 期日报；已加载 ${loadedIssueCount()} 期详情。`);
  } else if (state.ledger.length === 0) {
    messages.push(`已从日期清单发现 ${state.issueDates.length} 期日报；已加载 ${loadedIssueCount()} 期详情；ledger.json 缺失或为空，站点按契约降级展示。`);
  } else {
    const supplement = state.ledgerSupplementCount > 0 ? `，ledger 补充 ${state.ledgerSupplementCount} 期` : "";
    messages.push(`已从日期清单发现 ${state.issueDates.length} 期日报${supplement}；已加载 ${loadedIssueCount()} 期详情。`);
  }

  if (state.loadErrors.length > 0) {
    const sample = state.loadErrors.slice(0, 3).join("；");
    const suffix = state.loadErrors.length > 3 ? `；另有 ${state.loadErrors.length - 3} 项` : "";
    messages.push(`读取异常 ${state.loadErrors.length} 项：${sample}${suffix}`);
  }

  return messages.join(" ");
}

function hasVisibleError() {
  return state.loadErrors.length > 0 || Boolean(state.routeNotice);
}

function loadedIssueCount() {
  return Array.from(state.issueCache.values()).filter(uniqueIssueByDate()).length;
}

function uniqueIssueByDate() {
  const seen = new Set();
  return (issue) => {
    if (!issue || seen.has(issue.date)) return false;
    seen.add(issue.date);
    return true;
  };
}

function monthLabel(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return `${match[1]} 年 ${match[2]} 月`;
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
  const safeLabel = safeText(label, "未命名链接");
  if (!href || !isSafeHref(href)) {
    const span = document.createElement("span");
    span.textContent = safeLabel;
    return span;
  }
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = href;
  a.textContent = safeLabel;
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

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function addLoadError(message) {
  if (message && !state.loadErrors.includes(message)) {
    state.loadErrors.push(message);
  }
}
