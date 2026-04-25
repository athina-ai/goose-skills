# Halftone Mono

Pure black-and-white halftone editorial. The dot-matrix motif from the same brand family as Halftone Electric, distilled into grayscale only — black canvas with white dot fields, white canvas with black dot fields. Sharp modular cards, Space Grotesk display, no chromatic accent. Reads like a contemporary technical zine or annual report.

> Custom style — extracted from reference image.

## Palette

| Hex | Role |
|-----|------|
| `#0A0A0A` | Near-black — primary dark surface, primary ink |
| `#FFFFFF` | White — primary light surface, dots on dark |
| `#F4F4F4` | Off-white — alt light surface, soft canvas |
| `#E5E5E5` | Light gray — divider lines |
| `#888888` | Mid gray — secondary text on light, mid-fade dots |
| `#3B3B3B` | Dark gray — body text on light surfaces |
| `#1F1F1F` | Deep charcoal — alt dark surface |
| `rgba(255,255,255,0.70)` | White 70 — body text on black |
| `rgba(255,255,255,0.40)` | White 40 — eyebrow / metadata on black |
| `rgba(255,255,255,0.18)` | White 18 — half-fade halftone dots on black |
| `rgba(255,255,255,0.06)` | White 6 — empty halftone dots on black |
| `rgba(0,0,0,0.18)` | Black 18 — half-fade halftone dots on white |
| `rgba(0,0,0,0.06)` | Black 6 — empty halftone dots on white |

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

- Same Space Grotesk + Inter pairing as Halftone Electric — this style is the chromatic-free sibling.
- Hierarchy emerges from size, weight, and surface contrast (black vs. white) — not color.
- Card titles open with a small "•" or "→" prefix in the same color as the title.
- Negative tracking on display sizes (-1.5px to -2.5px); body stays at 0.1px positive.

## Layout

- Format padding: carousel 56px · infographic 56/72 · slides 80px · poster 56/72 · tweet 48px.
- Sharp corners only — no border-radius anywhere except dots (`50%`).
- Cards: solid black `#0A0A0A` or white `#F4F4F4` blocks with no border. Optional 1px `#E5E5E5` dividers on white.
- Modular grid: 2-column or 3-column card mosaic. Surfaces alternate between black and white to create rhythm.
- Halftone dot grid: white circles on black surfaces, OR black circles on white surfaces. 4-10px diameter, 4-8px gap, 16-32 cols × 12-24 rows. Vary opacity (`1.0` → `0.55` → `0.18` → `0.06`) to fade into shapes.
- Eyebrow labels at the top of every card: 11px Inter UPPER 1.5px tracking, in `rgba(255,255,255,0.40)` on black or `#888888` on white.
- Brand mark / wordmark at 16-20px Space Grotesk 700.

## Do / Don't

**Do**

- Use halftone dot grids as the primary imagery — white-on-black or black-on-white only.
- Mix black and white surfaces inside one composition — alternation creates rhythm.
- Prefix card titles with "•" or "→" in 22-32px Space Grotesk 600.
- Keep Space Grotesk for display + Inter for body — same pairing as Halftone Electric.
- Vary halftone dot opacity inside one grid to create gradient and shape definition.

**Don't**

- Don't introduce any chromatic color — this is a pure mono system.
- Don't add border-radius to cards — sharp 0px corners only (dots are the exception).
- Don't use shadows, glows, or gradients — surface contrast and dot density provide depth.
- Don't use photographs — halftone dot patterns replace photography.
- Don't soften contrast — pure `#0A0A0A` and pure `#FFFFFF` (or `#F4F4F4`) is the mandate.
- Don't use thin borders or hairline outlines on cards — surface contrast separates them.

## CSS snippets

### `:root` variables

```css
:root {
  --color-ink: #0A0A0A;
  --color-charcoal: #1F1F1F;
  --color-white: #FFFFFF;
  --color-soft-white: #F4F4F4;
  --color-line: #E5E5E5;
  --color-mid: #888888;
  --color-body: #3B3B3B;

  --dot-light-on:   rgba(255,255,255,1);
  --dot-light-mid:  rgba(255,255,255,0.55);
  --dot-light-fade: rgba(255,255,255,0.18);
  --dot-light-empty:rgba(255,255,255,0.06);
  --dot-dark-on:    rgba(0,0,0,1);
  --dot-dark-mid:   rgba(0,0,0,0.55);
  --dot-dark-fade:  rgba(0,0,0,0.18);
  --dot-dark-empty: rgba(0,0,0,0.06);

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Title block (black hero with halftone dot field)

```html
<div style="background:#0A0A0A; padding:56px; color:#fff;">
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin:0 0 24px;">— REPORT / 2026</p>
  <h1 style="font-family:'Space Grotesk',sans-serif; font-size:84px; font-weight:700; line-height:0.95; letter-spacing:-2.5px; color:#fff; margin:0 0 24px; max-width:780px;">The next generation of structured data.</h1>
  <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.70); margin:0; max-width:560px;">Composable, queryable, and rendered entirely in pixel halftones.</p>
</div>
```

### Halftone dot field (signature visual — white dots on black)

```html
<div style="background:#0A0A0A; padding:32px; display:grid; grid-template-columns:repeat(20,8px); gap:6px; justify-content:start;">
  <!-- Vary opacity per dot to fade into a silhouette or gradient -->
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,1);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,1);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.55);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.18);"></div>
  <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
  <!-- ...continue 16-32 columns × 12-24 rows ... -->
</div>
```

### Modular two-card row (alternating surfaces)

```html
<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
  <!-- Black card -->
  <div style="background:#0A0A0A; padding:32px; color:#fff;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.40); margin:0 0 16px;">— SIGNAL</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.10; letter-spacing:-0.5px; margin:0 0 12px;">• What is new?</h3>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.70); margin:0;">Quarterly notes from the protocol team, in halftone.</p>
  </div>
  <!-- White card -->
  <div style="background:#F4F4F4; padding:32px; color:#0A0A0A;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#888888; margin:0 0 16px;">— DIRECTION</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.10; letter-spacing:-0.5px; margin:0 0 12px;">• Next gen.</h3>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:#3B3B3B; margin:0;">Where the system heads in the year ahead.</p>
  </div>
</div>
```

### CTA

```html
<a style="display:inline-flex; align-items:center; gap:8px; background:#0A0A0A; color:#FFFFFF; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.4px; text-decoration:none; padding:14px 24px;">Read the report <span style="font-family:'Space Grotesk',sans-serif; font-weight:700;">→</span></a>
```
