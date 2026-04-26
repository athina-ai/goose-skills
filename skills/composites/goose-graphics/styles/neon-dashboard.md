# Neon Dashboard

Moody dark-jewel analytics dashboard with neon accents. Surfaces in deep purple, forest, and maroon are lifted by bright neon pink and yellow highlights. The signature move is the **colored pill label paired with a neon-pink hero stat**, often accompanied by a tiny chart vignette (bars, dotted line, or block stack). Premium SaaS analytics product feel — the kind of insight card you'd see in a polished BI tool or a high-end product marketing page.

## Palette

| Hex | Role |
|-----|------|
| `#F5F1EA` | Stage canvas — off-white surround |
| `#1F0E2E` | Deep purple — primary surface |
| `#0E2A1E` | Dark forest — secondary surface |
| `#2B0E14` | Dark maroon — tertiary surface |
| `#F18CFF` | Neon pink — hero stat + accents |
| `#F2E33A` | Neon yellow — secondary accent + chart highlights |
| `#FFFFFF` | White — body text on dark surfaces |
| `rgba(255,255,255,0.80)` | White 80 — descriptive text |
| `rgba(255,255,255,0.45)` | White 45 — captions, axis labels |
| `rgba(255,255,255,0.10)` | White 10 — gridlines, dotted dividers |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display & Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Hero Stat | Inter | 72px | 700 | 1.00 | -2px |
| Display Title | Inter | 48px | 700 | 1.05 | -1px |
| Sub-stat | Inter | 40px | 700 | 1.05 | -1px |
| Body Large | Inter | 16px | 400 | 1.55 | 0 |
| Body | Inter | 14px | 400 | 1.55 | 0.1px |
| Pill Label | Inter | 11px | 700 | 1.20 | 1.5px UPPER |
| Caption | Inter | 10px | 500 | 1.20 | 0.5px UPPER |
| Axis | Inter | 10px | 600 | 1.10 | 0.3px |

**Principles**

- Hero stat is in **neon pink `#F18CFF`** with a leading `+` sign — this is the signature visual hook.
- Pill label always sits at the top of a card or section: rounded `999px`, semi-transparent neon ground, neon-colored text matching the card's mood.
- Neon yellow is the secondary highlight — used for chart accents, the most-recent data point, or a single emphasized word.
- Body text never goes below 80% white on dark surfaces — readability matters even in moody mode.

## Layout

- Format padding: carousel 56px · infographic 56/72 · slides 80px · poster 56/72 · story 56px · chart 56px · tweet 40px.
- Canvas is the off-white stage `#F5F1EA` — the dark surfaces float on top, giving the look of insight cards in a designed product page.
- Surfaces use `border-radius: 28px`, no border, no shadow.
- Pill label → hero stat → 1-2 line description → optional mini chart vignette → tiny "see all insights" footer dot. This top-down rhythm holds even when the surface is a single full-bleed canvas (no card chrome).
- Mini chart vignettes occupy the lower half/third of a surface — never the top.
- A surface can be a single full-canvas card (poster, tweet, chart) or a row/grid of vertical cards (carousel, infographic, slides).

## Do / Don't

**Do**

- Lead the hero stat with a `+` (or `−`) sign in neon pink.
- Use pill labels for every section header — `padding: 6px 14px; border-radius: 999px`.
- Include a tiny chart vignette (bar / dotted line / block stack) when there's room — it sells the analytics aesthetic.
- Pair neon pink + neon yellow within the same composition for the signature glow.
- Use dotted gridlines and 1px dotted dividers — they read as "data" without dominating.

**Don't**

- Don't use bright primary colors outside the neon pink/yellow accent set.
- Don't put dark text on dark surfaces — white only, at 80%+ opacity.
- Don't use serif fonts — Inter throughout.
- Don't apply heavy shadows or gradients to surfaces — flat dark with neon accents is the whole point.
- Don't swap the canvas to pure white or pure black — `#F5F1EA` is the framing ground.

## CSS snippets

### `:root` variables

```css
:root {
  --color-stage: #F5F1EA;
  --color-purple: #1F0E2E;
  --color-forest: #0E2A1E;
  --color-maroon: #2B0E14;
  --color-neon-pink: #F18CFF;
  --color-neon-yellow: #F2E33A;
  --color-white: #FFFFFF;
  --color-white-80: rgba(255,255,255,0.80);
  --color-white-45: rgba(255,255,255,0.45);
  --color-grid: rgba(255,255,255,0.10);

  --card-radius: 28px;
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Insight card

```html
<div style="background:#1F0E2E; border-radius:28px; padding:32px; min-height:480px; display:flex; flex-direction:column;">
  <span style="display:inline-flex; align-self:flex-start; background:rgba(241,140,255,0.15); color:#F18CFF; font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:6px 14px; border-radius:999px;">API calls</span>
  <h2 style="font-family:'Inter',sans-serif; font-size:72px; font-weight:700; line-height:1.00; letter-spacing:-2px; color:#F18CFF; margin:24px 0 12px;">+284%</h2>
  <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; line-height:1.55; color:rgba(255,255,255,0.80); max-width:280px; margin:0;">API usage has seen a remarkable increase, surging to 284% over the last month.</p>
  <!-- chart vignette would sit here, in lower half -->
  <div style="margin-top:auto; display:flex; align-items:center; gap:8px;">
    <span style="width:6px; height:6px; border-radius:50%; background:#F18CFF;"></span>
    <span style="font-family:'Inter',sans-serif; font-size:10px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:rgba(255,255,255,0.45);">See all insights</span>
  </div>
</div>
```

### CTA (neon pill)

```html
<a style="display:inline-block; background:#F18CFF; color:#1F0E2E; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.5px; text-decoration:none; padding:14px 28px; border-radius:999px;">View dashboard</a>
```
