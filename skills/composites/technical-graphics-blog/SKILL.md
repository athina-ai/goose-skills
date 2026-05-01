---
name: blog-visual-generator
description: >
  Generates a complete set of publication-ready visuals and infographics for any blog post URL.
  Use this skill whenever the user provides a blog post link and asks for visuals, diagrams,
  infographics, illustrations, or images to accompany it — even if they just say "make visuals
  for this post", "illustrate this article", "add graphics", or "generate images for my blog".
  Also triggers for requests like "create a visual summary", "turn this into infographics",
  or "make this more visual". Produces: hero image, section flowcharts, comparison panels,
  stat infographics, and pipeline diagrams — all inline in chat AND as a downloadable HTML file.
  Always use this skill when a blog URL is present and any visual/graphic intent is expressed.
---

# Blog Visual Generator

Generates a complete, publication-ready visual set for any blog post from a URL.
Covers: hero image · flowcharts · infographics · comparison panels · stat cards · pipelines.
Output: inline widgets (show_widget) + downloadable HTML file.

---

## PHASE 0 — SETUP (run before anything else)

### Step 0-A: Fetch and analyse the blog post

Use `web_fetch` on the provided URL. Extract:

| Variable | What to detect |
|---|---|
| `BLOG_TITLE` | Post headline |
| `BLOG_TONE` | Technical / Strategy-GTM / Tutorial / Concept-Explainer / Mixed |
| `BLOG_SECTIONS` | List of all H2/H3 headings and their content summaries |
| `BLOG_DENSITY` | Count of sections (≥6 = Compact, 3–5 = Balanced, ≤2 = Spacious) |
| `BLOG_BRAND_COLORS` | Any hex codes, brand names, or color signals found in the page CSS or content |
| `BLOG_THEME_HINT` | Light / Dark / Neutral — inferred from brand colors and post tone |
| `BLOG_FONT_HINT` | Editorial prose → Inter/sans · Code-heavy → Mono-accent |
| `BLOG_INFOGRAPHIC_SECTIONS` | 1–3 sections with: key stats, numbered lists, before/after, or 3–5 discrete items |

Store all as `[BLOG_*]` variables. Use them throughout generation.

### Step 0-B: Detect brand palette

Attempt to infer the brand palette from `[BLOG_BRAND_COLORS]`:

- If specific hex codes are found → use them as ACCENT1, ACCENT2, ACCENT3
- If a known brand is detected (e.g. Stormy AI → indigo/teal/amber) → apply its palette
- If no signal → fall back to **Stormy AI Match**: `#4F63D2 · #0D9488 · #D97706`

Then apply theme:
- Light hint or Strategy/GTM/Tutorial tone → `BG=#FFFFFF, TEXT=#0F172A, MUTED=#64748B`
- Dark hint or code/agent-heavy → `BG=#0F1117, TEXT=#F0F4FF, MUTED=#8B95A8`
- Neutral → default Light

Lock the **Active Style Profile** (see reference file for full token table).

### Step 0-C: Ask two opt-in questions (REQUIRED — ask both at once)

Present these to the user before generating anything:

---
*"I've analysed the blog post and detected its style. Two quick questions before I start:*

*1. Would you like to customise the visual style (theme, palette, typography, density) before I generate? If yes, I'll walk you through a quick preference menu. If no, I'll use smart defaults based on the blog's own brand.*

*2. Would you like Napkin AI prompts included after each flowchart and pipeline diagram, so you can re-create them in Napkin AI?"*

---

- If **yes to preferences** → run the full MCQ intake (see `references/mcq-intake.md`)
- If **no to preferences** → use auto-detected Active Style Profile, note choices in output
- Record Napkin preference as `NAPKIN=true` or `NAPKIN=false`

---

## PHASE 1 — SECTION SCORING

Score every section 1–5 for visual opportunity:

| Score | Criteria |
|---|---|
| 5 | Multi-step workflow, comparison table, numbered protocol, pipeline with named tools |
| 4 | 3+ discrete items, before/after, classification system, stat-rich section |
| 3 | Conceptual explanation, single process, quote-anchored insight |
| 2 | Transitional paragraph, background context |
| 1 | Intro/outro filler, meta-commentary |

**Generate a visual for every section scoring ≥ 3**, plus always generate the Hero.

For each qualifying section, assign a visual type (see `references/visual-types.md`):

