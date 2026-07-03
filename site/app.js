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

const TYPE_COLOR_VAR = {
  skill: "var(--cat-skill)",
  mcp: "var(--cat-mcp)",
  rules: "var(--cat-rules)",
  hooks: "var(--cat-hooks)",
  subagent: "var(--cat-subagent)",
  "prompt-lib": "var(--cat-promptlib)",
  paradigm: "var(--cat-paradigm)"
};

const TYPE_ORDER = TYPE_OPTIONS
  .map(([value]) => value)
  .filter((value) => value !== "all");
const TYPE_RANK = new Map(TYPE_ORDER.map((value, index) => [value, index]));
const SVG_NS = "http://www.w3.org/2000/svg";
const OVERVIEW_BULLET_LIMIT = 3;
const OVERVIEW_NOTE_MAX_LENGTH = 54;

let overviewDisclosureId = 0;

const state = {
  ledger: [],
  issueDates: [],
  issueCache: new Map(),
  issueErrors: new Map(),
  pendingDates: new Set(),
  view: "date",
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
  stageFilterGroup: document.querySelector("#stageFilters")?.closest(".filter-group"),
  siteNavLinks: Array.from(document.querySelectorAll("[data-view-link]")),
  statIssueCount: document.querySelector("#statIssueCount"),
  statHighlightCount: document.querySelector("#statHighlightCount"),
  statLatestDate: document.querySelector("#statLatestDate")
};

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", async () => {
  syncRoute();
  setStatus(statusMessage(), hasVisibleError());
  render();
  if (shouldLoadSelectedIssue()) {
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
  if (!initialHash && state.view === "date" && state.selectedDate) {
    history.replaceState(null, "", `#/date/${state.selectedDate}`);
  }

  setStatus(statusMessage(), hasVisibleError());
  render();

  if (shouldLoadSelectedIssue()) {
    await loadIssueByDate(state.selectedDate);
    setStatus(statusMessage(), hasVisibleError());
    render();
    prefetchRecentIssues();
  }
}

function shouldLoadSelectedIssue() {
  return state.view === "date" && Boolean(state.selectedDate);
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
    return normalizeLedgerItems(result);
  } catch (error) {
    state.loadErrors.push(errorMessage(error));
    return [];
  }
}

function normalizeLedgerItems(value) {
  return toArray(value)
    .filter(isPlainObject)
    .map((item) => {
      const links = toArray(item.links).map((link) => String(link)).filter(Boolean);
      const lastUpdates = normalizeLedgerUpdates(item.last_updates);
      const latestUpdate = latestLedgerUpdate(lastUpdates);
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        evidence_tier: item.evidence_tier,
        first_reported: item.first_reported,
        last_updates: lastUpdates,
        latest_update: latestUpdate,
        state_snapshot: item.state_snapshot,
        stage_tags: toArray(item.stage_tags).map((tag) => String(tag)).filter(Boolean),
        links,
        primary_link: links.find(isSafeHref) || "",
        sort_date: latestUpdate && latestUpdate.date ? latestUpdate.date : item.first_reported
      };
    });
}

function normalizeLedgerUpdates(value) {
  return toArray(value)
    .filter(isPlainObject)
    .map((update) => ({
      date: update.date,
      note: update.note
    }))
    .filter((update) => update.date || update.note);
}

function latestLedgerUpdate(updates) {
  return updates.slice().sort((left, right) => compareDatesDesc(left.date, right.date))[0] || null;
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

function normalizeGistString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
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
      gist: normalizeGistString(item.gist),
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
  if (hash === "#/catalog") {
    state.view = "catalog";
    state.selectedDate = state.issueDates.length > 0 ? state.issueDates[0] : null;
    return;
  }

  state.view = "date";
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
  renderToolbarState();
  renderSiteNavigation();
  if (state.view === "catalog") {
    renderCatalog();
  } else {
    renderIssueDetail();
  }
}

function renderToolbarState() {
  if (nodes.stageFilterGroup) {
    nodes.stageFilterGroup.hidden = state.view === "catalog";
  }
}

