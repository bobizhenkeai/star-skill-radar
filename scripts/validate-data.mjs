#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
const RULES_FILE = fileURLToPath(new URL("./validation-rules.json", import.meta.url));

const TYPE_VALUES = new Set(["skill", "mcp", "rules", "hooks", "subagent", "prompt-lib", "paradigm"]);
const EVIDENCE_TIER_VALUES = new Set(["official", "community-verified"]);
const STAGE_TAG_VALUES = new Set(["requirements", "design", "implementation", "review", "testing", "ops"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISSUE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.json$/;
const GITHUB_SLUG_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const EVIDENCE_TAIL_RE =
  /(?:[;；,，、]\s*)?(?:约\s*)?(?:\d[\d,.]*\s*[kK]?\s*stars?|MIT|Apache-2\.0|GPL|BSD|license|latest release\s+\S+|v?\d+(?:\.\d+){1,3}|\d{4}-\d{2}-\d{2})(?:[;；,，、]\s*(?:约\s*)?(?:\d[\d,.]*\s*[kK]?\s*stars?|MIT|Apache-2\.0|GPL|BSD|license|latest release\s+\S+|v?\d+(?:\.\d+){1,3}|\d{4}-\d{2}-\d{2}))*[。.!！]?$/i;

function rel(root, filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function readJson(root, filePath, findings) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    findings.error("JSON_PARSE_ERROR", rel(root, filePath), `无法解析 JSON: ${error.message}`);
    return null;
  }
}

function loadRules() {
  return JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
}

function createFindings() {
  const items = [];
  return {
    items,
    error(code, file, message, meta = {}) {
      items.push({ severity: "ERROR", code, file, message, ...meta });
    },
    warn(code, file, message, meta = {}) {
      items.push({ severity: "WARN", code, file, message, ...meta });
    }
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isGitHubSlug(value) {
  return typeof value === "string" && GITHUB_SLUG_RE.test(value);
}

function normalizeIdForLookup(id) {
  return isGitHubSlug(id) ? id.toLowerCase() : id;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseStarNumber(value, suffix) {
  const numeric = Number.parseFloat(String(value).replaceAll(",", ""));
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(suffix ? numeric * 1000 : numeric);
}

function githubRepoFromUrl(value) {
  if (!isHttpUrl(value)) {
    return null;
  }
  const parsed = new URL(value);
  if (parsed.hostname.toLowerCase() !== "github.com") {
    return null;
  }
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  const repo = `${parts[0]}/${parts[1].replace(/\.git$/i, "")}`;
  return isGitHubSlug(repo) ? repo.toLowerCase() : null;
}

function uniqueRepoCandidates(...values) {
  const repos = new Set();
  for (const value of values.flat()) {
    if (!value) {
      continue;
    }
    if (isGitHubSlug(value)) {
      repos.add(value.toLowerCase());
      continue;
    }
    const repo = githubRepoFromUrl(value);
    if (repo) {
      repos.add(repo);
    }
  }
  return [...repos];
}

function containsStarWord(text) {
  if (typeof text !== "string") {
    return false;
  }
  return /\bstars?\b/i.test(text);
}

function parseAnchoredStarClaim(text, repoCandidates) {
  if (typeof text !== "string" || repoCandidates.length === 0) {
    return null;
  }
  for (const repo of repoCandidates) {
    const repoPattern = escapeRegExp(repo).replace("/", "\\/");
    const claimRe = new RegExp(
      `GitHub[^。；;\\n]*?${repoPattern}\\s*有\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*([kK])?\\s*stars`,
      "i"
    );
    const match = text.match(claimRe);
    if (match) {
      const stars = parseStarNumber(match[1], match[2]);
      if (stars !== null) {
        return { stars, repo, source: match[0] };
      }
    }
  }
  return null;
}

function githubApiClaim(text) {
  return /GitHub\s*(?:Search\/)?API\s*显示/.test(text ?? "");
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/[。；;]\s*$/u, "")
    .trim();
}

function validateRequiredObject(root, findings, file, value, label) {
  if (!isObject(value)) {
    findings.error("INVALID_OBJECT", file, `${label} 必须是对象`);
    return false;
  }
  return true;
}

function validateRequiredString(findings, file, object, field, label) {
  if (!isNonEmptyString(object[field])) {
    findings.error("MISSING_FIELD", file, `${label}.${field} 必须是非空字符串`);
    return false;
  }
  return true;
}

function validateEnum(findings, file, value, allowed, fieldLabel) {
  if (!allowed.has(value)) {
    findings.error("INVALID_ENUM", file, `${fieldLabel} 枚举值无效: ${String(value)}`);
    return false;
  }
  return true;
}

function validateLinks(findings, file, links, label, { requireNonEmpty = true } = {}) {
  if (!Array.isArray(links)) {
    findings.error("INVALID_LINKS", file, `${label} 必须是链接数组`);
    return false;
  }
  if (requireNonEmpty && links.length === 0) {
    findings.error("INVALID_LINKS", file, `${label} 不得为空`);
    return false;
  }
  let ok = true;
  links.forEach((link, index) => {
    if (!isHttpUrl(link)) {
      findings.error("INVALID_URL", file, `${label}[${index}] 必须是 http(s) URL: ${String(link)}`);
      ok = false;
    }
  });
  return ok;
}

function validateStageTags(findings, file, tags, label) {
  if (!Array.isArray(tags) || tags.length === 0) {
    findings.error("INVALID_STAGE_TAGS", file, `${label} 必须是非空数组`);
    return;
  }
  tags.forEach((tag, index) => {
    validateEnum(findings, file, tag, STAGE_TAG_VALUES, `${label}[${index}]`);
  });
}

function validateGitHubIdCase(findings, file, id, label) {
  if (isGitHubSlug(id) && id !== id.toLowerCase()) {
    findings.error("GITHUB_ID_NOT_LOWERCASE", file, `${label} GitHub 主键必须小写: ${id}`);
  }
}

function validateGist(findings, rules, file, value, label, { required = false, brief = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      findings.error("MISSING_FIELD", file, `${label} 必须填写`);
    } else {
      findings.warn("GIST_MISSING", file, `${label} 缺失，站点会降级展示`);
    }
    return;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    findings.error("GIST_EMPTY", file, `${label} 必须是非空字符串`);
    return;
  }
  if (value.includes("\n") || value.includes("\r")) {
    findings.error("GIST_MULTILINE", file, `${label} 不得包含换行`);
  }
  const trimmed = value.trim();
  for (const prefix of rules.gist.evidencePrefixes) {
    if (trimmed.startsWith(prefix)) {
      findings.error("GIST_EVIDENCE_PREFIX", file, `${label} 不得以证据/采集前缀开头: ${prefix}`);
      break;
    }
  }
  if (rules.gist.mechanicalEllipsis.some((ellipsis) => trimmed.includes(ellipsis))) {
    findings.error("GIST_MECHANICAL_ELLIPSIS", file, `${label} 不得使用机械省略截断`);
  }
  if (brief && EVIDENCE_TAIL_RE.test(trimmed)) {
    findings.error("BRIEF_GIST_EVIDENCE_TAIL", file, `${label} 不得堆叠 star/license/release/日期等证据尾巴`);
  }
  const length = [...trimmed].length;
  if (length < rules.gist.softMinLength || length > rules.gist.softMaxLength) {
    findings.warn(
      "GIST_LENGTH_SOFT_LIMIT",
      file,
      `${label} 长度 ${length} 超出建议区间 ${rules.gist.softMinLength}-${rules.gist.softMaxLength}`
    );
  }
}

function validateLedger(root, findings, ledger, ledgerPath) {
  const byId = new Map();
  const byNormalizedId = new Map();
  if (!Array.isArray(ledger)) {
    findings.error("INVALID_LEDGER", rel(root, ledgerPath), "data/ledger.json 必须是数组");
    return { byId, byNormalizedId };
  }

  ledger.forEach((item, index) => {
    const file = `${rel(root, ledgerPath)}#${index}`;
    if (!isObject(item)) {
      findings.error("INVALID_OBJECT", file, "ledger 条目必须是对象");
      return;
    }
    for (const field of ["id", "name", "type", "evidence_tier", "first_reported", "state_snapshot"]) {
      validateRequiredString(findings, file, item, field, "ledger");
    }
    validateEnum(findings, file, item.type, TYPE_VALUES, "ledger.type");
    validateEnum(findings, file, item.evidence_tier, EVIDENCE_TIER_VALUES, "ledger.evidence_tier");
    if (!DATE_RE.test(item.first_reported ?? "")) {
      findings.error("INVALID_DATE", file, `ledger.first_reported 必须是 YYYY-MM-DD: ${String(item.first_reported)}`);
    }
    validateGitHubIdCase(findings, file, item.id, "ledger.id");
    validateStageTags(findings, file, item.stage_tags, "ledger.stage_tags");
    validateLinks(findings, file, item.links, "ledger.links");
    if (!Array.isArray(item.last_updates)) {
      findings.error("INVALID_LAST_UPDATES", file, "ledger.last_updates 必须是数组");
    } else {
      item.last_updates.forEach((update, updateIndex) => {
        if (!isObject(update)) {
          findings.error("INVALID_OBJECT", file, `ledger.last_updates[${updateIndex}] 必须是对象`);
          return;
        }
        if (!DATE_RE.test(update.date ?? "")) {
          findings.error("INVALID_DATE", file, `ledger.last_updates[${updateIndex}].date 必须是 YYYY-MM-DD`);
        }
        validateRequiredString(findings, file, update, "note", `ledger.last_updates[${updateIndex}]`);
      });
    }

    if (isNonEmptyString(item.id)) {
      if (byId.has(item.id)) {
        findings.error("DUPLICATE_ID", file, `ledger.id 重复: ${item.id}`);
      }
      byId.set(item.id, item);
      const normalized = normalizeIdForLookup(item.id);
      if (byNormalizedId.has(normalized)) {
        findings.error("DUPLICATE_NORMALIZED_ID", file, `ledger 规范化主键重复: ${normalized}`);
      }
      byNormalizedId.set(normalized, item);
    }
  });

  return { byId, byNormalizedId };
}

function validateIndex(root, findings, index, indexPath, issueDates) {
  const file = rel(root, indexPath);
  if (!Array.isArray(index)) {
    findings.error("INVALID_INDEX", file, "data/issues/index.json 必须是日期字符串数组");
    return;
  }
  const seen = new Set();
  index.forEach((date, indexPosition) => {
    if (!DATE_RE.test(date)) {
      findings.error("INVALID_DATE", file, `index[${indexPosition}] 必须是 YYYY-MM-DD: ${String(date)}`);
    }
    if (seen.has(date)) {
      findings.error("DUPLICATE_INDEX_DATE", file, `index 日期重复: ${date}`);
    }
    seen.add(date);
  });
  const indexDates = [...seen].sort();
  const actualDates = [...issueDates].sort();
  if (indexDates.join("\n") !== actualDates.join("\n")) {
    findings.error(
      "INDEX_MISMATCH",
      file,
      `index 日期集合与 data/issues/*.json 不一致: index=[${indexDates.join(", ")}], actual=[${actualDates.join(", ")}]`
    );
  }
  const sortedOriginal = [...index].sort();
  if (index.join("\n") !== sortedOriginal.join("\n")) {
    findings.warn("INDEX_NOT_SORTED", file, "index 日期建议按升序排列");
  }
}

function validateCompetitors(findings, file, competitors, label) {
  if (!Array.isArray(competitors)) {
    findings.error("INVALID_COMPETITORS", file, `${label}.competitors 必须是数组`);
    return;
  }
  competitors.forEach((competitor, index) => {
    if (!isObject(competitor)) {
      findings.error("INVALID_OBJECT", file, `${label}.competitors[${index}] 必须是对象`);
      return;
    }
    validateRequiredString(findings, file, competitor, "name", `${label}.competitors[${index}]`);
    validateRequiredString(findings, file, competitor, "verdict", `${label}.competitors[${index}]`);
    if (!isHttpUrl(competitor.link)) {
      findings.error("INVALID_URL", file, `${label}.competitors[${index}].link 必须是 http(s) URL`);
    }
  });
}

function inferTierFromRepo(repo, rules, fallback = "community-verified") {
  if (!repo) {
    return fallback;
  }
  const owner = repo.split("/")[0]?.toLowerCase();
  return rules.numeric.officialGithubOwners.includes(owner) ? "official" : fallback;
}

function collectStarMeasurement(findings, file, {
  text,
  label,
  id,
  name,
  tier,
  date,
  links,
  repoCandidates
}) {
  const claim = parseAnchoredStarClaim(text, repoCandidates);
  if (!claim) {
    if (containsStarWord(text)) {
      findings.error("STAR_CLAIM_UNANCHORED", file, `${label} 包含 stars 数值但未锚定为 “GitHub … <repo> 有 X stars” 主语`);
    }
    return null;
  }
  const normalizedId = claim.repo;
  return {
    id,
    normalizedId,
    date,
    name,
    tier,
    stars: claim.stars,
    file,
    sourceText: text,
    sourceLabel: label,
    links: Array.isArray(links) ? links : []
  };
}

function validateIssue(root, findings, rules, issue, issuePath, ledgerByNormalizedId) {
  const file = rel(root, issuePath);
  const dateFromName = path.basename(issuePath, ".json");
  const measurements = [];

  if (!validateRequiredObject(root, findings, file, issue, "issue")) {
    return measurements;
  }
  validateRequiredString(findings, file, issue, "date", "issue");
  validateRequiredString(findings, file, issue, "generated_at", "issue");
  if (issue.date !== dateFromName) {
    findings.error("ISSUE_DATE_FILENAME_MISMATCH", file, `顶层 date 必须等于文件名日期: ${String(issue.date)} !== ${dateFromName}`);
  }
  if (!Array.isArray(issue.highlights)) {
    findings.error("INVALID_HIGHLIGHTS", file, "issue.highlights 必须是数组");
    return measurements;
  }
  if (issue.highlights.length > 5) {
    findings.error("HIGHLIGHT_COUNT_OUT_OF_RANGE", file, `highlights 最多 5 个，当前 ${issue.highlights.length}`);
  }
  if (!Array.isArray(issue.briefs)) {
    findings.error("INVALID_BRIEFS", file, "issue.briefs 必须是数组");
  }
  if (!Array.isArray(issue.source_gaps)) {
    findings.error("INVALID_SOURCE_GAPS", file, "issue.source_gaps 必须是数组");
  } else {
    issue.source_gaps.forEach((gap, index) => {
      if (typeof gap !== "string") {
        findings.error("INVALID_SOURCE_GAP", file, `source_gaps[${index}] 必须是字符串`);
      }
    });
  }

  issue.highlights.forEach((highlight, index) => {
    const label = `highlights[${index}]`;
    if (!isObject(highlight)) {
      findings.error("INVALID_OBJECT", file, `${label} 必须是对象`);
      return;
    }
    for (const field of [
      "id",
      "name",
      "type",
      "evidence_tier",
      "evidence_notes",
      "summary",
      "recommendation",
      "usage_paradigm"
    ]) {
      validateRequiredString(findings, file, highlight, field, label);
    }
    validateEnum(findings, file, highlight.type, TYPE_VALUES, `${label}.type`);
    validateEnum(findings, file, highlight.evidence_tier, EVIDENCE_TIER_VALUES, `${label}.evidence_tier`);
    validateGitHubIdCase(findings, file, highlight.id, `${label}.id`);
    validateStageTags(findings, file, highlight.stage_tags, `${label}.stage_tags`);
    validateLinks(findings, file, highlight.links, `${label}.links`);
    validateCompetitors(findings, file, highlight.competitors, label);
    validateGist(findings, rules, file, highlight.gist, `${label}.gist`);
    if (typeof highlight.is_update !== "boolean") {
      findings.error("INVALID_BOOLEAN", file, `${label}.is_update 必须是 boolean`);
    }
    const normalizedId = normalizeIdForLookup(highlight.id);
    if (isNonEmptyString(highlight.id) && !ledgerByNormalizedId.has(normalizedId)) {
      findings.error("HIGHLIGHT_LEDGER_MISSING", file, `${label}.id 未在 ledger 中找到: ${highlight.id}`);
    }
    const repoCandidates = uniqueRepoCandidates(highlight.id, highlight.links);
    const measurement = collectStarMeasurement(findings, file, {
      text: highlight.evidence_notes,
      label: `${label}.evidence_notes`,
      id: highlight.id,
      name: highlight.name,
      tier: highlight.evidence_tier,
      date: issue.date,
      links: highlight.links,
      repoCandidates
    });
    if (measurement) {
      measurements.push(measurement);
    }
  });

  if (Array.isArray(issue.briefs)) {
    issue.briefs.forEach((brief, index) => {
      const label = `briefs[${index}]`;
      if (!isObject(brief)) {
        findings.error("INVALID_OBJECT", file, `${label} 必须是对象`);
        return;
      }
      validateRequiredString(findings, file, brief, "name", label);
      validateRequiredString(findings, file, brief, "one_liner", label);
      if (!isHttpUrl(brief.link)) {
        findings.error("INVALID_URL", file, `${label}.link 必须是 http(s) URL`);
      }
      validateGist(findings, rules, file, brief.gist, `${label}.gist`, { brief: true });
      if (/^\s*(采集时间|GitHub\s*(?:Search\/)?API\s*显示|\d[\d,.]*\s*stars?)/i.test(brief.one_liner ?? "")) {
        findings.error("BRIEF_ONE_LINER_PREFIX", file, `${label}.one_liner 必须描述先行，不得以采集时间或 star 证据开头`);
      }
      const briefRepo = githubRepoFromUrl(brief.link);
      const repoCandidates = uniqueRepoCandidates(brief.link);
      const tier = inferTierFromRepo(briefRepo, rules);
      const briefId = briefRepo ?? `brief:${issue.date}:${index}`;
      const oneLinerMeasurement = collectStarMeasurement(findings, file, {
        text: brief.one_liner,
        label: `${label}.one_liner`,
        id: briefId,
        name: brief.name,
        tier,
        date: issue.date,
        links: [brief.link],
        repoCandidates
      });
      if (oneLinerMeasurement) {
        measurements.push(oneLinerMeasurement);
      }
      const gistMeasurement = collectStarMeasurement(findings, file, {
        text: brief.gist,
        label: `${label}.gist`,
        id: briefId,
        name: brief.name,
        tier,
        date: issue.date,
        links: [brief.link],
        repoCandidates
      });
      if (gistMeasurement) {
        measurements.push(gistMeasurement);
      }
    });
  }

  return measurements;
}

function hasGitHubVerificationLink(measurement) {
  if (!isGitHubSlug(measurement.id)) {
    return true;
  }
  const repoUrl = `https://github.com/${measurement.normalizedId}`;
  const apiUrl = `https://api.github.com/repos/${measurement.normalizedId}`;
  return measurement.links.some((link) => {
    const normalized = String(link).toLowerCase();
    return normalized === repoUrl || normalized.startsWith(`${repoUrl}/`) || normalized === apiUrl || normalized.startsWith(`${apiUrl}?`);
  });
}

function numericFailurePrefix(measurement) {
  return githubApiClaim(measurement.sourceText) ? "API-claim numeric sanity failed: " : "";
}

function validateNumericSanity(findings, rules, allMeasurements) {
  const byDate = new Map();
  for (const measurement of allMeasurements) {
    if (!byDate.has(measurement.date)) {
      byDate.set(measurement.date, []);
    }
    byDate.get(measurement.date).push(measurement);
  }

  for (const [date, measurements] of [...byDate.entries()].sort()) {
    const officialMax = Math.max(
      0,
      ...measurements.filter((item) => item.tier === "official").map((item) => item.stars)
    );
    for (const measurement of measurements) {
      if (measurement.stars > rules.numeric.highStarReviewThreshold) {
        findings.warn(
          "HIGH_STAR_REVIEW_REQUIRED",
          measurement.file,
          `${measurement.name} (${measurement.id}) ${measurement.sourceLabel} ${measurement.stars.toLocaleString("en-US")} stars 超过人工复核阈值 ${rules.numeric.highStarReviewThreshold.toLocaleString("en-US")}`
        );
        if (!hasGitHubVerificationLink(measurement)) {
          findings.error(
            "HIGH_STAR_VERIFICATION_LINK_MISSING",
            measurement.file,
            `${measurement.name} (${measurement.id}) 高星条目缺少可点击 GitHub repo/API 验证入口`
          );
        }
      }
      if (measurement.tier === "community-verified" && measurement.stars > rules.numeric.communityStarBlockThreshold) {
        findings.error(
          "COMMUNITY_STAR_ABOVE_THRESHOLD",
          measurement.file,
          `${numericFailurePrefix(measurement)}${date} 社区条目 ${measurement.name} (${measurement.id}) ${measurement.sourceLabel} ${measurement.stars.toLocaleString("en-US")} stars 超过阻断阈值 ${rules.numeric.communityStarBlockThreshold.toLocaleString("en-US")}`
        );
      }
      if (measurement.tier === "community-verified" && officialMax > 0 && measurement.stars > officialMax) {
        findings.error(
          "COMMUNITY_STAR_ABOVE_OFFICIAL",
          measurement.file,
          `${numericFailurePrefix(measurement)}${date} 社区条目 ${measurement.name} (${measurement.id}) ${measurement.sourceLabel} ${measurement.stars.toLocaleString("en-US")} stars 超过同期官方旗舰最大值 ${officialMax.toLocaleString("en-US")}`
        );
      }
    }
  }

  const byId = new Map();
  for (const measurement of allMeasurements) {
    if (!byId.has(measurement.normalizedId)) {
      byId.set(measurement.normalizedId, []);
    }
    byId.get(measurement.normalizedId).push(measurement);
  }
  for (const measurements of byId.values()) {
    measurements.sort((a, b) => a.date.localeCompare(b.date));
    for (let index = 1; index < measurements.length; index += 1) {
      const prev = measurements[index - 1];
      const current = measurements[index];
      const diff = Math.abs(current.stars - prev.stars);
      const baseline = Math.max(1, Math.min(prev.stars, current.stars));
      const ratio = Math.max(prev.stars, current.stars) / baseline;
      const relativeJump =
        diff > rules.numeric.starJumpAbsThreshold && ratio > rules.numeric.starJumpRatioThreshold;
      const highBaseJump =
        Math.min(prev.stars, current.stars) >= rules.numeric.starJumpHighBaseMinStars &&
        diff > rules.numeric.starJumpHighBaseAbsThreshold;
      if (current.date !== prev.date && (relativeJump || highBaseJump)) {
        const reason = highBaseJump
          ? `高基数绝对差 ${diff.toLocaleString("en-US")} 超过 ${rules.numeric.starJumpHighBaseAbsThreshold.toLocaleString("en-US")}`
          : `绝对差 ${diff.toLocaleString("en-US")} 且倍数 ${ratio.toFixed(2)} 超过阈值`;
        findings.error(
          "STAR_JUMP_ANOMALY",
          current.file,
          `${numericFailurePrefix(current)}${current.id} stars 从 ${prev.date} 的 ${prev.stars.toLocaleString("en-US")} 跳到 ${current.date} 的 ${current.stars.toLocaleString("en-US")}，${reason}`
        );
      }
    }
  }
}

function extractReportSections(markdown) {
  const highlightStart = markdown.indexOf("\n## 重点条目");
  const briefsStart = markdown.indexOf("\n## 简讯");
  const gapsStart = markdown.indexOf("\n## 来源缺口");
  const highlightText = highlightStart >= 0 && briefsStart > highlightStart ? markdown.slice(highlightStart, briefsStart) : "";
  const briefsText = briefsStart >= 0 ? markdown.slice(briefsStart, gapsStart > briefsStart ? gapsStart : markdown.length) : "";
  return { highlightText, briefsText };
}

function parseHighlightSections(highlightText) {
  const matches = [...highlightText.matchAll(/^###\s+\d+\.\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const next = matches[index + 1];
    const sectionEnd = next ? next.index : highlightText.length;
    return {
      name: match[1].trim(),
      body: highlightText.slice(match.index, sectionEnd)
    };
  });
}

function parseBriefLines(briefsText) {
  return briefsText
    .split(/\r?\n/)
    .map((line) => line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)：(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      name: match[1].trim(),
      link: match[2].trim(),
      one_liner: match[3].trim()
    }));
}

