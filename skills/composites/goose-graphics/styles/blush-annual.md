# Blush Annual

Calm, premium editorial annual-report aesthetic. A blush pink canvas hosts overlapping rounded tiles in dusty pastels — sage, mint, peach, cream — anchored by oversized black serif money/percent numerals paired with tiny justified sans body copy. Reads like a luxury fashion-house investor letter or a carefully designed annual review.

## Palette

| Hex | Role |
|-----|------|
| `#F4D0D5` | Blush pink — primary canvas |
| `#E8B7BF` | Deeper pink — tinted tile |
| `#C9D6B5` | Sage green — tinted tile |
| `#B7D4C2` | Mint — tinted tile |
| `#EFE3D2` | Cream — tinted tile |
| `#1A1A1A` | Ink — primary type |
| `rgba(26,26,26,0.65)` | Ink 65 — secondary body |
| `rgba(26,26,26,0.45)` | Ink 45 — tertiary captions |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Fraunces', Georgia, 'Times New Roman', serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Hero Stat | Fraunces | 180px | 500 | 0.90 | -4px |
| Sub Stat | Fraunces | 96px | 500 | 0.95 | -2px |
| Display Title | Fraunces | 56px | 500 | 1.05 | -1px |
| Tile Heading | Inter | 14px | 700 | 1.20 | 1px UPPER |
| Body | Inter | 12px | 400 | 1.55 | 0 |
| Caption | Inter | 10px | 600 | 1.30 | 1px UPPER |
| Brand | Fraunces | 24px | 700 | 1.00 | -0.5px |

**Principles**

- The serif numeral is the protagonist — at 120-200px it occupies most of its tile.
- Body copy is small (10-13px), set in Inter, often justified, sitting under or beside the stat.
- Pastel tiles overlap subtly — no hard borders, no shadows. Adjacent tiles can touch or overlap by 8-16px.
- Type stays black on every pastel — high contrast keeps the calm feel from going soft.

## Layout

- Format padding: carousel 80px · infographic 80/100 · slides 100px · poster 80/100 · story 80px · chart 80px · tweet 56px.
- Canvas is always blush `#F4D0D5` — even when most of the surface ends up covered by overlapping tiles.
- Tiles use `border-radius: 12px` (subtler than pillow-block — this is editorial, not friendly-app).
- Stats are anchored to the bottom-right of their tile; eyebrow labels sit top-left; body sits in the remaining inner column.
- Multiple stats on one canvas should overlap edges by 8-16px to read as one composition, not separate cards.
- Brand sits in the smallest tile or as a quiet line on the canvas margin.

## Do / Don't

**Do**

- Use Fraunces (or Playfair Display) for every numeral and headline.
- Make money/percent numerals huge (120-200px) — they are the entire visual hierarchy.
- Overlap tiles slightly so the composition feels like a single arranged page.
- Keep body copy small (10-13px) and quiet — let the stat carry the meaning.
- Use eyebrow labels in tracked uppercase Inter — never in serif.

**Don't**

- Don't use bright or saturated colors — this style lives in dusty pastel range only.
- Don't apply shadows, gradients, or borders to tiles.
- Don't introduce a third typeface — Fraunces + Inter is the entire system.
- Don't right-align or center body copy — left-align (or justify) only.
- Don't use a non-pink canvas — blush is the unifying ground.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #F4D0D5;
  --color-pink-deep: #E8B7BF;
  --color-sage: #C9D6B5;
  --color-mint: #B7D4C2;
  --color-cream: #EFE3D2;
  --color-ink: #1A1A1A;
  --color-ink-muted: rgba(26,26,26,0.65);
  --color-ink-quiet: rgba(26,26,26,0.45);

  --tile-radius: 12px;
  --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Pastel stat tile

```html
<div style="background:#C9D6B5; border-radius:12px; padding:32px; min-height:280px; display:flex; flex-direction:column; justify-content:space-between;">
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#1A1A1A; margin:0;">Annual revenue</p>
  <p style="font-family:'Fraunces',serif; font-size:140px; font-weight:500; line-height:0.90; letter-spacing:-4px; color:#1A1A1A; margin:0;">$5M</p>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:400; line-height:1.55; color:rgba(26,26,26,0.65); max-width:180px; margin:0;">Tracked achieved $5M in annual recurring revenue in two years.</p>
</div>
```

### CTA link (editorial)

```html
<a style="display:inline-block; font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#1A1A1A; text-decoration:none; padding:14px 0; border-bottom:2px solid #1A1A1A;">Read the report &rarr;</a>
```
