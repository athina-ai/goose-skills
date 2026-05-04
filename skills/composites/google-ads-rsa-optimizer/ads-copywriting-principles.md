# Ads Copywriting Principles

Reference guide for the Google Ads skills that generate or audit ad copy (`google-ads-rsa-optimizer`, `google-ads-account-audit`). Synthesized from common patterns shared by experienced Google Ads practitioners. Re-read this before drafting any RSA variant.

## Hard rules (validators reject before user sees output)

| Rule | Constraint |
|---|---|
| Headline length | ≤30 characters |
| Description length | ≤90 characters |
| Sitelink length | ≤25 characters per text portion |
| Callout length | ≤25 characters |
| Keyword-mirror rule | At least 1 headline + 1 description per RSA must literally contain the ad group's primary keyword theme |
| Brand-don't list | No words from the brand-don't list provided at intake |
| No duplicate text | No two candidates for the same slot can be identical |
| No identical to existing strong assets | New variants must differ from current Best/Good assets in the same RSA |

If a candidate fails validation, regenerate before showing the user. After 3 failed regenerations, surface the failure and ask the user to relax a constraint.

## Headline pattern library (8 patterns)

Generators rotate through these to avoid producing 3 same-feeling candidates. Each candidate for a slot uses a different pattern.

| Pattern | When to use | Example |
|---|---|---|
| **Urgency** | Time-bound offers, deadline framing | "2026 Dates Booking Fast" |
| **Scarcity** | Limited availability | "Limited Spots — 14-Day Trial" |
| **Differentiation** | When clearly different from category norm | "Built for B2B SaaS, Not Generic" |
| **Friction-remover** | Risk reversal, removing buying objections | "No Credit Card Required" |
| **Numeric proof** | Specific scale, customer count, revenue moved | "Trusted by 500+ Sales Teams" |
| **Date / seasonality** | Time-bound relevance | "Q2 2026 Setup in 5 Minutes" |
| **Star reviews** | Established review presence | "4.8★ on G2 — Read Reviews" |
| **Trust signal** | Compliance, certification, enterprise readiness | "SOC2 Compliant — Enterprise-Ready" |

## Description patterns (4 patterns)

Each RSA needs 4 descriptions. Use one of each pattern.

| Pattern | Structure | Example |
|---|---|---|
| **Feature-benefit** | What it does + why it matters | "Automate personalized outbound so your team closes more deals without manual prospecting work." |
| **Pain-agitate-solution** | Frame the pain, then the resolution | "Tired of reps spending 4 hours on prospecting? Our AI handles it in minutes." |
| **Social-proof + CTA** | Numeric proof + action | "Join 500+ growth teams. Start your free trial — no credit card needed." |
| **Differentiator + CTA** | What makes you different + action | "Unlike legacy tools, [Brand] works out of the box. See it in action — book a 15-min demo." |

## RSA structural rules

- Default ad group structure: **single-keyword ad groups (SKAG)** for AI-generated campaigns
- Default match type: **exact** for AI-generated SKAGs (tightest control over what triggers the ad)
- Per ad group, **3 RSAs max** — diverse enough for Google to optimize, tight enough to monitor
- Per RSA: **15 headlines × 4 descriptions × 4+ sitelinks × 4+ callouts**
- **Avoid heavy pinning** — pinning blocks Google's optimization. Only pin when there's a compliance reason (e.g. legal disclaimer must be in H1).

## Anti-patterns (don't do these)

- ❌ Generic claims with no specificity ("Best in class", "Industry-leading", "Cutting-edge")
- ❌ Same hook reused across all 15 headlines (rotate patterns)
- ❌ Length over 30/90 chars — Google truncates and rejects, never trust the LLM
- ❌ Promising outcomes the LP doesn't deliver on (message-match break)
- ❌ Branded competitor mentions without legal sign-off
- ❌ Using superlatives ("#1", "Best", "Top") without specific evidence
- ❌ Composite letter grades on output ("A+ ad copy") — meaningless and erodes user trust

## Brand voice integration

Every generation pass takes the brand voice profile provided at intake as input:

- **Tone descriptors** — formal / conversational / technical / playful
- **Vocabulary level** — technical jargon ok / plain language only
- **Sentence structure** — short and punchy / nuanced and qualified
- **CTA patterns** — what types of CTAs the brand actually uses ("Book a demo" vs "Get started" vs "Try it free")
- **Phrases that fit** — list of phrases known to work for this brand
- **Phrases that don't fit** — phrases that violate brand voice

Generators must produce candidates that respect these dimensions. If you can't find a way to honor brand voice within a chosen pattern, drop the pattern, don't break voice.

## Validation order

When generating a candidate:

1. Generate text using one specific pattern + brand voice
2. Run hard validators (length, brand-don't list, duplicates)
3. If fail, regenerate (max 3 attempts per slot)
4. If pass, add to candidate set
5. After 3 valid candidates, present to user

Never bypass validators to ship a candidate. If you can't get 3 valid candidates, surface the constraint that's blocking and ask the user to relax it.
