# 调研材料：摘要优先 / 渐进式披露 仪表盘设计哲学

> 调研目的：为 `site/` 前端改版提供信息架构参考，非约束性指令。由主窗口 subagent 于 2026-07-02 完成网络调研并汇总。

---

# Summary-First, Progressive-Disclosure Dashboard Design — UX Reference Report

*Compiled for architect reference on a "daily tech-news digest" frontend redesign. Not binding — use as evidence-backed input to design decisions.*

---

## 1. Core Principle Citations

### 1.1 Progressive Disclosure (the foundational pattern)
**Source:** [Nielsen Norman Group — "Progressive Disclosure"](https://www.nngroup.com/articles/progressive-disclosure/) (Jakob Nielsen, canonical since 2006) · **Confidence: HIGH**

> "Progressive disclosure defers advanced or rarely used features to a secondary screen, making applications easier to learn and less error-prone."

Core mechanism: (1) show users only the most important options initially; (2) offer the larger set of specialized/detailed options **only on request**. Two implementation rules NN/g stresses:
- The mechanism for revealing more must be simple and visually obvious.
- The label on that trigger must have strong **"information scent"** — it must set clear expectations for what's behind it, or users won't click.
- NN/g explicitly warns: don't over-nest. One level of secondary disclosure is usually sufficient.

### 1.2 Working-Memory / Cognitive-Load Limits (chunking)
**Source:** George Miller (1956); Nelson Cowan, ["The Magical Number 4 in Short-Term Memory"](http://wixtedlab.ucsd.edu/publications/Psych%20218/Cowan_BBS_2001.pdf) (2001) · **Confidence: HIGH**

- Miller's original claim: working memory holds ~7±2 items.
- Cowan's more rigorous, widely-cited refinement: when rehearsal/chunking tricks are controlled for, real capacity for **novel, unrelated information** is closer to **4±1 chunks**.
- Critical design lesson: capacity is defined by "chunks," not raw items — grouping related elements multiplies effective capacity. **This is the scientific justification for categorization/grouping in a dashboard.**

**Applied NN/g guidance:** [NN/g — "How Chunking Helps Content Processing"](https://www.nngroup.com/articles/chunking/) · **HIGH.** Concrete techniques: short paragraphs separated by whitespace, short lines (~50–75 characters), visually distinct groupings, contrasting headings, bolded keywords, bulleted lists, a short summary sentence at the top of any longer section. NN/g also reports **79% of users scan pages while only 16% read linearly** ([Text Scanning Patterns](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/), HIGH).

*Caveat on specific numbers:* Practitioner articles translate this into "show 5–7 KPIs" style rules — treat as **MEDIUM-confidence heuristics**. The only rigorously-sourced number is Cowan's **~4±1 chunks for novel/unrelated information**.

### 1.3 Inverted Pyramid / Frontloading
**Source:** Journalism convention + [NN/g — "Inverted Pyramid: Writing for Comprehension"](https://www.nngroup.com/articles/inverted-pyramid/) · **Confidence: HIGH**

Structure: **most important conclusion first**, then supporting details in descending importance, background/color last. NN/g's UX translation: frontload *every* level — headline, first sentence of section, first sentence of every paragraph should carry the information, not build up to it.

### 1.4 Scanning Behavior — F-Pattern vs. Z-Pattern
**Source:** [NN/g — "F-Shaped Pattern For Reading Web Content"](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/) (2006, 232+ participants; reconfirmed 2017); [How People Read Online](https://www.nngroup.com/reports/how-people-read-web-eyetracking-evidence/) · **Confidence: HIGH**

- **F-pattern**: on text-/data-dense pages, users read a horizontal band at top, a shorter band further down, then scan vertically down the left edge, reading progressively less as they descend. Content buried mid-line or lower-right is essentially invisible.
- **Z-pattern** (practitioner extension, MEDIUM): applies to sparse, low-element screens. Eye travels top-left → top-right → diagonally to bottom-left → across the bottom.
- **Convergent, high-confidence conclusion:** the **top-left quadrant** receives the most attention in virtually every layout.
- Applied to dashboards (MEDIUM): dense/operational views assume F-pattern (top-left = most critical item); sparse executive/summary views assume Z-pattern.

### 1.5 "Smart Brevity" — Applied Summary-First Editorial Methodology
**Source:** Axios (Jim VandeHei, Mike Allen, Roy Schwartz) — [Axios HQ documentation](https://help.axioshq.com/hc/en-us/articles/40406826943891-Understanding-Smart-Brevity) · **Confidence: HIGH**

Underlying data: users check messages 70–400x/day, read for an average of **26 seconds**; the brain answers *"is this relevant to me"* in about **17 milliseconds**.

Structural formula:
1. **Headline** — under ~60 characters, concrete, conversational.
2. **"What's new"** — the single most important fact, one sentence, stated first, always.
3. **"Why it matters"** — short relevance/impact explanation, immediately after.
4. **"Go deeper"** — optional link(s)/expansion; everyone else can stop reading here with zero loss of the core message.
5. Formatting discipline: strategic **bolding**, bullets, generous white space. Result (Axios's own claim): ~40–50% shorter read times with no loss of essential substance.

### 1.6 Accordion / Click-to-Expand Widget Specifics
**Source:** [NN/g — "Accordions on Desktop"](https://www.nngroup.com/articles/accordions-on-desktop/), ["Accordion Icons"](https://www.nngroup.com/articles/accordion-icons/) · **Confidence: HIGH**

- Use accordions **only** when users need some, not most, of the hidden content.
- Never hide **essential** information behind a click — only secondary/supporting material.
- Trigger labels must be descriptive enough to motivate a click (information scent).
- Tested finding: a **caret (⌄)** icon is the only signifier that measurably outperforms *no icon at all*. Plus (+) and arrow icons tested no better than nothing.
- Where multiple sections exist, allow multiple to be open simultaneously; consider "Expand All / Collapse All."

### 1.7 Citation / Evidence Disclosure Patterns
**Source:** [UX Patterns Guide — Citation Display](https://uxpatternsguide.com/patterns/citation-display/), [Agentic UX Patterns](https://agenticuxpatterns.com/patterns/source-anchoring-grounding) · **Confidence: MEDIUM**

- **Never show full evidence inline by default.** Attach a compact marker (superscript number, small chip, "N sources" badge) beside the claim it supports — visible, but silent until touched.
- **On hover (desktop) or tap (mobile)**, reveal a lightweight preview: source title, domain/favicon, one-line excerpt, explicit "open source" action.
- For short answers with few sources: a **row of source cards below the content** (Perplexity/Google-AI-Overview pattern) is simplest and most scannable.
- Group multiple citations under one marker if they support the same claim.
- Distinguish evidence states (verified/pending/stale/missing) with **text labels**, not color alone.

### 1.8 Above-the-Fold Attention Budget
**Source:** NN/g eye-tracking data + 2026 practitioner syntheses · **Confidence: MEDIUM**

- Users form a stay-or-leave relevance judgment within roughly **3–5 seconds**.
- The first viewport should carry **one primary value proposition** and a small number of supporting elements.
- Dashboard "**5-second rule**": a viewer should answer "are we okay or not / what matters" within 5 seconds of the primary view loading.

---

## 2. Concrete Structural Patterns Observed in Real Products

| Product | Pattern | Confidence |
|---|---|---|
| **Axios (Smart Brevity)** | Headline → 1-sentence "What's new" → bolded "Why it matters" → bulleted supporting facts → optional "Go deeper" link. Entire value extractable from the first two lines. | HIGH |
| **TLDR newsletter** | Rigid identical structure per item: headline → 2–4 sentence summary → est. reading time of original → link out. 5–8 items per topical section. Consistency optimizes scan speed and reader trust. | HIGH |
| **Morning Brew** | Predictable visual rhythm: hook → tightly-written blocks separated by thin dividers → consistent sign-off. Personality layered *on top of* a fixed skeleton, not a substitute for structure. | MEDIUM–HIGH |
| **Google News (2017 redesign)** | Card-based interface "to cut down on clutter" — every story its own bounded rectangle, "Full Coverage" link opt-in for depth. | MEDIUM |
| **Apple News** | Card/feed entry surface; individual stories open into richer format only after explicit tap — progressive disclosure at the article level too. | MEDIUM |
| **AI answer engines (Perplexity-style citation chips)** | Inline superscript/chip markers; hover/tap reveals source preview card; distinct "Sources" affordance opens full panel only on demand. Most directly transferable pattern for "hide evidence until clicked." | MEDIUM |
| **Bloomberg Terminal** | Deliberate counter-example: "function over form," high density by design, works only because of a narrow, trained, daily-repeat expert audience with shared visual conventions. **Lesson: don't emulate raw density for a broad/occasional audience**, but the "consistent badges/color codes as compressed knowledge" idea is reusable. | MEDIUM |
| **Modern SaaS/analytics dashboards (2026 consensus)** | **Layered IA**: Overview (status/what changed) → Focus (triage/comparisons) → Detail (drill-down/evidence) → Action. Also "inverted pyramid" layout: Tier 1 (top)=outcome/status, Tier 2 (middle)=trend/driver, Tier 3 (bottom)=diagnostic detail via scroll/drill-down, never dumped at top. | MEDIUM–HIGH |

---

## 3. Actionable Design Rules

### 3(a) — Top-Level "Overview Board" (a full day's curated items across ~6 categories)

1. **Answer "how much happened + what matters most" in the first viewport, with zero interaction.** A one-line "state of today" summary (total item count + the single most important item) before any category breakdown.
2. **Chunk by category, don't list flat.** ~6 categories fits within Cowan's ~4±1 "novel chunk" ceiling if each category is one visual chunk, even though total item count across categories is larger. Each category chunk shows a count/badge, not the full list, by default.
3. **Respect F/Z scanning geometry.** F-pattern for the moderate-density category grid (most important category top-left, descending priority left-to-right/top-to-bottom); if a hero KPI band sits above the grid, that band follows Z-pattern.
4. **Cap what's visible per category before requiring a click.** Show only the **top 1–3 items per category** (headline + one-line "why it matters") on the overview; "see all N" for the rest.
5. **Use badges/tags for category/status metadata, never as primary content.** 1–3 words, icon+text (never color alone).
6. **Make "why is this bucket showing N items" self-evident without a click** — the category chunk carries a one-line rollup summary, not just a raw count.
7. **Do not emulate Bloomberg-style density on the overview board.** Broad/occasional-glance use case → generous whitespace, large "state of today" type, one visual-weight tier competing for attention at the top.

### 3(b) — Individual "Item Cards" (core positioning/value/workflow at a glance; evidence hidden until interaction)

1. **Structure every card as a miniature inverted pyramid / Smart-Brevity unit:** Title → one-sentence "what it is/core value" → optional one-sentence "why it matters/workflow fit" → metadata badges. Readable and meaningful in under 5 seconds without any click.
2. **Hide evidence/citations/sources behind an explicit, clearly-labeled trigger — never inline by default.** Small marker/"N sources" chip; click/tap opens a secondary surface (expand-in-place accordion, modal, or side panel) — never a same-space content dump that pushes other cards around unexpectedly.
3. **Give the disclosure trigger strong "information scent."** Label for what it reveals ("3 sources · view evidence"), not generic ("Details").
4. **Use a caret icon (⌄) for inline accordion-style expansion**; a plain chevron-right/"→" if routing to a modal/drill-down page — don't mix affordances on the same card type.
5. **Never make evidence/citation the majority of the card's default visual weight.** Verbose material should be fully absent from the collapsed state — not truncated-and-fading, not scrollable-within-a-tiny-box.
6. **When evidence is expanded, keep it in context** — inline expansion or a clearly-origin-indicated panel, not a disconnected page.
7. **Budget card text tightly.** ~50–75 characters/line, roughly 2–4 short "sentences-worth" of always-visible content.
8. **Reserve strong visual weight (bold/color/size) for the single most important fact per card** — resist bolding multiple competing elements.

---

## 4. Key Tension to Resolve Explicitly

- **Axios/TLDR/NN·g-chunking model** → broad, infrequent-glance audience: low density, aggressive hiding, one idea per unit, brevity above all.
- **Bloomberg Terminal model** → narrow, expert, daily-repeat audience: high density accepted because users learned shared visual conventions.

Given this product's stated goal ("instantly grasp how much happened today and what matters most before drilling into any detail" for a general/self reader), **the Axios/TLDR/progressive-disclosure model is the correct primary reference** for both the overview board and item cards. The one transferable idea from Bloomberg worth keeping: **consistent, learnable visual conventions (fixed badge colors per category, fixed card anatomy) reduce the need for explanatory text over time** for a repeat daily reader — without needing Bloomberg-level raw density.
