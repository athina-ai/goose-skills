# Skill: Create Custom Style from Reference Image

Extract the visual design language from a reference image and produce a reusable slim-format style preset file — the same format used by all 36 built-in presets (e.g., `brutalist.md`, `matt-gray.md`).

---

## When to Use

The user provides a reference image — a screenshot, design mockup, mood board, website capture, or any visual reference — and wants to capture its design language as a reusable style preset. The output is a slim-format `.md` style file (4-8KB) that is immediately usable via `--style <name>` in the goose-graphics workflow.

---

## Phase 1: Receive & Analyze the Image

### Step 1 -- Get the image

Ask the user to provide the reference image. Accept any of:
- A file path to an image on disk (PNG, JPG, WebP, etc.)
- A screenshot pasted into the conversation
- A URL to a publicly accessible image (use WebFetch to download it first, then read the downloaded file)

### Step 2 -- View the image

Read the image using the Read tool. The Read tool supports image files natively -- it will display the image contents visually for analysis.

If the image is unclear, low resolution, or only shows a partial design, ask the user if they have a better reference or if they want to proceed with what is available.

### Step 3 -- Systematic visual analysis

Examine the image carefully and work through every item in this checklist. Write your analysis out explicitly before moving to Phase 2 -- do not skip ahead.

**Colors:**
- Identify the 3-5 dominant colors in the design.
- For each color, estimate a clean hex value that matches the observed color family. Agent vision cannot extract exact hex codes, so pick well-balanced values within the right family (e.g., if you see a warm red, choose something like `#c94a4a` rather than guessing at the last digit).
- Classify each color by its role:
  - **Background** -- the dominant surface color
  - **Primary text** -- the main reading color
  - **Accent** -- the color used for emphasis, CTAs, highlights, interactive elements
  - **Secondary accent** -- a quieter supporting color if present
  - **Neutral/surface** -- any additional grays, tints, or surface colors for cards and containers
- Note whether the palette is warm, cool, or neutral in overall temperature.

**Typography:**
- Is the heading typeface serif, sans-serif, slab-serif, or monospace?
- Is the body typeface the same family or a different one?
- Estimate weight range: light (100-300), regular (400), medium (500), semibold (600), bold (700), heavy (800-900)?
- Is letter-spacing tight (negative tracking), normal, or wide (positive tracking)?
- Is line height compact or generous?
- Classify the overall type feel: geometric, humanist, elegant, technical, rounded, condensed, modern-clean.

**Layout:**
- Dense or spacious? How much whitespace surrounds elements?
- Grid-based or free-form? How many columns?
- Primary alignment: left-aligned, centered, or mixed?
- Card-based or flat sections? Do elements live in containers with visible borders/backgrounds?
- What is the overall content density -- minimal (few elements, lots of space) or information-rich?

**Mood:**
- Dark or light theme?
- Professional, playful, elegant, technical, warm, cold, editorial, brutalist, organic, corporate?
- What kind of brand or publication does this feel like? Name 2-3 analogies.

**Depth & Elevation:**
- Flat design with no shadows?
- Subtle shadows for slight lift?
- Heavy drop shadows or elevation?
- Borders: visible borders on containers, or borderless?
- If shadows exist, are they cool (gray/black) or warm-tinted?

**Special Elements:**
- Any gradients? Linear, radial, or mesh?
- Background patterns or textures?
- Glow effects, blur, or glassmorphism?
- Decorative elements: lines, shapes, icons, illustrations?
- Any distinctive UI patterns: pills, tags, badges, numbered items, progress indicators?

Write the full analysis as a structured list before continuing.

---

## Phase 2: Map to Available Fonts

The reference image likely uses fonts that may be proprietary or unavailable. Map the observed typography to the nearest freely available alternatives.

### Step 1 -- Classify the observed fonts

Based on your analysis, classify the heading and body fonts into one of these categories:

| Category | Characteristics |
|----------|----------------|
| Geometric sans | Clean, circular letterforms, even stroke width (e.g., Futura, Proxima Nova) |
| Humanist sans | Slightly organic, calligraphic influence, warm (e.g., Gill Sans, Frutiger) |
| Elegant serif | High stroke contrast, refined details, display-oriented (e.g., Didot, Bodoni) |
| Body serif | Moderate contrast, designed for reading at text sizes (e.g., Charter, Cambria) |
| Monospace | Fixed-width, technical feel (e.g., Courier, SF Mono) |
| Rounded | Rounded terminals and corners, friendly feel (e.g., VAG Rounded) |
| Condensed/heavy | Narrow letterforms or high weight, impactful (e.g., Impact, Anton) |
| Modern clean | Contemporary geometric sans with subtle personality (e.g., Satoshi, General Sans) |
| Slab serif | Thick, block-like serifs, sturdy feel (e.g., Rockwell, Clarendon) |

### Step 2 -- Select replacement fonts