function validateMarkdownReport(root, findings, issue, issuePath) {
  const date = issue?.date ?? path.basename(issuePath, ".json");
  const reportPath = path.join(root, "reports", `${date}.md`);
  const issueFile = rel(root, issuePath);
  if (!fs.existsSync(reportPath)) {
    findings.error("REPORT_MISSING", issueFile, `缺少 Markdown 报告 reports/${date}.md`);
    return;
  }
  const reportFile = rel(root, reportPath);
  const markdown = fs.readFileSync(reportPath, "utf8");
  if (!markdown.includes(`# Star-Skill Radar 日报 ${date}`)) {
    findings.error("REPORT_DATE_MISMATCH", reportFile, `Markdown H1 未匹配日期 ${date}`);
  }
  if (isNonEmptyString(issue.generated_at) && !markdown.includes(`生成时间：${issue.generated_at}`)) {
    findings.error("REPORT_GENERATED_AT_MISMATCH", reportFile, "Markdown 生成时间必须与 JSON generated_at 一致");
  }

  const { highlightText, briefsText } = extractReportSections(markdown);
  const highlightSections = parseHighlightSections(highlightText);
  if (Array.isArray(issue.highlights) && highlightSections.length !== issue.highlights.length) {
    findings.error(
      "MARKDOWN_HIGHLIGHT_COUNT_MISMATCH",
      reportFile,
      `Markdown 重点条目数量 ${highlightSections.length} 与 JSON ${issue.highlights.length} 不一致`
    );
  }
  if (Array.isArray(issue.highlights)) {
    issue.highlights.forEach((highlight, index) => {
      const section = highlightSections[index];
      if (!section) {
        return;
      }
      if (section.name !== highlight.name) {
        findings.error("MARKDOWN_HIGHLIGHT_NAME_MISMATCH", reportFile, `第 ${index + 1} 个重点条目名称不一致: ${section.name} !== ${highlight.name}`);
      }
      if (!section.body.includes(`- 类型：${highlight.type}`)) {
        findings.error("MARKDOWN_HIGHLIGHT_TYPE_MISMATCH", reportFile, `${highlight.name} 类型未与 JSON 同源`);
      }
      if (!section.body.includes(`- 证据等级：${highlight.evidence_tier}`)) {
        findings.error("MARKDOWN_HIGHLIGHT_TIER_MISMATCH", reportFile, `${highlight.name} 证据等级未与 JSON 同源`);
      }
      const status = highlight.is_update ? "重大更新追踪" : "新收录";
      if (!section.body.includes(`- 更新状态：${status}`)) {
        findings.error("MARKDOWN_HIGHLIGHT_STATUS_MISMATCH", reportFile, `${highlight.name} 更新状态未与 JSON 同源`);
      }
      const firstLink = Array.isArray(highlight.links) ? highlight.links[0] : null;
      if (firstLink && !section.body.includes(`](${firstLink})`)) {
        findings.error("MARKDOWN_HIGHLIGHT_LINK_MISMATCH", reportFile, `${highlight.name} 关键来源首个链接未与 JSON links[0] 同源`);
      }
    });
  }

  const briefLines = parseBriefLines(briefsText);
  if (Array.isArray(issue.briefs) && briefLines.length !== issue.briefs.length) {
    findings.error("MARKDOWN_BRIEF_COUNT_MISMATCH", reportFile, `Markdown 简讯数量 ${briefLines.length} 与 JSON ${issue.briefs.length} 不一致`);
  }
  if (Array.isArray(issue.briefs)) {
    issue.briefs.forEach((brief, index) => {
      const line = briefLines[index];
      if (!line) {
        return;
      }
      if (line.name !== brief.name || line.link !== brief.link || normalizeText(line.one_liner) !== normalizeText(brief.one_liner)) {
        findings.error(
          "MARKDOWN_BRIEF_MISMATCH",
          reportFile,
          `第 ${index + 1} 条简讯必须与 JSON briefs[].name/link/one_liner 同源`
        );
      }
    });
  }
}

