# Halftone Electric

Electric blue brand canvas built around halftone dot imagery — white circle grids fade across saturated blue panels to form silhouettes, charts, and abstract textures. Black and white side surfaces ground the system with sharp modular cards and Space Grotesk display type. Reads like a contemporary DeFi or infra-protocol brand mood board: confident, technical, image-forward.

> Custom style — extracted from reference image.

## Palette

| Hex | Role |
|-----|------|
| `#1A3CFF` | Electric blue — primary surface, brand color |
| `#1432D4` | Deep electric — secondary blue, darker fade |
| `#0A0A0A` | Near-black — alt surface, ink |
| `#FFFFFF` | White — text on blue/black, halftone dot fill |
| `#F2F2F2` | Cool white — light card surface |
| `#E5E5E5` | Light gray — divider lines, faint borders |
| `#9CA3AF` | Mid gray — secondary text on light surfaces |
| `#3B3B3B` | Dark gray — body text on light surfaces |
| `rgba(255,255,255,0.70)` | White 70 — body text on blue/black |
| `rgba(255,255,255,0.40)` | White 40 — metadata, captions on blue/black |
| `rgba(255,255,255,0.18)` | White 18 — half-fade halftone dots |
| `rgba(255,255,255,0.06)` | White 6 — empty halftone dots on blue/black |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking | Transform |
|------|------|------|--------|-------------|----------|-----------|
| Display Hero | Space Grotesk | 84px | 700 | 0.95 | -2.5px | none |
| Section Heading | Space Grotesk | 56px | 700 | 1.00 | -1.5px | none |
| Sub-heading | Space Grotesk | 32px | 600 | 1.10 | -0.5px | none |
| Card Title | Space Grotesk | 22px | 600 | 1.20 | -0.3px | none |
| Body Large | Inter | 18px | 400 | 1.55 | 0.1px | none |
| Body | Inter | 14px | 400 | 1.55 | 0.1px | none |
| Eyebrow | Inter | 11px | 600 | 1.00 | 1.5px | UPPER |
| Bullet Label | Inter | 12px | 500 | 1.20 | 0 | none |
| CTA | Inter | 14px | 600 | 1.00 | 0.4px | none |

**Principles**

- Space Grotesk handles every display surface — its slightly geometric character matches the "tech brand" feel.
- Inter does all reading work; weight (not italic) carries emphasis.
- Card titles open with a small "•" or "→" prefix in the same color as the title — a structural marker, not decoration.
- Negative tracking on display sizes (-1.5px to -2.5px) tightens hero blocks; body stays at 0.1px positive.

## Layout

- Format padding: carousel 56px · infographic 56/72 · slides 80px · poster 56/72 · tweet 48px.
- Sharp corners only — no border-radius anywhere except dots (`50%`).
- Cards: solid color blocks (`#1A3CFF`, `#0A0A0A`, or `#F2F2F2`) with no border. 1px `#E5E5E5` divider lines on light cards if needed.
- Modular grid: 2-column or 3-column card mosaic. Each card is a different surface color — blue / black / white — so the grid reads like a brand mood board.
- Halftone dot grid: the signature visual. Build with CSS grid of small circles (4-10px diameter, 4-8px gap, `border-radius:50%`). Each dot is white at varying opacity (`1.0`, `0.55`, `0.18`, `0.06`) to fade into shapes (silhouette, chart, gradient block). Use 16-32 columns × 12-24 rows.
- Eyebrow labels sit at the top of every card in 11px Inter UPPER with 1.5px tracking, in `rgba(255,255,255,0.40)` on dark surfaces or `#9CA3AF` on light surfaces.
- Brand mark / wordmark sits bottom-left or bottom-right at 16-20px Space Grotesk 700.

## Do / Don't

**Do**