function renderSiteNavigation() {
  for (const link of nodes.siteNavLinks) {
    const isCurrent = link.dataset.viewLink === state.view;
    link.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function renderStats() {
  const catalogCount = Array.isArray(state.ledger) ? state.ledger.length : 0;
  const latestDate = state.issueDates[0] || "--";
  nodes.statIssueCount.textContent = String(state.issueDates.length);
  nodes.statHighlightCount.textContent = String(catalogCount);
  nodes.statLatestDate.textContent = latestDate;
  if (state.issueDates[0]) {
    nodes.statLatestDate.setAttribute("datetime", state.issueDates[0]);
  } else {
    nodes.statLatestDate.removeAttribute("datetime");
  }
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
  const isCurrentDate = state.view === "date" && date === state.selectedDate;
  link.href = `#/date/${encodeURIComponent(date)}`;
  link.classList.toggle("is-active", isCurrentDate);
  if (isCurrentDate) link.setAttribute("aria-current", "page");
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
  container.append(overviewBoard(issue, filteredHighlights));
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

function renderCatalog() {
  const allItems = Array.isArray(state.ledger) ? state.ledger : [];
  const filteredItems = allItems
    .filter(matchesCatalogFilters)
    .sort(compareCatalogItems);

  const container = document.createDocumentFragment();
  container.append(catalogHeader(filteredItems.length, allItems.length));

  if (allItems.length === 0) {
    container.append(emptyState("暂无已收录资产", "data/ledger.json 缺失或为空；站点已按契约降级展示。"));
    nodes.issueDetail.replaceChildren(container);
    return;
  }

  if (filteredItems.length === 0) {
    container.append(emptyState("没有匹配的资产", "调整主题类型筛选后再查看已收录资产。"));
    nodes.issueDetail.replaceChildren(container);
    return;
  }

  const list = document.createElement("ul");
  list.className = "catalog-list";
  list.append(...filteredItems.map(catalogCard));
  container.append(list);
  nodes.issueDetail.replaceChildren(container);
}

function catalogHeader(filteredCount, totalCount) {
  const header = document.createElement("header");
  header.className = "catalog-header";

  const copy = document.createElement("div");
  copy.append(textBlock("eyebrow", "Asset Catalog"));
  const title = document.createElement("h2");
  title.id = "contentTitle";
  title.textContent = "已收录资产";
  copy.append(title);
  const description = document.createElement("p");
  description.className = "hero-text";
  description.textContent = "只读消费 ledger.json，按主题类型浏览已进入 Star-Skill Radar 的 skills、MCP、rules、hooks、subagents、提示词库与工作范式。";
  copy.append(description);

  const stats = document.createElement("div");
  stats.className = "issue-summary catalog-summary";
  stats.append(summaryTile(String(totalCount), "资产总数"));
  stats.append(summaryTile(String(filteredCount), "当前匹配"));
  stats.append(summaryTile(String(catalogTrackedCount()), "追踪更新"));
  stats.append(summaryTile(String(catalogTypeCount()), "覆盖类型"));

  header.append(copy, stats);
  return header;
}

function catalogTrackedCount() {
  return state.ledger.filter((item) => toArray(item.last_updates).length > 0).length;
}

function catalogTypeCount() {
  return new Set(state.ledger.map((item) => item.type).filter(Boolean)).size;
}

function matchesCatalogFilters(item) {
  if (!isPlainObject(item)) return false;
  return state.filters.type === "all" || item.type === state.filters.type;
}

function compareCatalogItems(left, right) {
  const leftDate = parseIsoDate(left.sort_date);
  const rightDate = parseIsoDate(right.sort_date);
  if (leftDate && rightDate) {
    const byDate = rightDate.getTime() - leftDate.getTime();
    if (byDate !== 0) return byDate;
  } else if (leftDate) {
    return -1;
  } else if (rightDate) {
    return 1;
  }
  return safeText(left.name || left.id, "").localeCompare(safeText(right.name || right.id, ""), "zh-CN");
}

function catalogCard(item) {
  const li = document.createElement("li");
  li.className = "catalog-card";
  if (TYPE_COLOR_VAR[item.type]) li.style.setProperty("--cat-color", TYPE_COLOR_VAR[item.type]);

  const top = document.createElement("div");
  top.className = "catalog-card-top";
  const titleBlock = document.createElement("div");
  titleBlock.className = "catalog-title";
  const title = document.createElement("h3");
  title.textContent = safeText(item.name || item.id, "未命名资产");
  const typeChipClass = TYPE_LABELS[item.type] ? `cat-${item.type}` : "";
  titleBlock.append(title, chipRow([
    chip(TYPE_LABELS[item.type] || safeText(item.type, "未分类"), typeChipClass),
    chip(EVIDENCE_LABELS[item.evidence_tier] || safeText(item.evidence_tier, "证据未标注"), "evidence"),
    item.latest_update ? chip("追踪更新", "update") : null
  ].filter(Boolean)));
  top.append(titleBlock);
  li.append(top);

  const meta = document.createElement("dl");
  meta.className = "catalog-meta";
  meta.append(catalogMeta("首次收录", safeText(item.first_reported, "未标注")));
  meta.append(catalogMeta("资产标识", safeText(item.id, "未提供 ID")));
  if (item.latest_update) {
    meta.append(catalogMeta("最近更新", safeText(item.latest_update.date, "日期未标注")));
  }
  li.append(meta);

  if (item.latest_update) {
    const update = document.createElement("p");
    update.className = "catalog-update-note";
    update.textContent = `追踪更新：${safeText(item.latest_update.note, "本资产有后续更新记录。")}`;
    li.append(update);
  }

  const linkRow = document.createElement("div");
  linkRow.className = "catalog-link-row";
  const linkLabel = item.primary_link ? readableLink(item.primary_link) : "未提供可访问主链接";
  linkRow.append(linkOrText(item.primary_link, linkLabel));
  li.append(linkRow);

  return li;
}

function catalogMeta(label, value) {
  const fragment = document.createDocumentFragment();
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  fragment.append(dt, dd);
  return fragment;
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

function overviewBoard(issue, highlights) {
  const section = document.createElement("section");
  section.className = "overview-board";
  section.setAttribute("aria-label", "今日摘要看板");

  const totalCount = highlights.length + issue.briefs.length;
  if (totalCount === 0) {
    section.append(sectionTitle("今日摘要", "暂无条目"));
    section.append(emptyMini("今日暂无可展示的情报条目"));
    return section;
  }

  section.append(sectionTitle("今日摘要", "点击任意条目跳转至完整卡片"));
  const groupedHighlights = groupHighlightsByType(highlights, highlights[0] && highlights[0].type);
  section.append(overviewMasthead(totalCount, highlights, issue.briefs, groupedHighlights.length));

  const grid = document.createElement("div");
  grid.className = "overview-grid";
  for (const [type, items] of groupedHighlights) {
    grid.append(overviewCategoryCard(type, items));
  }
  if (issue.briefs.length > 0) {
    grid.append(overviewBriefsCard(issue.briefs));
  }
  section.append(grid);

  return section;
}

function overviewMasthead(totalCount, highlights, briefs, categoryCount) {
  const masthead = document.createElement("div");
  masthead.className = "overview-lede";

  const total = document.createElement("div");
  total.className = "overview-total";
  const totalNumber = document.createElement("strong");
  totalNumber.textContent = String(totalCount);
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "条情报";
  total.append(totalNumber, totalLabel);

  const summary = document.createElement("div");
  summary.className = "overview-breakdown";
  summary.append(
    overviewPill("重点", highlights.length),
    overviewPill("简讯", briefs.length),
    overviewPill("类目", categoryCount)
  );

  const headliner = document.createElement("p");
  headliner.className = "overview-headline";
  const headlineName = highlights[0]
    ? safeText(highlights[0].name, "")
    : briefs[0]
      ? safeText(briefs[0].name, "")
      : "";
  headliner.textContent = headlineName ? `头条：${headlineName}` : "头条：暂无";

  masthead.append(total, summary, headliner);
  return masthead;
}

function overviewPill(label, value) {
  const pill = document.createElement("span");
  pill.className = "overview-pill";
  const strong = document.createElement("strong");
  strong.textContent = String(value);
  pill.append(document.createTextNode(label), strong);
  return pill;
}

function groupHighlightsByType(highlights, headlinerType = "") {
  const groups = new Map();
  for (const item of highlights) {
    if (!isPlainObject(item)) continue;
    const key = TYPE_LABELS[item.type] ? item.type : "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Array.from(groups.entries()).sort(([typeA, itemsA], [typeB, itemsB]) => {
    if (typeA === headlinerType && typeB !== headlinerType) return -1;
    if (typeB === headlinerType && typeA !== headlinerType) return 1;
    if (itemsA.length !== itemsB.length) return itemsB.length - itemsA.length;
    return typeRank(typeA) - typeRank(typeB);
  });
}

function typeRank(type) {
  return TYPE_RANK.has(type) ? TYPE_RANK.get(type) : TYPE_ORDER.length;
}

function overviewCategoryCard(type, items) {
  const card = document.createElement("div");
  card.className = "overview-category";
  if (TYPE_COLOR_VAR[type]) card.style.setProperty("--cat-color", TYPE_COLOR_VAR[type]);
  card.append(overviewCategoryHead(type, TYPE_LABELS[type] || "其他", items.length));

  const list = document.createElement("ul");
  list.className = "overview-bullets";
  list.append(...items.slice(0, OVERVIEW_BULLET_LIMIT).map(overviewBulletItem));
  card.append(list);

  const remaining = items.length - OVERVIEW_BULLET_LIMIT;
  if (remaining > 0) {
    card.append(overviewDisclosure(remaining, items.slice(OVERVIEW_BULLET_LIMIT), overviewBulletItem));
  }

  return card;
}

function overviewBriefsCard(briefs) {
  const card = document.createElement("div");
  card.className = "overview-category overview-briefs";
  card.append(overviewCategoryHead("briefs", "简讯", briefs.length));

  const list = document.createElement("ul");
  list.className = "overview-bullets";
  list.append(...briefs.slice(0, OVERVIEW_BULLET_LIMIT).map(overviewBriefBulletItem));
  card.append(list);

  const remaining = briefs.length - OVERVIEW_BULLET_LIMIT;
  if (remaining > 0) {
    card.append(overviewDisclosure(remaining, briefs.slice(OVERVIEW_BULLET_LIMIT), overviewBriefBulletItem));
  }

  return card;
}

function overviewCategoryHead(type, label, count) {
  const head = document.createElement("div");
  head.className = "overview-category-head";

  const h4 = document.createElement("h4");
  const badge = document.createElement("span");
  badge.className = "overview-icon-badge";
  const colorVar = TYPE_COLOR_VAR[type];
  if (colorVar) badge.style.setProperty("--cat-color", colorVar);
  badge.append(overviewIcon(type));
  h4.append(badge, document.createTextNode(label));

  const countEl = document.createElement("span");
  countEl.className = "overview-category-count";
  countEl.textContent = `${count} 条`;

  head.append(h4, countEl);
  return head;
}

function overviewIcon(type) {
  const paths = {
    skill: [
      "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z",
      "M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"
    ],
    mcp: [
      "M5 5h5v5H5z",
      "M14 5h5v5h-5z",
      "M5 14h5v5H5z",
      "M10 7.5h4",
      "M7.5 10v4",
      "M16.5 10v2a2 2 0 0 1-2 2H10"
    ],
    rules: [
      "M7 5h11",
      "M7 10h11",
      "M7 15h8",
      "M4 5h.01",
      "M4 10h.01",
      "M4 15h.01"
    ],
    hooks: [
      "M8 5v8a4 4 0 0 0 8 0v-1",
      "M16 5v7",
      "M12 5h8"
    ],
    subagent: [
      "M12 7a3 3 0 1 0 0.01 0",
      "M6 20a6 6 0 0 1 12 0",
      "M4 11h2",
      "M18 11h2",
      "M12 2v2"
    ],
    "prompt-lib": [
      "M5 5h14v10H8l-3 3V5Z",
      "M9 9h6",
      "M9 12h4"
    ],
    paradigm: [
      "M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7l7-4Z",
      "M9 12l2 2 4-5"
    ],
    briefs: [
      "M5 4h11l3 3v13H5z",
      "M16 4v4h4",
      "M8 11h8",
      "M8 15h8",
      "M8 18h5"
    ],
    chevron: ["M6 9l6 6 6-6"],
    other: ["M12 5v14", "M5 12h14"]
  };
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.9");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const d of paths[type] || paths.other) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

function overviewDisclosure(remaining, items, renderer) {
  const fragment = document.createDocumentFragment();
  const panelId = `overview-extra-${++overviewDisclosureId}`;
  const button = overviewMoreButton(remaining, panelId);
  const buttonText = button.querySelector(".overview-more-text");

  const panel = document.createElement("div");
  panel.id = panelId;
  panel.className = "overview-extra";
  panel.hidden = true;

  const list = document.createElement("ul");
  list.className = "overview-bullets overview-bullets-extra";
  list.append(...items.map(renderer));
  panel.append(list);

  const setExpanded = (expanded) => {
    if (!expanded && panel.contains(document.activeElement)) {
      button.focus({ preventScroll: true });
    }
    button.setAttribute("aria-expanded", String(expanded));
    panel.hidden = !expanded;
    buttonText.textContent = expanded ? "收起，回到前 3 条" : `展开其余 ${remaining} 条`;
  };

  button.addEventListener("click", () => {
    setExpanded(button.getAttribute("aria-expanded") !== "true");
  });

  fragment.append(button, panel);
  return fragment;
}

function overviewMoreButton(remaining, panelId) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "overview-more";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", panelId);
  const text = document.createElement("span");
  text.className = "overview-more-text";
  text.textContent = `展开其余 ${remaining} 条`;
  const icon = document.createElement("span");
  icon.className = "overview-more-icon";
  icon.append(overviewIcon("chevron"));
  button.append(text, icon);
  return button;
}

function overviewBulletItem(item) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "overview-bullet";
  button.append(overviewBulletTitle(safeText(item.name, "未命名条目")));
  const note = overviewHighlightNote(item);
  if (note.text) button.append(overviewBulletNote(note.text, note.isGist));
  button.addEventListener("click", () => scrollToHighlight(item));
  li.append(button);
  return li;
}

function overviewBriefBulletItem(brief) {
  const li = document.createElement("li");
  const note = safeText(brief.one_liner, "").trim();
  if (brief.link && isSafeHref(brief.link)) {
    const a = document.createElement("a");
    a.className = "overview-bullet";
    a.href = brief.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("data-external", "");
    a.append(overviewBulletTitle(safeText(brief.name, "未命名简讯")));
    if (note) a.append(overviewBulletNote(note));
    li.append(a);
  } else {
    li.append(overviewBulletTitle(safeText(brief.name, "未命名简讯")));
  }
  return li;
}

function overviewHighlightNote(item) {
  if (item && item.gist) return { text: item.gist, isGist: true };
  return { text: semanticExcerpt(item && item.summary), isGist: false };
}

function overviewBulletTitle(text) {
  const span = document.createElement("span");
  span.className = "overview-bullet-title";
  span.textContent = text;
  return span;
}

function overviewBulletNote(text, isGist = false) {
  const span = document.createElement("span");
  span.className = `overview-bullet-note${isGist ? " is-gist" : ""}`;
  span.textContent = text;
  return span;
}

function scrollToHighlight(item) {
  const target = document.getElementById(highlightAnchorId(item));
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  target.classList.add("is-jump-target");
  window.setTimeout(() => target.classList.remove("is-jump-target"), 1600);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function highlightAnchorId(item) {
  const raw = item && (item.id || item.name) ? String(item.id || item.name) : "item";
  return `highlight-${raw.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
}

function semanticExcerpt(value) {
  const text = safeText(value, "")
    .replace(/\s+/g, " ")
    .replace(/^采集时间\s+\S+。/, "")
    .trim();
  if (!text) return "";
  if (text.length <= OVERVIEW_NOTE_MAX_LENGTH) return text;

  const semanticBreaks = "。！？!?；;：:，,";
  for (let index = 18; index < Math.min(text.length, 44); index += 1) {
    if (semanticBreaks.includes(text[index])) {
      return text.slice(0, index + 1);
    }
  }

  const spaceBreak = text.lastIndexOf(" ", OVERVIEW_NOTE_MAX_LENGTH);
  if (spaceBreak >= 24) return `${text.slice(0, spaceBreak)}…`;
  return `${text.slice(0, OVERVIEW_NOTE_MAX_LENGTH)}…`;
}

function highlightCard(item) {
  const card = document.createElement("section");
  card.className = "highlight-card";
  card.id = highlightAnchorId(item);

  const top = document.createElement("div");
  top.className = "highlight-top";

  const titleBlock = document.createElement("div");
  titleBlock.className = "highlight-title";
  const title = document.createElement("h3");
  title.textContent = safeText(item.name, "未命名条目");
  const typeChipClass = TYPE_LABELS[item.type] ? `cat-${item.type}` : "";
  titleBlock.append(title, chipRow([
    chip(TYPE_LABELS[item.type] || safeText(item.type, "未分类"), typeChipClass),
    chip(EVIDENCE_LABELS[item.evidence_tier] || safeText(item.evidence_tier, "证据未标注"), "evidence"),
    item.is_update ? chip("追踪更新", "update") : null
  ].filter(Boolean)));

  const stageTags = toArray(item.stage_tags).map((tag) => chip(STAGE_LABELS[tag] || tag));
  top.append(titleBlock, chipRow(stageTags));
  card.append(top);

  // 核心态：项目介绍 + 价值/工作流，始终展示，回答"这是什么、为什么重要、怎么用"
  card.append(copyBlock("项目介绍", item.summary, "暂无项目介绍。"));

  const values = document.createElement("div");
  values.className = "value-grid";
  values.append(valueBlock("为什么重要", item.recommendation, "暂无推荐理由。"));
  values.append(valueBlock("怎么用", item.usage_paradigm, "暂无使用范式说明。"));
  card.append(values);

  // 证据态：默认折叠，仅在用户主动点击后展示来源、竞品、原始证据文本与条目标识
  card.append(evidencePanel(item));

  return card;
}

function valueBlock(title, value, fallback) {
  const box = document.createElement("div");
  box.className = "value-block";
  const heading = document.createElement("h4");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = safeText(value, fallback);
  box.append(heading, paragraph);
  return box;
}

function evidencePanel(item) {
  const links = toArray(item.links).filter(Boolean);
  const competitors = toArray(item.competitors).filter(isPlainObject);

  const details = document.createElement("details");
  details.className = "evidence-panel";

  const trigger = document.createElement("summary");
  trigger.className = "evidence-trigger";
  trigger.append("证据与来源");
  const scentParts = [];
  if (links.length > 0) scentParts.push(`${links.length} 条链接`);
  if (competitors.length > 0) scentParts.push(`${competitors.length} 项竞品对比`);
  const scent = document.createElement("span");
  scent.className = "evidence-trigger-count";
  scent.textContent = scentParts.length > 0 ? `· ${scentParts.join(" · ")}` : "· 点击展开";
  trigger.append(scent);
  details.append(trigger);

  const body = document.createElement("div");
  body.className = "evidence-body";

  const fields = document.createElement("div");
  fields.className = "field-grid";
  fields.append(fieldBox("证据要点", item.evidence_notes, "暂无证据说明。"));
  fields.append(fieldBox("条目标识", item.id, "未提供 ID。"));
  body.append(fields);

  if (competitors.length > 0) {
    body.append(listBlock("竞品对比", competitorList(competitors)));
  }

  if (links.length > 0) {
    body.append(listBlock("来源链接", linkList(links)));
  }

  details.append(body);
  return details;
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
  if (state.view === "catalog") {
    if (state.ledger.length > 0) {
      messages.push(`已收录 ${state.ledger.length} 项资产；可按主题类型筛选浏览。`);
    } else {
      messages.push("ledger.json 缺失或为空；资产总表暂无可展示条目。");
    }
    if (state.loadErrors.length > 0) {
      const sample = state.loadErrors.slice(0, 3).join("；");
      const suffix = state.loadErrors.length > 3 ? `；另有 ${state.loadErrors.length - 3} 项` : "";
      messages.push(`读取异常 ${state.loadErrors.length} 项：${sample}${suffix}`);
    }
    return messages.join(" ");
  }

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
  if (state.view === "catalog") {
    return state.ledger.length === 0 && state.loadErrors.length > 0;
  }
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