function collectGitHubRecheckTargets(issue) {
  const targets = [];
  for (const highlight of issue.highlights ?? []) {
    if (!isGitHubSlug(highlight.id)) {
      continue;
    }
    const repoCandidates = uniqueRepoCandidates(highlight.id, highlight.links);
    const claim = parseAnchoredStarClaim(highlight.evidence_notes, repoCandidates);
    if (claim) {
      targets.push({
        repo: claim.repo,
        claimedStars: claim.stars,
        label: `highlight:${highlight.name}`
      });
    }
  }
  for (const [index, brief] of (issue.briefs ?? []).entries()) {
    const repoCandidates = uniqueRepoCandidates(brief.link);
    for (const [field, text] of [
      ["one_liner", brief.one_liner],
      ["gist", brief.gist]
    ]) {
      const claim = parseAnchoredStarClaim(text, repoCandidates);
      if (claim) {
        targets.push({
          repo: claim.repo,
          claimedStars: claim.stars,
          label: `briefs[${index}].${field}:${brief.name}`
        });
      }
    }
  }
  return targets;
}

async function runGitHubRecheck(findings, rules, issue, issuePath) {
  const file = issuePath.replaceAll(path.sep, "/");
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "star-skill-radar-validator"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  for (const target of collectGitHubRecheckTargets(issue)) {
    const repo = target.repo.toLowerCase();
    let response;
    try {
      response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    } catch (error) {
      findings.error("GITHUB_RECHECK_REQUEST_FAILED", file, `${repo} GitHub API 请求失败: ${error.message}`);
      continue;
    }
    if (!response.ok) {
      findings.error("GITHUB_RECHECK_REQUEST_FAILED", file, `${repo} GitHub API 返回 HTTP ${response.status}`);
      continue;
    }
    const payload = await response.json();
    const actualStars = payload.stargazers_count;
    if (typeof actualStars !== "number") {
      findings.error("GITHUB_RECHECK_BAD_RESPONSE", file, `${repo} GitHub API 响应缺少 stargazers_count`);
      continue;
    }
    const drift = Math.abs(actualStars - target.claimedStars);
    const driftRatio = drift / Math.max(1, target.claimedStars);
    if (drift > rules.githubRecheck.maxStarDriftAbs && driftRatio > rules.githubRecheck.maxStarDriftRatio) {
      findings.error(
        "GITHUB_RECHECK_STAR_MISMATCH",
        file,
        `${target.label} ${repo} claimed=${target.claimedStars.toLocaleString("en-US")} actual=${actualStars.toLocaleString("en-US")} drift=${drift.toLocaleString("en-US")}`
      );
    }
  }
}