- Use halftone dot grids (white circles on blue/black, or black circles on white) as the primary imagery — they are the brand.
- Mix all three surface colors (`#1A3CFF`, `#0A0A0A`, `#FFFFFF`) inside one composition — modular card energy.
- Prefix card titles with "•" or "→" in 22-32px Space Grotesk 600, same color as the title.
- Keep Space Grotesk for display + Inter for body — never substitute or mix in a third typeface.
- Vary halftone dot opacity (`1.0` → `0.55` → `0.18` → `0.06`) inside one grid to create gradient/shape definition.

**Don't**

- Don't introduce a second accent color — electric blue is the only chromatic surface.
- Don't add border-radius to cards — sharp 0px corners only (dots are the exception).
- Don't use shadows, glows, or gradients — color blocks and halftone dots provide all depth.
- Don't use photographs — halftone dot patterns replace photography in this system.
- Don't use uppercase on display text — only on 11px eyebrows and metadata.
- Don't use thin borders or hairline outlines on cards — color separation is enough.

## CSS snippets

### `:root` variables

```css
:root {
  --color-electric: #1A3CFF;
  --color-electric-deep: #1432D4;
  --color-ink: #0A0A0A;
  --color-white: #FFFFFF;
  --color-cool-white: #F2F2F2;
  --color-line: #E5E5E5;
  --color-mid: #9CA3AF;
  --color-body: #3B3B3B;

  --dot-on:        rgba(255,255,255,1);
  --dot-mid:       rgba(255,255,255,0.55);
  --dot-fade:      rgba(255,255,255,0.18);
  --dot-empty:     rgba(255,255,255,0.06);

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Title block (electric blue hero with halftone dot field)

```html
<div style="background:#1A3CFF; padding:56px; color:#fff; position:relative; overflow:hidden;">
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin:0 0 24px;">— PROTOCOL / 2026</p>
  <h1 style="font-family:'Space Grotesk',sans-serif; font-size:84px; font-weight:700; line-height:0.95; letter-spacing:-2.5px; color:#fff; margin:0 0 24px; max-width:780px;">We are a DeFi network focused on building.</h1>
  <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.70); margin:0; max-width:560px;">Composable infrastructure for the next generation of onchain applications, built by the people using it.</p>
</div>
```

### Halftone dot field (signature visual)

```html
<div style="background:#1A3CFF; padding:32px; display:grid; grid-template-columns:repeat(20,8px); gap:6px; justify-content:start;">
  <!-- Top-row: dense saturated dots fading into faint -->
  <!-- Use repeated rows; vary opacity per dot to form a silhouette or gradient -->
  <!-- Example row 1 — fully filled -->
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,1);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,1);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.55);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.55);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
  <!-- ...continue 12-20 columns × 12-24 rows ... -->
</div>
```

### Modular three-card row (mixed surfaces)

```html
<div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:16px;">
  <!-- Blue card -->
  <div style="background:#1A3CFF; padding:32px; color:#fff;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin:0 0 16px;">— OVERVIEW</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.10; letter-spacing:-0.5px; margin:0 0 12px;">• Structured Data Modules</h3>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.70); margin:0;">Composable building blocks for onchain workflows.</p>
  </div>
  <!-- Black card -->
  <div style="background:#0A0A0A; padding:32px; color:#fff;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin:0 0 16px;">— INFRASTRUCTURE</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.10; letter-spacing:-0.5px; margin:0 0 12px;">• Infra DeFi</h3>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.70); margin:0;">Validator-grade tooling for protocol teams.</p>
  </div>
  <!-- White card -->
  <div style="background:#F2F2F2; padding:32px; color:#0A0A0A;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#9CA3AF; margin:0 0 16px;">— ROADMAP</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.10; letter-spacing:-0.5px; margin:0 0 12px;">• Next gen.</h3>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:#3B3B3B; margin:0;">Where the protocol heads in 2026.</p>
  </div>
</div>
```

### CTA

```html
<a style="display:inline-flex; align-items:center; gap:8px; background:#FFFFFF; color:#1A3CFF; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.4px; text-decoration:none; padding:14px 24px;">Read the docs <span style="font-family:'Space Grotesk',sans-serif; font-weight:700;">→</span></a>
```
