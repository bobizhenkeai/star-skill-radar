# 调研材料：暖色羊皮纸美学的现代化落地 + 中英混排可读性

> 调研目的：为 `site/` 前端改版提供色彩系统与排印参考，非约束性指令。由主窗口 subagent 于 2026-07-02 完成网络调研并汇总，关键对比度数据经本地 Python 脚本独立验算（非直接采信来源方自述）。

---

# Warm Parchment → Modern Editorial Web Design: Research Reference Report

*Scope: translating "羊皮卷手写纸" warmth into a high-density, high-readability CJK+Latin technical dashboard. All contrast ratios below marked "verified" were independently computed (WCAG 2.1 relative-luminance formula) during this research, not just quoted from source sites.*

---

## 1. Color System Guidance

### Core rule
WCAG 2.1 AA requires **4.5:1** for normal text, **3:1** for large text (≥18pt/24px, or ≥14pt/19px bold) and for UI component borders/icons. AAA raises normal text to **7:1**. *(Confidence: high — W3C/WebAIM consensus.)*

The single most important mental model: **"warm" must live in the background and in hue undertone, not in a reduction of luminance contrast.** The failure mode is treating "warm" as "soft/muted/low-contrast." Successful precedents keep AA/AAA contrast and inject warmth purely through hue.

### Verified palette reference (real production/design-system tokens, contrast independently computed)

| Role | Background | Text | Ratio | Grade |
|---|---|---|---|---|
| Kami design system (OSS "warm parchment" doc system) | `#f5f4ed` parchment | `#141413` near-black | **16.7:1** | AAA |
| Kami | `#f5f4ed` | `#3d3d3a` secondary | **9.9:1** | AAA |
| Kami | `#f5f4ed` | `#504e49` subtext/olive | **7.5:1** | AAA |
| Kami | `#f5f4ed` | `#6b6a64` tertiary/metadata | **4.9:1** | AA only (reserve for captions/dates, not body) |
| Kami | `#f5f4ed` | `#1B365D` ink-blue accent | **11.0:1** | AAA — safe for links |
| "墨读" editorial theme (lingjie.li) | `#f5f0e8` paper | `#1a1410` ink | **16.1:1** | AAA |
| Same theme | `#f5f0e8` | `#7a6e62` muted caption | **4.37:1** | **Fails AA** (below 4.5:1) — cautionary example |
| Same theme | `#f5f0e8` | `#b8975a` gold accent | **2.43:1** | **Fails even AA-large (3:1)** — decorative-only, never text |
| Kindle Sepia reading mode | `#FBF0D9` | `#5F4B32` | **7.3:1** | AAA |
| Pocket/Firefox Reader sepia | `#F4ECD8` | `#5b4636` | **7.5:1** | AAA |
| WebAIM canonical "just barely passes" gray | `#FFFFFF` | `#767676` | 4.54:1 | AA floor |

**Takeaway (high confidence):** every professionally-shipped warm-paper reading surface (Kindle, Pocket, Kami) lands its **primary body-ink-to-page ratio between 7:1 and 17:1** — i.e., AAA, not the AA floor — precisely because a warm/cream page already reduces perceived crispness versus pure white, so they compensate with darker ink.

**Cautionary finding from independent verification:** even a polished, widely-shared "reference" warm-paper design (lingjie.li) ships a secondary/caption color (4.37:1) that fails strict AA, and a gold accent (2.43:1) usable only for non-text decoration. This is the single most common real-world mistake in warm palettes — **always re-verify every token pair with a calculator; don't trust that a "designed" warm palette is automatically accessible.**

### Concrete hex ranges to work from

