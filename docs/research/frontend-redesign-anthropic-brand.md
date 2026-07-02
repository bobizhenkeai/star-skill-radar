# 调研材料：Anthropic 品牌设计语言（面向情报站前端改版）

> 调研目的：为 `site/` 前端改版提供设计参考，非约束性指令。由主窗口 subagent 于 2026-07-02 完成网络调研并汇总。置信度标注含义：🟢 高（官方一手材料/品牌团队直接引述）、🟡 中（第三方逆向工程/多方印证的设计评论）、🔴 低/推断（单一来源或本报告的推断，已明确标注）。

---

# Anthropic Brand & Design Language — Reference Report for Chinese AI-News Dashboard

*Compiled from Anthropic's official public brand-guidelines skill, GitHub-published voice/content guidelines, an interview with Anthropic's Head of Content and Creative Director, and multiple independent third-party reverse-engineerings of the live anthropic.com / claude.com CSS. Confidence levels and sources are marked per claim. Where sources disagree, I've noted it rather than papering over it.*

**Source-confidence key:**
- 🟢 **High** — Anthropic's own published artifact, or a direct quote from an Anthropic brand-team member
- 🟡 **Medium** — Independent third-party reverse-engineering of the live site (multiple sources corroborate), or well-supported design-critic analysis
- 🔴 **Low / Inference** — Single-source, speculative, or my own extrapolation for the Chinese-dashboard use case (explicitly labeled)

---

## 0. What actually exists in the `anthropics/skills` brand-guidelines folder

The GitHub path `anthropics/skills/skills/brand-guidelines` contains exactly two files — `SKILL.md` and `LICENSE.txt` — no images, no extended docs, no asset folder. 🟢 [github.com/anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/brand-guidelines)

The official `SKILL.md` content in full 🟢 [raw SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md):

| Role | Value |
|---|---|
| Dark (primary text / dark bg) | `#141413` |
| Light (page bg / text-on-dark) | `#faf9f5` |
| Mid Gray (secondary elements) | `#b0aea5` |
| Light Gray (subtle backgrounds) | `#e8e6dc` |
| Accent — Orange (primary) | `#d97757` |
| Accent — Blue (secondary) | `#6a9bcc` |
| Accent — Green (tertiary) | `#788c5d` |
| Headings font | **Poppins** (fallback Arial) |
| Body font | **Lora** (fallback Georgia) |

Important nuance 🟢: this official skill deliberately specifies **publicly-licensed Google Fonts** (Poppins/Lora), not Anthropic's real in-house typefaces. That's because this skill generates arbitrary artifacts (slides, docs) where the proprietary faces can't be embedded. The actual product/marketing surfaces use Anthropic's proprietary type family instead (see §2). Treat Poppins/Lora as "the honest public substitute," not "the real brand font."

---

## 1. Color Philosophy

**Core palette (two confidence tiers):**

*Tier 1 — Official 🟢:* Dark ink `#141413`, Light canvas `#faf9f5`, Mid Gray `#b0aea5`, Light Gray `#e8e6dc`, plus accents Orange `#d97757` / Blue `#6a9bcc` / Green `#788c5d`. [SKILL.md](https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md)

*Tier 2 — Extended live-site palette, reverse-engineered, 🟡 (multiple independent captures broadly agree, with minor hex drift between them, e.g. hairline reads as `#c2c0b6` in one capture and `#d1cfc5`/`#e8e6dc` in others — treat exact values as approximate):*

| Family | Tones |
|---|---|
| Canvas/Ivory ramp | Ivory Light `#faf9f5` → Ivory Medium `#f0eee6` → Ivory Dark/Oat `#e8e6dc`/`#e3dacc` |
| Ink/Slate ramp | Slate `#141413` → Slate Medium `#3d3d3a` → Slate Light `#5e5d59`/`#73726c` → Cloud `#87867f`/`#9c9a92`/`#b0aea5` |
| Accent (primary, sparing) | Clay `#d97757`, hover/deeper state Ember `#c6613f` |
| Accent (secondary, "dormant"/scoped) | Olive `#788c5d`, Sky `#6a9bcc`, Fig `#c46686`, Cactus `#bcd1ca`, Heather `#cbcadb`, Manilla `#ebdbbc`, Kraft `#d4a27f`, Coral `#ebcece` |
| Inversion | Near-black `#0b0b0b`–`#000000` used only for footers / feature-card bands |

