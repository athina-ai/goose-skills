# Pillow Block

Soft, pillowy rounded-rectangle tiles in a punchy "candy corporate" palette. The signature move is the **24-32px border-radius squircle** — no shadows, no borders, just saturated flat color rounded into friendly pillow shapes. Generous whitespace canvas around them. Notion / Linear / Mercury energy — modern product marketing made warm and confident.

## Palette

| Hex | Role |
|-----|------|
| `#F4F3EE` | Off-white canvas — primary background |
| `#0A0A0A` | Jet black — anchor tile + ink |
| `#F26B3A` | Coral orange — accent tile |
| `#0E3D2F` | Pine green — deep accent tile |
| `#F3A8DA` | Candy pink — soft accent tile |
| `#D8EE57` | Lime — bright accent tile + on-pine numerals |
| `#FFFFFF` | White — text on dark tiles |
| `rgba(255,255,255,0.65)` | White 65 — secondary text on dark tiles |
| `rgba(10,10,10,0.65)` | Ink 65 — secondary text on light tiles |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display & Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Hero Numeral | Inter | 140px | 700 | 0.90 | -4px |
| Display Title | Inter | 56px | 700 | 1.00 | -1.5px |
| Tile Title | Inter | 22px | 700 | 1.15 | -0.4px |
| Tile Eyebrow | Inter | 12px | 500 | 1.20 | 0.2px |
| Body | Inter | 15px | 400 | 1.55 | 0 |
| Label | Inter | 11px | 600 | 1.20 | 1.5px UPPER |
| Brand | Inter | 22px | 700 | 1.00 | -0.5px |

**Principles**

- Tiles are pillowy: `border-radius: 28px`, no shadows, no borders.
- Numerals dominate — drop big numbers to the bottom-right of any tile.
- Pair colors loudly: black + orange + pine + pink + lime is the full house, but any 2-3 also works.
- Typography is calm — Inter does the talking, color does the shouting.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80 · story 60px · chart 60px · tweet 48px.
- Canvas is always off-white `#F4F3EE` — never tinted, never gradient.
- Tiles sit on the canvas with generous gaps (24-40px between them).
- Eyebrow label sits top-left of each tile; title under it; numeral bottom-right.
- Even single-tile compositions (e.g. tweet) use the rounded squircle as the full hero; the canvas margin frames it.
- Brand mark in plain ink at the bottom or top-left of the canvas — never inside a tile.

## Do / Don't

**Do**

- Use `border-radius: 28px` on every tile.
- Make hero numerals huge (110-180px) and anchor them bottom-right.
- Drop white text on black/pine/orange tiles; black text on pink/lime; lime numerals on pine for the signature contrast.
- Leave generous canvas around the tile cluster — the air is part of the look.
- Mix tile sizes freely — bento, single hero, row of three, all valid.

**Don't**

- Don't use shadows, borders, or gradients on tiles.
- Don't tint the canvas — keep it `#F4F3EE`.
- Don't introduce serif fonts — Inter only.
- Don't squeeze tiles edge-to-edge — they need breathing room.
- Don't overuse color — pick 2-4 tile colors max for a single composition.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #F4F3EE;
  --color-ink: #0A0A0A;
  --color-orange: #F26B3A;
  --color-pine: #0E3D2F;
  --color-pink: #F3A8DA;
  --color-lime: #D8EE57;
  --color-white: #FFFFFF;
  --color-ink-muted: rgba(10,10,10,0.65);
  --color-white-muted: rgba(255,255,255,0.65);

  --tile-radius: 28px;
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Pillow tile (hero numeral)

```html
<div style="background:#0E3D2F; border-radius:28px; padding:32px; aspect-ratio:1/1; display:flex; flex-direction:column; justify-content:space-between;">
  <div>
    <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:500; color:rgba(255,255,255,0.55); margin:0 0 6px;">14 friends visited</p>
    <h3 style="font-family:'Inter',sans-serif; font-size:24px; font-weight:700; line-height:1.10; letter-spacing:-0.4px; color:#fff; margin:0;">Visited places</h3>
  </div>
  <p style="font-family:'Inter',sans-serif; font-size:120px; font-weight:700; line-height:0.90; letter-spacing:-4px; color:#D8EE57; align-self:flex-end; margin:0;">23</p>
</div>
```

### CTA pill

```html
<a style="display:inline-block; background:#0A0A0A; color:#D8EE57; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.4px; text-decoration:none; padding:14px 28px; border-radius:999px;">View report</a>
```