- **Page background ("parchment/paper")**: warm off-white, NOT pure white. Target `#f4f0e6`–`#f7f5ee` range. Avoid going below ~90% lightness for a *primary* reading surface or it starts reading as "beige card" rather than "paper."
- **Elevated surface/card ("ivory")**: one step brighter than page bg, e.g. `#faf9f5`/`#fdfcf8`.
- **Primary ink**: near-black with a warm (olive/brown) undertone, not pure `#000`. Target `#14130f`–`#1c1917` (R≈G>B, i.e. warm) rather than neutral (R=G=B) or cool (R<G<B). Single biggest "looks warm and premium" lever.
- **Secondary/tertiary text**: warm grays with the same undertone bias, stepped so the darkest secondary tone still clears **≥4.5:1**; reserve sub-4.5:1 tones strictly for decorative/disabled states.
- **Single accent color**: exactly one saturated hue, held to a **small surface-area budget** (≤5% of the page). Multiple competing accent hues pushes a warm palette toward "gift shop" instead of "editorial."
- **Dark mode**: never invert to pure black/white. Warm-charcoal background (`#141413`–`#18130f`), warm off-white text — "lamp-lit page," not "OLED default."
- **Semantic/status colors** (error/warning/success — relevant for "breaking"/urgency tags): keep warm-shifted too (e.g. warm brown-red on muted peach) so they don't clash with the palette's temperature.

### Contrast-check methodology (Confidence: high, current best practice)
- Treat **WCAG 2.1 ratio as the compliance floor** (4.5:1 body / 3:1 large+UI).
- Layer **APCA (Lc)** on top for perceptual tuning — WCAG 2's math is known to overstate contrast for dark-on-light "mid-tone" pairs, exactly the zone warm-paper palettes live in. Target roughly **Lc 90 for dense body text, Lc 75 for comfortable reading, Lc 60 for large headings**.
- Never rely on a texture/noise layer sitting *behind* text — verify contrast against the *composited* pixel color; even 4–8% opacity noise can shave meaningful contrast off small text.

---

## 2. Typography Guidance for CJK + Latin

### Font-family recommendations (concrete, loadable today)

| Role | Chinese | Latin | Rationale |
|---|---|---|---|
| Display/masthead/large headlines | **Source Han Serif SC** / **Noto Serif SC** (same glyphs, Adobe vs Google branding), or system fallback `Songti SC`/`STSong` | **Source Serif 4**, **Charter**, **Georgia**, or **Playfair Display** | At large sizes, CJK serif strokes are wide enough to render crisply and carry "manuscript/editorial" warmth without hurting legibility. |
| Body/dense reading text (**safer default for a high-density dashboard**) | **PingFang SC** (macOS) / **Microsoft YaHei** (Windows) / **Source Han Sans** / **Noto Sans SC** | **Inter**, `-apple-system`, **Segoe UI**, or a humanist sans | At body sizes (14–16px), CJK sans-serif retains stroke clarity far better than CJK serif, whose thin hairline strokes anti-alias poorly on lower-density displays. Repeated finding across Chinese typography sources (阮一峰, Ant Design, atpX). |
| UI chrome (labels/tags/timestamps/nav) | System sans (PingFang/YaHei/Noto Sans SC) | System sans/mono for numerals | Never decorative/serif for chrome; reserve character for content only. |