Sources: 🟡 [shadcn.io/design/anthropic](https://www.shadcn.io/design/anthropic), [duply.ai/anthropic](https://duply.ai/anthropic/design-md), [duply.ai/claude](https://duply.ai/claude/design-md), [brand-atoms.com](https://brand-atoms.com/brands/anthropic/), [refero.design](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)

**The "why" behind the choices:**

- **The warm palette is explicitly described by Anthropic's own Creative Director as evoking "unfired clay (both painted and raw)... It feels very human."** He ties this directly to the operating principle *"do the simple thing that works"* and contrasts it with being *"overly varnished"* which reads as *"shiny, inhuman, or fake."* 🟢 Direct quote, Tim Belonax (Creative Director) — [The Subtext interview](https://www.thesubtext.online/all/anthropic-interview)
- Head of Content Chelsea Larsson recalls being drawn to the brand specifically because the Clay orange "resonated as this warm fire that felt so different from what you see in Bay Area tech and AI." 🟢 Same source — this is a deliberate emotional/counter-positioning goal, not decoration.
- Ivory-over-white and slate-over-black is widely interpreted by design critics as **counter-positioning against AI-industry visual clichés** — no blue/purple gradients, no neon-on-black cyberpunk tropes that competitors lean on; warm neutral + earth accent instead signals "research institution," not "startup hype." 🟡 Inference/interpretation, corroborated across 3+ independent write-ups — [SeedFlip](https://seedflip.co/blog/anthropic-design-language), [WeLoveDaily](https://welovedaily.net/article/anthropic-visual-identity-quiet-confidence), [shadcn.io](https://www.shadcn.io/design/anthropic)
- The 8-color secondary "natural world" accent set is **scoped deliberately** — it stays dormant on the monochrome marketing shell and only surfaces on research pages, the Economic Index data dashboard, and news sub-pages, where it differentiates data categories without adding "chromatic noise" to the primary brand surface. 🟡 [shadcn.io](https://www.shadcn.io/design/anthropic), confirmed as extending to Anthropic's actual dashboard product (Economic Index) 🟢 [anthropic.com/economic-futures](https://www.anthropic.com/economic-futures) exists as a real data-dashboard analog.
- Near-black `#141413` instead of pure `#000000` is interpreted as giving text/UI "authority without the harshness of absolute black" — softer but still very high-contrast. 🟡 [TypeUI](https://www.typeui.sh/design-skills/claude)

---

## 2. Typography Philosophy

**The real (proprietary) system: Anthropic Serif / Anthropic Sans / Anthropic Mono.** Not publicly distributable, so all third-party reconstructions substitute open fonts. 🟡 [Gooova Studio](https://gooova.com/en/anthropic-designed-its-own-type-family/), [shadcn.io](https://www.shadcn.io/design/anthropic)

**The explicit "why" — this is the single most important quote for a redesign brief:**

> "We lean into a serif typeface, which can be more bookish, and folks at Anthropic are very bookish. But there's also balance with the synthetic — our sans-serif typeface is based on a more synthetic approach, representing AI and large language models. So there's this balance of humanity and the synthetic, light and shade." — Tim Belonax, Creative Director 🟢 [The Subtext interview](https://www.thesubtext.online/all/anthropic-interview)

In other words: **serif = humanity/research/books; sans = the synthetic/AI/machine side.** The pairing is a deliberate metaphor, not a stylistic accident.

**How the pairing is actually deployed (🟡, sources partially disagree on specifics — noted):**

- Serif is used **rarely and at unusually light display weights** (reported weight ~330–430, vs. normal-text 400) for hero headlines, feature-card titles, and "editorial moments" — never bolded up, because "the lightness is the point." 🟡 [duply.ai/claude](https://duply.ai/claude/design-md)
- Sans handles structural/UI layers: navigation, buttons, labels, badges, dense body copy, forms — i.e., everything interactive or information-dense. 🟡 [TypeUI](https://www.typeui.sh/design-skills/claude), [duply.ai](https://duply.ai/claude/design-md)
- Sources disagree on exact placement of serif vs sans on the marketing homepage (one capture found serif also used for large running body copy; another found sans-700 carrying the hero headline with serif reserved for dark feature-card display text). **Takeaway: sources agree on the two-typeface split and the "serif = rare editorial moment" principle, but disagree on exact placement — treat precise usage rules as approximate, not canonical.**
- Mono is reserved narrowly for code, timestamps, model IDs, version strings, category/classification tags — "its presence signals 'data' or 'classification' within otherwise typographic layouts." 🟡 [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42), [TypeUI](https://www.typeui.sh/design-skills/claude)
- Display type uses **tightening negative letter-spacing as size increases** (e.g., ‑0.02em at ~61px, ‑0.002em at body sizes) so large type reads as "architectural lettering" rather than blown-up body text. 🟡 [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)
- Common open-font substitutes cited across sources: Sans→**Inter** / StyreneB; Serif→**Tiempos Text**, Source Serif 4, Copernicus, Playfair Display, or Georgia; Mono→**JetBrains Mono**. 🟡 multiple sources

**Hierarchy logic:** a compact, restrained type scale (roughly a Major Third ~1.25 ratio in one capture) rather than a huge number of ad-hoc sizes — hierarchy is built from a disciplined few steps plus weight/tracking changes, not from many arbitrary sizes. 🟡 [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)

---

## 3. Spacing / Layout Philosophy

- **Generous, editorial whitespace** is repeatedly described as core to the "printed page" feeling — one analysis cites body line-height as high as 1.65, well above typical SaaS defaults. 🟡 Inference/opinion piece — [SeedFlip](https://seedflip.co/blog/anthropic-design-language). Note: this describes Anthropic's long-form **marketing/reading surfaces**, not a dense dashboard — see §6 for how to adapt this tension.
- **Section rhythm is large at the macro level**: one measured spacing scale (4/6/8/12/16/20/24/32/48/**96**px) uses 96px as the vertical gap between major page bands, while control/card padding sits in the 12–32px range. 🟡 [duply.ai/claude](https://duply.ai/claude/design-md)
- **Grid**: centered max-width container (~1200px), two-column editorial splits, 3-up card grids, simple sticky top nav (~68px) with no mega-menus. 🟡 [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)
- **"Band alternation" as a structural device**: full-bleed cream sections alternate with full-bleed near-black sections down the page. 🟡 [shadcn.io](https://www.shadcn.io/design/anthropic), [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)
- **Elevation is near-flat by design.** Separation between surfaces comes from a 1px warm-neutral hairline border and cream-vs-white background contrast, not drop shadows. Where shadows exist at all, they're measured at only ~1.6–4% black alpha — "whisper" shadows. No glassmorphism, no blur, no glow. 🟡 (this "no shadow/gradient/glow" restraint is the single most consistent claim across *every* source found — treat it as the highest-confidence layout principle here even though individually each source is 🟡).
- **Emphasis without color**: headline emphasis via a thick double-underline on key words rather than a color change. 🟡 [Refero Styles](https://styles.refero.design/style/d469cba4-c448-4a43-a033-883f8bfcdc42)
- Corner-radius treatment is **contested between sources**: reverse-engineered captures show a soft hierarchical radius scale (8/10/16/24/32px) 🟡; a separate opinionated interpretation prescribes flat 0px geometry 🟡. **Flag this explicitly as an open disagreement** — both agree corners should never be "excessive."

---

## 4. Tone & Personality Principles (voice → visual translation)

**Foundational voice pillars, stated directly by Anthropic's Head of Content:** *intelligent, warm, unvarnished, collaborative.* She singles out **"unvarnished"** as most distinctive — "we're okay with saying the truth. We don't want corporate gloss if it hides what's underneath." 🟢 [The Subtext interview](https://www.thesubtext.online/all/anthropic-interview)

**Other stated principles from the same interview** 🟢:
- *"Intellectual humility"* — "Claude is genius-level but doesn't feel pedantic or talking down... Claude walks with you, not ahead of you."
- *"Active integrity"* — say the hard/true thing rather than softening it.
- *"Urgent curiosity"* — exploratory, research-first energy rather than salesy confidence.
- Illustration philosophy, verbatim: *"The illustrations feel like when you're on the phone and doodling."* Low-fi, human, hand-drawn — not polished corporate art.
- These started as **voice** principles but were explicitly "up-leveled to brand principles for expression" — i.e., Anthropic treats visual restraint as a direct, intentional translation of how they want to *sound*.

**Official written-content guidance** (from Anthropic's own GitHub org, `anthropics/knowledge-work-plugins`) 🟢 [ux-copy SKILL.md](https://github.com/anthropics/knowledge-work-plugins/blob/main/design/skills/ux-copy/SKILL.md):
- Five pillars: **Clear** (no jargon/ambiguity), **Concise** (fewest words for full meaning), **Consistent** (same term for same thing everywhere), **Useful** (every word helps the user act), **Human** (write like a helpful person, not a robot).

**How this reads visually (design-critic synthesis, 🟡):** authority is earned through *restraint, contrast, and composition* rather than color or ornament; the interface should "feel confident enough not to shout." [TypeUI](https://www.typeui.sh/design-skills/claude)

---

## 5. Iconography, Imagery, Texture / Paper Motifs

- **No large public icon system was found documented by Anthropic itself.** 🔴 Low confidence / absence of evidence.
- **Illustration style is documented directly by the Creative Director as hand-drawn/doodle-like** — informal, diagrammatic, whiteboard-quality sketches, explicitly *not* polished 3D renders or stock photography. 🟢 [The Subtext interview](https://www.thesubtext.online/all/anthropic-interview)
- **No literal paper texture, grain, or skeuomorphic paper effects are documented anywhere.** The "parchment"/"paper" feeling every source independently reaches for in describing this brand comes entirely from **color choice (warm ivory) + typography (serif accents) + flat matte surfaces + generous margins** — not from a texture overlay. The UI remains crisp and digitally flat throughout. 🟡 This absence is consistent across every source reviewed and is itself a meaningful, actionable data point (see §6).
- **The wordmark itself carries a small distinctive glyph device**: the letter "I" in "ANTHROP\C" is rendered as a literal backslash `\`. This single idiosyncratic detail is "codified across the brand" as a recognizable signature. 🟡 [shadcn.io](https://www.shadcn.io/design/anthropic)
- Data visualization on Anthropic's actual dashboard-like surfaces (Economic Index / research pages) uses the muted secondary swatches (oat, cactus, sky, olive, fig, etc.) for category differentiation rather than saturated rainbow chart colors. 🟡

---

## 6. Concrete, Actionable Takeaways for a Chinese-Language "Warm Parchment" News Dashboard

The biggest structural caveat first: **Anthropic's own reference surfaces are mostly long-form, low-density marketing/editorial pages.** A high-density Chinese-language news dashboard has the opposite information profile. The transferable lessons are almost entirely about **chromatic/tonal restraint and typographic hierarchy**, not literal whitespace volume.

**Adopt directly — low risk, high payoff:**

1. **Canvas over white.** Warm ivory base (`#FAF9F5`–`#F5F0E8` range) for the page floor; reserve pure/near-white only for cards/inputs that need to lift off the canvas.
2. **Warm near-black ink, not pure black** (`#141413`-ish) for primary text.
3. **One accent color, used sparingly** for links/primary CTA/brand mark — not the exact Anthropic hex (stay distinct), but the same warm-earth *family* is on-brief. 🟢 direct principle from "unfired clay... human" quote.
4. **A small reserved secondary palette for data/category coding only** (muted sage, dusty blue, warm tan, muted plum) — assign to the existing content taxonomy (skills/MCP/rules/hooks/subagents) instead of saturated rainbow tag colors.
5. **Emphasis via weight/underline/scale instead of color, and near-flat elevation** (hairline borders + background-shade steps, not drop shadows). Highest-confidence claim across every source, and scales *better* at high density.
6. **Mono for all "data" tokens**: star counts, dates, version numbers, repo names, timestamps.
7. **Don't add literal paper texture/grain.** The effect is 100% color + type + restraint.
8. **One deliberate signature glyph**, not many decorative flourishes.

**Adopt with adaptation — CJK and density translation layer (🔴 inference, grounded in general CJK-typography practice):**

9. **Serif/sans split → keep the metaphor, change the mechanics.** Chinese serif (Noto Serif SC / Source Han Serif SC, or the more literary **LXGW WenKai 霞鹜文楷**) *only* for large, rare display moments (masthead title, section dividers, pull-quotes) — mirroring Anthropic's own "light-weight serif, used sparingly, never for dense UI" rule. Everything dense (nav, table rows, tags, body list text) in a clean Chinese sans (Noto Sans SC / Source Han Sans SC, PingFang SC / Microsoft YaHei as system fallbacks).
10. **Skip negative letter-spacing on Chinese text** — causes square full-width glyphs to visually collide. Keep Chinese tracking neutral; reserve tightened-tracking for Latin/numeral display elements only.
11. **Resolve density vs. whitespace by scale, not uniformly.** Apply "generous breathing room" at the *macro* level (page margins, section gaps, card padding) while keeping *micro* density tighter inside data-dense components (table rows, tag clusters, metadata lines).
12. **Borrow "band alternation" sparingly** — one cream→ink band as a masthead/header, not the whole page.
13. **Keep credibility/freshness signals visually quiet but present** — a small mono-styled "as of [date]" or source-link chip near each item.

---

**Summary judgment:** Anthropic's design language is best understood as *"a research journal, not a SaaS product"* — warmth and trust are built through **one warm neutral canvas + one near-black ink + one earth-tone accent + a deliberate serif/sans personality split + hairline-based near-flat surfaces + underline/weight-based emphasis**, with color kept scarce and scoped. That system transfers cleanly to a "warm parchment, high-density, high-readability" Chinese dashboard; the parts needing real adaptation are purely typographic (CJK serif-at-small-sizes and negative-tracking don't work like Latin type) and rhythmic (macro whitespace vs. micro density need to be decoupled).