export async function validateRepository(root = process.cwd(), options = {}) {
  const findings = createFindings();
  const rules = options.rules ?? loadRules();
  const ledgerPath = path.join(root, "data", "ledger.json");
  const indexPath = path.join(root, "data", "issues", "index.json");
  const issuesDir = path.join(root, "data", "issues");

  const ledger = readJson(root, ledgerPath, findings);
  const index = readJson(root, indexPath, findings);
  const issueFileNames = fs.existsSync(issuesDir)
    ? fs.readdirSync(issuesDir).filter((name) => ISSUE_FILE_RE.test(name)).sort()
    : [];
  if (!fs.existsSync(issuesDir)) {
    findings.error("ISSUES_DIR_MISSING", "data/issues", "缺少 data/issues 目录");
  }
  const issueDates = issueFileNames.map((name) => path.basename(name, ".json"));

  const { byNormalizedId: ledgerByNormalizedId } = validateLedger(root, findings, ledger, ledgerPath);
  validateIndex(root, findings, index, indexPath, issueDates);

  const allMeasurements = [];
  const parsedIssues = [];
  for (const fileName of issueFileNames) {
    const issuePath = path.join(issuesDir, fileName);
    const issue = readJson(root, issuePath, findings);
    if (issue) {
      parsedIssues.push({ issue, issuePath });
      allMeasurements.push(...validateIssue(root, findings, rules, issue, issuePath, ledgerByNormalizedId));
      validateMarkdownReport(root, findings, issue, issuePath);
    }
  }
  validateNumericSanity(findings, rules, allMeasurements);

  if (options.githubRecheck === "latest") {
    const latest = parsedIssues.sort((a, b) => a.issue.date.localeCompare(b.issue.date)).at(-1);
    if (latest) {
      await runGitHubRecheck(findings, rules, latest.issue, rel(root, latest.issuePath));
    }
  }

  const errors = findings.items.filter((item) => item.severity === "ERROR");
  const warnings = findings.items.filter((item) => item.severity === "WARN");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    findings: findings.items
  };
}

function printHuman(result) {
  for (const item of result.findings) {
    console.log(`${item.severity} [${item.code}] ${item.file}: ${item.message}`);
  }
  console.log(
    `Validation ${result.ok ? "passed" : "failed"}: ${result.errors.length} error(s), ${result.warnings.length} warning(s).`
  );
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    json: false,
    githubRecheck: null
  };
  const readValue = (index, flag) => {
    const value = argv[index + 1];
    if (!value || value.startsWith("-")) {
      throw new Error(`${flag} 需要参数`);
    }
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--root") {
      const value = readValue(index, "--root");
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === "--github-recheck") {
      const value = readValue(index, "--github-recheck");
      if (value !== "latest") {
        throw new Error("--github-recheck 目前仅支持 latest");
      }
      options.githubRecheck = value;
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`未知参数: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/validate-data.mjs [--json] [--github-recheck latest] [--root PATH]

默认离线 strict 校验全仓 data/reports/ledger/index。
ERROR 会以退出码 1 阻断，WARN 只提示。`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (options.help) {
    printHelp();
    process.exit(0);
  }
  const result = await validateRepository(options.root, { githubRecheck: options.githubRecheck });
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }
  process.exit(result.ok ? 0 : 1);
}