**Two valid CJK strategies for "manuscript-but-legible," both used in shipped systems:**
1. **Serif-headline / sans-body split** (Kami's approach): Chinese headlines in a display serif, Chinese *body* in sans. English uses serif for both headline and body (Latin serif hairlines survive small sizes better).
2. **Serif-everything editorial** ("墨读" theme): Noto Serif SC body at large line-height (1.8–1.92) with Playfair Display for Latin/numeral headlines — for a slower "magazine reading" feel at lower density.

**For a technical news/intelligence dashboard specifically** (high density, frequent scanning), strategy 1 is the safer recommendation: **serif reserved for hero/section headlines and pull-quotes only; sans-serif for all dense body copy, tables, and UI.** Convergent with mainstream Chinese web-typography guidance (Ant Design, az-loc, easttech) for "tech/utility" sites vs. "cultural/publishing" sites. *(Confidence: high, convergent across ~6 independent sources.)*

### CJK–Latin mixed-script mechanics (concrete, implementable now)

```css
:root {
  text-autospace: normal;        /* auto 1/8-em gap between CJK and Latin/digits — Baseline since Nov 2025 */
  text-spacing-trim: trim-start; /* tightens punctuation at line edges */
}
@supports not (text-spacing-trim: trim-start) {
  :root { font-feature-settings: "halt" 1; } /* Safari fallback */
}
```
- Always set `lang="zh-CN"` on `<html>` — many browser behaviors and line-break/kinsoku rules are gated on it.
- Retires the old `pangu.js` manual-space-insertion hack; as of ~2026 all major browsers support `text-autospace`. *(High confidence, MDN + multiple 2026 sources.)*
- Latin text inside CJK paragraphs should render **1–2px/pt smaller** than surrounding CJK (Latin glyphs look visually larger/heavier next to square CJK glyphs at equal font-size).
- Use `font-variant-numeric: tabular-nums` (+ `lining-nums`) on numerals that must align in tables/metrics.
- Prefer straight/right-angle quotation marks (「」『』) over curly Latin-style quotes in Chinese text.
- **Avoid italics for CJK** — no native italic tradition; browser-synthesized oblique CJK glyphs look broken. Use color/weight (400→500, not →700) or a serif/sans switch for emphasis instead.

### Line-height / line-length (measure) guidance

| Metric | Chinese (CJK) | Latin |
|---|---|---|
| Line-height, dense/UI body | 1.4–1.5 | 1.4–1.6 |
| Line-height, comfortable reading body | **1.5–1.8** (editorial themes push to 1.9+) | 1.5–1.65 |
| Characters/line (measure) | **30–40** most-cited web range; controlled study found **36** optimal; classical print CJK converges on **~32** | ~50–75 (`max-width: 60–75ch`) |
| Letter-spacing, body | Neutral to slightly open (+0.02em to +0.05em) | 0 (default) |

*(Confidence: high — converged upon by Ant Design, Typotheque's CJK typesetting reference, an academic Chinese-proofreading eye-tracking study, and multiple production design.md files.)*

Practical implication: **CJK columns should be visually narrower than instinct suggests for Latin** — a full 75ch-wide Chinese text column feels sparse/slow to scan; cap Chinese prose blocks around `32–40em`-equivalent width, rely on line-height for "breathing room."

---

## 3. Real Product Examples and What to Emulate

| Product/System | What it does | Technique worth copying |
|---|---|---|
| **Kindle/Pocket/Firefox Reader "Sepia" mode** | Decades of iteration on exactly this brief | Ships AAA contrast (7.3–7.5:1) even in "warm" mode; sepia is *one user-selectable theme among several*, not a forced default — warmth as aesthetic choice layered on a high-contrast system, not achieved by degrading contrast. |
| **Notion** | Warm-reading productivity tool, not a paper pastiche | Warmth via **undertone discipline** in chrome (borders/hover states lean warm) even though base surface is near-white — warmth can be signaled subtly in chrome, not just via a tinted background. |
| **Bear (macOS/iOS)** | "Cozy but professional" notes | Warmth via curated theme + strong typography defaults, zero visual noise/texture — proof "paper feeling" can come from font choice + type settings alone. |
| **Readwise Reader** | Deep-reading/annotation | Highlight colors deliberately muted/warm (mimic physical highlighter ink) rather than neon digital tags — directly transferable to how tags/labels/highlights should look. |
| **微信读书 / QQ阅读** | Mainstream Chinese reading apps | User-toggle between 白天/仿书 (warm cream)/护眼 (soft green)/夜间 modes — validates "warm paper" as **one specific named mode**, distinct from green eye-care mode. Don't conflate the two. |
| **少数派 (Sspai)** | Chinese tech/lifestyle editorial site | Public style guide mandates straight CJK quotation marks, CJK–Latin spacing, restraint in visual flourish — "editorial feel" for Chinese tech content achieved through **typographic discipline**, not decoration. Same genre as this project. |
| **"Kami" (tw93/Kami) + "墨读" reader theme** | Already-productionized "warm parchment + CJK + modern/editorial" systems for reports/dashboards | Closest direct precedents. Converging conventions: warm parchment bg never pure white; exactly one saturated accent, tightly budgeted; all grays warm-toned; depth via hairline borders + soft "whisper" shadows; serif for authority/headlines, sans for utility/body; texture (if any) as near-subliminal noise. |

**Cross-cutting lesson:** products reading as "warm but professional" treat warmth as living in **hue/undertone + typography + generous whitespace**, with editorial structure (hairline grids, restrained accent budget, real typographic hierarchy) doing the actual work of feeling "crafted." None lean on skeuomorphic texture as the primary device.

---

## 4. Anti-Pattern Checklist

Ordered roughly by how often each single-handedly tanks a "warm parchment" concept:

1. **Sepia/tint applied as a global CSS filter or translucent overlay** rather than deliberately chosen token colors — crushes black-point, desaturates everything uniformly, silently drags every contrast ratio down. Fix: define warm colors as first-class tokens, never a filter/overlay on a normal-contrast UI.
2. **Visible paper texture/noise/grain**, especially torn edges, crumples, ink blots, stains. Production systems keeping "premium not kitsch" use noise at **~4–7% opacity** as tiny tiled fractal-noise — "texture as whisper, not shout." Above ~10–12% opacity, or any visible fiber/stain imagery, reads as a template/genre skin (fantasy map, wedding invite), not a technical product.
3. **Decorative/calligraphic/script fonts for body text or UI** — legitimate only for a logo/wordmark or single short accent phrase, never a sentence a user must read.
4. **Hard drop shadows and skeuomorphic bevels/gradients** (embossed edges, glossy highlights, 3D lifted corners) — the iOS-6-to-7 skeuomorphism collapse failure mode; reads as dated within a few years. Restrict elevation to hairline borders plus at most a soft, large-blur, low-opacity "whisper shadow" (e.g. `0 4px 24px rgba(0,0,0,0.05)`).
5. **Using a warm accent (gold/amber/sienna) as if it were a readable text/UI color** without checking contrast — verified example above at only 2.43:1. Treat gold/amber/tan as decoration-only until proven otherwise by a contrast check.
6. **Cool grays leaking into an otherwise warm palette** — e.g. warm cream bg paired with default framework neutral grays for borders/secondary text. Every hue needs the same warm undertone; a single cool-gray border or bluish secondary text is immediately perceptible as "off."
7. **Over-decoration / low restraint on the accent color** — multiple saturated hues, gradients, glow/neon, glassmorphism stacking. Cap a single chromatic accent to roughly **≤5% of visual surface area**.
8. **Justified CJK text without proper hanging-punctuation/kerning support** — produces uneven gaps ("rivers"). Left-alignment is the safer default for mixed CJK+Latin body text unless the stack specifically supports `text-spacing-trim`/hanging punctuation.
9. **Applying italic to Chinese text for emphasis** (common default in naive Markdown→HTML pipelines) — CJK has no italic tradition; synthesized oblique CJK glyphs look visibly broken. Route emphasis through weight/color for CJK runs.
10. **Ultra-thin or ultra-black font weights for either script** — reference systems lock to a narrow 400/500(/600 for tiny labels) range; thin CJK weights lose stroke integrity on screen, black CJK weights read as clumsy rather than "hand-crafted."
11. **Treating "护眼" (eye-care green/blue) and "羊皮卷/仿古" (warm parchment) as the same request** — visually and semantically distinct patterns in Chinese product UX; conflating them produces a muddy, undecided palette.

---

### One-paragraph synthesis for quick reference

Build the palette around a **warm off-white page (~`#f4f0e6`–`#f7f5ee`), warm near-black ink (~`#14130f`–`#1c1917`, verified 15–17:1 contrast), and exactly one saturated accent hue capped at ~5% of surface area**; keep every gray warm-toned with zero cool-gray leakage. Typeset dense body copy in a **CJK sans (PingFang SC/Microsoft YaHei/Source Han Sans/Noto Sans SC) at 1.5–1.8 line-height and ~30–40 characters/line**, reserving a **CJK serif (Source Han Serif SC/Noto Serif SC)** for large headlines only, paired with a Latin editorial serif (Charter/Georgia/Source Serif) for Latin display and a clean humanist sans for Latin UI/body; enable `text-autospace: normal` for automatic CJK–Latin spacing. Signal "manuscript warmth" through hue, generous whitespace, hairline-rule structure, and (at most) near-subliminal ~5% noise texture — never through visible parchment texture, decorative script fonts, sepia filters/overlays, or hard drop shadows.