Use this lookup table to pick the best available match from Google Fonts or Fontshare:

| Category | Recommended Options |
|----------|-------------------|
| Geometric sans | Space Grotesk, Inter, DM Sans, Plus Jakarta Sans |
| Humanist sans | Nunito, Source Sans Pro, Open Sans |
| Elegant serif | Playfair Display, Cormorant Garamond, EB Garamond |
| Body serif | Lora, Merriweather, Source Serif Pro |
| Monospace | JetBrains Mono, Fira Code, IBM Plex Mono |
| Rounded | Nunito, Varela Round, Comfortaa |
| Condensed/heavy | Archivo Black, Oswald, Bebas Neue |
| Modern clean | Satoshi (Fontshare), General Sans (Fontshare) |
| Slab serif | Roboto Slab, Zilla Slab, Arvo |

**Selection rules:**
- Pick one font for display/headings and one for body text. They can be the same family if the reference uses a single typeface.
- If the reference clearly uses a well-known free font (e.g., Inter, Roboto, Playfair Display), use it directly.
- Prefer Google Fonts over Fontshare for wider availability.
- Always include system font fallbacks in the font stack.

### Step 3 -- Build the Google Fonts link

Construct the `<link>` tag with the selected fonts and the specific weights needed:
- Display font: include weights 400, 700, and optionally 900. Include italic variants if the reference uses italic headings.
- Body font: include weights 300, 400, 500, and optionally 600.

---

## Phase 3: Generate the Slim Style File

Generate a style file in the **slim preset format** — the same structure used by all 36 built-in presets. Do NOT generate the verbose 9-section DESIGN.md format. If you need a structural reference, read `styles/brutalist.md` or `styles/matt-gray.md`.

The output should be **4-8KB** and contain these sections in order:

### Section 1: Header

```markdown
# Style Name

2-4 sentence prose description of the style's visual identity. Describe the mood, the palette logic,
the typography pairing, and what makes this style distinctive. Reference real-world analogies
(e.g., "the feel of a Scandinavian furniture catalog," "fintech dashboard energy").

> Custom style — extracted from reference image
```

### Section 2: Palette

A flat table with 6-12 rows. Every color gets a hex code and a role description. Include: background, primary text, accent, secondary accent (if present), card/surface colors, border colors, and any secondary text tones.

```markdown
## Palette

| Hex | Role |
|-----|------|
| `#xxxxxx` | Background (primary canvas) |
| `#xxxxxx` | Primary text |
| `#xxxxxx` | Accent — emphasis, CTAs, highlights |
| ... | ... |
```

**Color quality rules:**
- Don't use pure black (`#000000`) or pure white (`#ffffff`) unless the reference clearly does.
- Text-on-background contrast must meet WCAG AA (4.5:1 minimum). Mentally verify.
- Keep total palette to 6-12 named colors.

### Section 3: Typography

Include the Google Fonts `<link>` tag (if using webfonts), Display and Body font-family declarations with fallback stacks, a hierarchy table with 8-9 rows, and 3-5 Principles bullets.

```markdown
## Typography

**Google Fonts**

\`\`\`html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
\`\`\`

- **Display:** `'Font Name', fallback, sans-serif`
- **Body:** `'Font Name', fallback, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking | Transform |
|------|------|------|--------|-------------|----------|-----------|
| Display Hero | ... | 72px | 700 | 1.10 | -1px | none |
| Section Heading | ... | 48px | 700 | 1.15 | -0.5px | none |
| Sub-heading | ... | 32px | 600 | 1.20 | 0 | none |
| Body Large | ... | 22px | 500 | 1.55 | 0 | none |
| Body | ... | 18px | 400 | 1.55 | 0 | none |
| Caption | ... | 12-14px | 400 | 1.40 | ... | ... |
| Big Number | ... | 64-100px | 800 | 1.00 | ... | none |
| Label | ... | 14px | 500-600 | 1.00 | ... | ... |
| CTA | ... | 16-18px | 700 | 1.00 | ... | ... |

**Principles**

- 3-5 bullets explaining the typographic logic (why these pairings, tracking behavior, uppercase rules, etc.)
```

### Section 4: Layout

Bullet list covering format padding, border rules, radius, alignment, spacing, and any special layout elements (grids, textures, decorative patterns).

```markdown
## Layout

- Format padding: carousel Xpx · infographic X/X · slides Xpx · poster X/X.
- Border rules (thickness, color, style).
- Border-radius rules.
- Alignment rules (left, center, mixed).
- Card/container rules (bg, border, padding, radius).
- Any special elements (dot grids, background patterns, decorative shapes).
- Vertical rhythm and spacing between sections.
```

### Section 5: Do / Don't

5-6 Do rules and 5-6 Don't rules. Each must be specific and actionable with exact values (hex codes, px sizes, font names, weights). These encode the guardrails that prevent drifting off-style.

```markdown
## Do / Don't

**Do**