- Numbered list / protocol → **Icon Callout Infographic** (HTML)
- Before/after / comparison table → **Comparison Panel** (HTML)
- Key stats / metrics → **Editorial Stat Cards** (HTML)
- Multi-step workflow / pipeline → **Flowchart or Pipeline** (SVG)
- Single concept with spatial structure → **Concept Diagram** (SVG)
- Post summary / conclusion → **Pipeline Overview** (SVG)

---

## PHASE 2 — GENERATION RULES

### Pre-generation checklist (run before every visual)

Read `references/text-safety.md` before writing any SVG or HTML. Key rules:

- Explicit background rect as first SVG element
- Box width ≥ (longest_label_chars × 8.5) + 32px
- Box height: 44px (1-line) / 60px (2-line) / 76px (3-line)
- 16px horizontal padding, 10px vertical padding inside every box
- `dominant-baseline="central"` on all SVG text
- All font sizes ≥ 13px inside enclosed shapes
- Full-opacity accent fill → white text (#FFFFFF), weight 600
- Light-tint fill → darkest ramp shade text, weight 600
- Contrast ratio ≥ 4.5:1 on all text/background pairs
- SVG viewBox width always 680, height = lowest element + 40px
- Max 10 nodes per SVG — split into parts if more needed
- All connector `<path>` elements must have `fill="none"`
- No arrows crossing through unrelated boxes (use L-bend routing)

### Color encoding (never sequence-color)

| Semantic role | Color |
|---|---|
| Input / source / trigger | ACCENT1 |
| Processing / logic | ACCENT2 |
| Decision / branch | ACCENT3 |
| Output / result / success | SUCCESS (#059669) |
| Error / fallback | WARNING or DANGER |
| External system / API | NEUTRAL |
| Memory / storage | Purple (#7C3AED) |

### Visual sequence

Generate in this order:
1. **Hero image** (SVG) — always first
2. **Section visuals** in reading order (top to bottom of post)

After each visual, print the Napkin AI prompt if `NAPKIN=true` and the visual type qualifies (flowcharts, pipelines, hero, architecture diagrams — NOT stat cards or comparison panels).

---

## PHASE 3 — OUTPUT FORMAT

### Per visual block

```
────────────────────────────────────────
**Visual [N]: [Title]**
Covers: [section name]
Visual type: [hero / flowchart / infographic / comparison / pipeline / stat-cards]
Format: [SVG / HTML]
What it shows: [1 sentence]

▶ [rendered inline via show_widget]

📌 NAPKIN AI PROMPT: [only if NAPKIN=true and type qualifies]
[prompt text]
────────────────────────────────────────
```

### Style profile header (print once before Visual 0)

```
### 🎨 Active Style Profile
Theme:      [Light / Dark]
Background: [hex]
Text:       [hex] / [muted hex]
Palette:    [name — ACCENT1 · ACCENT2 · ACCENT3]
Font:       [stack]
Density:    [Spacious / Balanced / Compact]
Diagrams:   [Rounded+L-bend / Pill+Curved / Sharp+Straight]
Infographic:[style]
Napkin AI:  [Yes / No]
Source:     [Auto-detected / User-defined / Mixed]
```

### Final summary table (print after all visuals)

```
### ✅ Visual Summary
| # | Title | Type | Format | Section | Napkin? |
|---|-------|------|--------|---------|---------|
...

Total: [N] visuals · Theme: [X] · Palette: [X] · Infographics: [N]
```

### Downloadable HTML file

After all visuals are shown inline, compile them all into a single self-contained HTML file:

- One `<section>` per visual, with a visible heading
- All SVGs embedded inline
- All HTML infographics embedded as `<div>` blocks
- Light background (`#FFFFFF`), Inter font via Google Fonts `<link>`
- A print-friendly `<style>` block: page breaks between sections, no link underlines
- Save to `/mnt/user-data/outputs/blog-visuals-[slug].html`
- Present via `present_files` tool

---

## PHASE 4 — CONTENT ACCURACY RULES

- Use ONLY information explicitly stated in the blog post
- Never invent steps, metrics, tools, or connections
- Use exact labels and terminology from the post
- Preserve all logical ordering and hierarchy exactly as written
- For comparison visuals: reproduce only the columns/rows the post actually lists

---

## Reference files

Read these when needed — do not load all upfront:

| File | When to read |
|---|---|
| `references/mcq-intake.md` | User says yes to custom preferences |
| `references/visual-types.md` | Deciding which visual type fits a section |
| `references/text-safety.md` | Before writing any SVG |
| `references/style-tokens.md` | Looking up Active Style Profile hex values |