- [Specific rule with exact values]
- ...

**Don't**

- [Specific rule with exact values]
- ...
```

### Section 6: CSS Snippets

A `:root` variables block defining all CSS custom properties, followed by 4-5 self-contained component patterns as inline-styled HTML blocks. Each component must use the style's colors, fonts, and spacing directly (inline styles, not CSS variables in the HTML — the `:root` block is for reference).

Required components:
1. **Title block** — hero/header with headline, optional subtitle, optional label
2. **Numbered item or step** — stat, step number, or numbered list element
3. **Card** — bordered or surfaced container with content
4. **CTA block** — call-to-action button
5. **One style-specific component** — whatever is most distinctive about this style (quote block, stat display, tag system, grid pattern, etc.)

```markdown
## CSS snippets

### `:root` variables

\`\`\`css
:root {
  --color-bg: #...;
  --color-text: #...;
  --color-accent: #...;
  /* all palette colors */

  --font-display: '...', fallback;
  --font-body: '...', fallback;

  /* borders, radius, shadows, spacing as needed */
}
\`\`\`

### Title block (brief description)

\`\`\`html
<div style="...">...</div>
\`\`\`

### Numbered item (brief description)

\`\`\`html
<div style="...">...</div>
\`\`\`

[...3 more components...]
```

**Important:** Study the component snippets in `brutalist.md` and `matt-gray.md` for the right level of detail. Each snippet should be a complete, copy-pasteable HTML block with all styles inline.

---

## Phase 4: Save & Confirm

### Step 1 — Ask for a name

Ask the user what they want to name this style. Suggest 2-3 descriptive names based on the mood and palette (e.g., "arctic-minimal", "warm-startup", "dark-technical", "sunset-editorial"). The name must be lowercase-kebab-case.

**Name collision guard:** Before saving, check whether `styles/<name>.md` already exists in the styles directory. If it does and is a shipped preset (listed in `styles/index.json`), warn the user and suggest an alternative name. Do not overwrite shipped presets.

### Step 2 — Determine save location

Save the style file alongside the existing presets in the goose-graphics styles directory. Resolve the path relative to this skill file:

```
[skill-pack-dir]/styles/<name>.md
```

Where `[skill-pack-dir]` is the directory containing `SKILL.md` — the root of the goose-graphics skill pack. This is the same directory that contains `styles/brutalist.md`, `styles/matt-gray.md`, etc.

**Host-specific paths (for reference):**

| Host | Typical styles directory |
|------|------------------------|
| Claude Code / Desktop / Cowork | `~/.claude/skills/goose-graphics/styles/` |
| Codex (OpenAI) | `~/.codex/skills/goose-graphics/styles/` |
| Cursor | Styles embedded in `.cursor/rules/` (not applicable — Cursor uses a single `.mdc` file) |
| Local dev / project install | `./skills/goose-graphics/styles/` or wherever the pack was cloned |

In most cases, the skill is already running from the installed location, so saving to the `styles/` directory relative to this file is correct.

### Step 3 — Save the file

Write the complete style file using the Write tool.

### Step 4 — Confirm

Tell the user:
- The file was saved and its full path
- A 3-4 line summary of the extracted style: theme (dark/light), primary palette (background + text + accent hex codes), font pairing, and overall mood
- How to use it immediately:
  ```
  /goose-graphics --style <name> --format <format> --brief "..."
  ```

---

## Important Notes

### On Color Accuracy

Agent vision identifies color families, not exact hex values. The goal is to produce a **coherent, well-balanced palette** that captures the spirit of the reference, not to pixel-match it. When estimating hex values:

- Identify the color family first (warm red, cool blue, muted green, near-black, warm gray, etc.)
- Pick a clean, well-balanced hex within that family
- Verify contrast: primary text on background must be at least 4.5:1 (WCAG AA). For dark themes, light text on dark backgrounds. For light themes, dark text on light backgrounds.
- Use 3-5 primary colors max. Most well-designed references use very few colors -- adding more dilutes the identity.
- When in doubt, desaturate slightly. Oversaturated colors extracted from compressed images tend to look garish in production.

### On Font Matching

The goal is **typographic equivalence**, not exact matching. A geometric sans is a geometric sans -- whether it is Circular, Proxima Nova, or Inter. Match the category, weight range, and tracking behavior. The resulting designs will feel right even if the exact typeface differs.

### On Completeness

Every section of the output style file must be filled with substantive, specific content. Do not leave any section with placeholder text like "TBD" or "adjust as needed." The file should be immediately usable via `--style <name>` without further editing.

### On Format

The output MUST be in the slim preset format (Palette → Typography → Layout → Do/Don't → CSS snippets). Do NOT generate the verbose 9-section DESIGN.md format with sections like "Visual Theme & Atmosphere," "Depth & Elevation," or "Format Adaptation Notes." Those belong to the `_full/` archive versions. The slim format is what the generation pipeline reads.
