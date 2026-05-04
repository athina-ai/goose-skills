---
name: google-ads-rsa-optimizer
description: >
  Find weak RSA assets (headlines + descriptions) in a live Google Ads account
  and propose replacements grounded in brand voice, ad group keyword theme,
  landing page copy, and competitor ad angles. Composes competitor-ad-intelligence
  for category-specific creative direction. Generates 3 candidate variants per
  weak slot, validates length (30/90) + keyword-mirror rule + brand-don't list,
  presents per-asset approvals to user, saves approved variants as drafts in the
  Google Ads UI for the user to manually review and activate. No live mutations.
tags: [ads]
---

# Google Ads RSA Optimizer

Find every weak RSA asset in a live Google Ads account and propose replacements grounded in the user's brand voice, the ad group's keyword theme, landing page copy, and what competitors are doing. Outputs drafts in the Google Ads UI — the user reviews and activates manually.

**Core principle:** Most ad accounts have RSA assets running on autopilot for months — half rated **Low** by Google, never refreshed. Replacing them is the single highest-leverage creative optimization in Search ads. AI is genuinely good at this if you give it the right context (brand voice, ad group theme, LP, competitor angles) and validate hard (30/90 chars, keyword-mirror, brand-don't list).

**Universal pattern:** Suggestion-only, draft-first. Every replacement is approved per-asset by the user. Approved variants are saved as drafts in Google Ads — the skill never activates them.

## When to Use

- "Optimize my RSAs"
- "Refresh my Google Ads headlines"
- "Find and replace weak ad assets"
- "Improve my Google Ads creative"
- "Run RSA optimizer on [campaign]"

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The skill reads RSAs and asset performance ratings.
- Optional: a recent run of [`google-ads-account-audit`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/google-ads-account-audit) — it identifies which ad groups have weak assets so this skill can focus on them.

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Brand voice profile** — short description (e.g. "technical, plain-language, no superlatives, never use 'best-in-class'")
3. **Brand-don't list** — words / phrases that should never appear in the user's ad copy (off-brand vocabulary, regulated terms, banned superlatives)
4. **Top competitors** *(optional)* — used to inform Phase 5 angle scan
5. **Primary conversion goal** — what conversion event is being optimized for (Demos / Trials / Purchases / Leads)
6. **Recent decisions** *(optional)* — paste any prior decisions log entries so the skill avoids re-proposing the same variants

## Phase 1: Confirm Scope

| Parameter | Default | User can override |
|---|---|---|
| Asset performance bar | **Low + Pending (≥14 days impressions)** | Yes — can include Good for refresh |
| Ad groups to optimize | Top 3 ad groups by spend with weak assets | Yes — can pick specific ad groups, or "all" |
| Candidates per weak slot | **3** | Yes |
| Time window for performance ratings | Last 30 days | Yes |

### Approval Gate 1

> "I'll find weak RSA assets (Low + Pending) in your top 3 ad groups by spend, generate 3 replacement candidates for each weak slot, and present them for your approval. Want me to adjust scope?"

Wait for confirmation. Apply overrides.

## Phase 2: Pull RSAs + Asset Performance

Run via the Google Ads API, in parallel:

1. All active RSAs in scope, with their headlines + descriptions
2. Asset performance ratings (**Best / Good / Low / Pending**) per individual headline + description
3. Days each asset has been running
4. Pinning configuration per asset
5. Ad group context: name, primary keyword theme, landing page URL
6. Recent ad group performance (impressions, clicks, conv) for context

For each ad group in scope, build:

```markdown
### Ad group: {name}
- Primary keyword theme: {theme}
- Landing page: {URL}
- Spend (last 30d): ${X}
- Active RSAs: {N}

| RSA | Asset | Type | Text | Rating | Days running | Pinned? |
|---|---|---|---|---|---|---|
| RSA-1 | H1 | Headline | "AI Outbound Tool" | Low | 47 | No |
| RSA-1 | H2 | Headline | "10x Your Pipeline" | Best | 47 | No |
| ... | | | | | | |
```

## Phase 3: Identify Weak Assets

Filter to weak assets per the configured threshold.

**Pending exclusion rule:** Pending assets only count as weak if they have **≥14 days of impressions** — under that, they're still in Google's learning phase and the rating isn't reliable yet.

Output the weak-asset queue per ad group:

```markdown
### Ad group: {name} — weak assets to replace
| Asset | Type | Current text | Rating | Why flagged |
|---|---|---|---|---|
| H1 | Headline | "AI Outbound Tool" | Low | Marked Low for 47 days |
| H4 | Headline | "Save Time Today" | Pending | 21 days impressions, no signal |
| D2 | Description | "Boost your sales..." | Low | Marked Low for 47 days |
```

If an ad group has zero weak assets, skip it. If all 3 in-scope ad groups have zero weak assets, surface to user and stop.

## Phase 4: Pull Landing Page Copy

For each unique LP referenced by weak-asset ad groups, fetch with whatever web-fetch tool the agent has available. Extract:
- Hero headline + subheadline
- Primary CTA
- 3-5 key benefit bullets / value props
- Any trust signals (logos, testimonials, metrics)

This LP copy becomes input to the generator — replacement headlines need to message-match what the user lands on.

## Phase 5: Pull Competitor Ad Angles

Compose [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence) on the top competitors from Phase 0 intake. Pull from Google Ads Transparency Center and Meta Ad Library.

Synthesize: what creative angles are competitors using that we're not?

```markdown
### Competitor angle scan

**Common across competitors:**
- "14-day free trial" framing (3 of 5 competitors)
- Compliance/SOC2 trust signals (4 of 5 competitors)
- Founder-led testimonials (3 of 5 competitors)

**Angles competitors use that you don't:**
1. Risk reversal — "no credit card required" (4 competitors)
2. Speed — "set up in 5 minutes" (3 competitors)
3. Specificity — "for B2B SaaS sales teams" rather than generic (5 competitors)

**Angles you use that competitors don't:**
- "AI-native" framing (only you)
- Specific integration call-outs (only you)
```

### Approval Gate 2

Show the user the competitor angle scan and ask:

> "Here are angles competitors are using that you're not. Which of these would you want me to incorporate into the replacement variants? Pick any combination, or none."

User picks angles to use. These become explicit prompt inputs to the variant generator. If the user says "none," generator runs without competitor input.

## Phase 6: Generate Replacement Variants

For each weak asset, generate **3 candidate replacements**.

### Generator inputs

| Input | Source |
|---|---|
| Weak asset being replaced (text + rating) | Phase 3 |
| Asset type (headline / description / sitelink / callout) | Phase 3 |
| Ad group's primary keyword theme | Phase 2 |
| Landing page key copy (hero, CTA, benefits) | Phase 4 |
| Brand voice profile + tone descriptors | Phase 0 intake |
| Brand-don't list | Phase 0 intake |
| Approved competitor angles | Phase 5 |
| Headline pattern library (rotated) | See `ads-copywriting-principles.md` in this skill folder |

### Headline pattern library

Rotate through these patterns to avoid generating 3 same-feeling candidates. Each candidate uses a different pattern (see `ads-copywriting-principles.md` for the full reference):

| Pattern | Example |
|---|---|
| **Urgency** | "2026 Dates Booking Fast" |
| **Scarcity** | "Limited Spots — 14-Day Free Trial" |
| **Differentiation** | "Built for B2B SaaS, Not Generic" |
| **Friction-remover** | "No Credit Card Required" |
| **Numeric proof** | "Trusted by 500+ Sales Teams" |
| **Date / seasonality** | "Q2 2026 Setup in 5 Minutes" |
| **Star reviews** | "4.8★ on G2 — Read Reviews" |
| **Trust signal** | "SOC2 Compliant — Enterprise-Ready" |

For descriptions, expand to longer-form versions of the same patterns plus pain-agitate, feature-benefit, social-proof-CTA, differentiator-CTA structures.

### Generator output

For each weak slot, produce 3 candidates:

```markdown
**Replacing: H1 "AI Outbound Tool" (Low rating, 47 days)**

Candidate A (Differentiation):
"AI SDR for B2B SaaS"
— 19 chars. Mirrors keyword theme. Differentiation pattern.

Candidate B (Numeric proof):
"500+ Teams Pick [Brand]"
— 23 chars. Trust signal. Brand insertion.

Candidate C (Friction-remover):
"Free 14-Day Trial — No CC"
— 26 chars. Risk reversal. Competitor angle.
```

## Phase 7: Hard Validation (Reject Before User Sees)

Before presenting candidates, validate:

| Check | Action if fails |
|---|---|
| Headline ≤30 chars | Regenerate that candidate |
| Description ≤90 chars | Regenerate that candidate |
| Keyword-mirror rule per ad group: at least 1 headline + 1 description across the **full RSA after replacements** literally contains the ad group's primary keyword | Force keyword inclusion in next generation pass |
| No words from brand-don't list | Regenerate, surface why to user in trace |
| No duplicate text across candidates for the same slot | Regenerate the duplicate |
| No identical text to existing strong assets in the same RSA | Regenerate (we want diversity, not repetition) |

If a slot fails validation 3 times, surface to user: "I couldn't generate 3 valid candidates for {slot}. Want me to relax {constraint}?"

## Phase 8: Per-Asset User Approval

Present candidates to the user, one ad group at a time, one weak slot at a time:

```markdown
### Ad group: {name}

#### Replacing H1 "AI Outbound Tool" (Low, 47 days)

**A. AI SDR for B2B SaaS** (19 chars, differentiation)
**B. 500+ Teams Pick {Brand}** (23 chars, numeric proof)
**C. Free 14-Day Trial — No CC** (26 chars, friction-remover)

Pick: A / B / C / edit / skip / write your own
```

For each weak slot, the user can:
- **A/B/C** — accept that candidate
- **edit** — accept a candidate but tweak the text
- **skip** — leave the existing weak asset in place
- **write your own** — replace with custom text

Track all approvals + edits + skips per ad group.

### Approval Gate 3 (final summary before saving drafts)

After the user has worked through all weak slots in scope:

```markdown
### Final replacement summary

**Ad group: {name}**
- H1: "AI Outbound Tool" → "AI SDR for B2B SaaS" ✓
- H4: "Save Time Today" → SKIPPED
- D2: "Boost your sales..." → "Built for B2B SaaS sales teams. Set up in 5 minutes — no credit card required." ✓ (edited)

[2 more ad groups...]

Total: 8 replacements approved across 3 ad groups.
```

Ask:

> "Ready to save these as drafts in your Google Ads account? You'll review them in the Google Ads UI and activate manually. I won't activate anything."

Wait for explicit confirmation.

## Phase 9: Save as Drafts

Push approved replacements to Google Ads as **drafts** via the Google Ads API:

- Create new RSA draft variants in each ad group with the replacement assets
- Original RSA stays running unchanged
- New draft is **not active** until the user activates it from the Google Ads UI

If draft creation isn't available via the connected API, output a **copy-paste-ready document** the user can apply manually in the Google Ads UI. Suggested filename: `google-ads-rsa-changes-{YYYY-MM-DD}.md`.

## Phase 10: Output

The skill returns the analysis inline, ending with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for future reference)

```
{YYYY-MM-DD} | google-ads-rsa-optimizer | Replaced 8 weak assets across 3 ad groups | Patterns used: differentiation, numeric proof, friction-remover. Competitor angles incorporated: 14-day trial, no CC.
```

### Learnings to capture

- Which patterns the user picked most often (signal for next run)
- Which candidates the user edited (we missed something — log what was added/removed)
- Which slots the user skipped (asset wasn't actually weak, or generation didn't fit)

These notes can be passed back into this skill (or `google-ads-checkin`) on the next run to inform future proposals.

## Output Summary

- **Inline:** Full analysis report with weak-asset queue, candidates, approvals, and final summary
- **In Google Ads:** Drafts for each approved replacement (or fallback markdown if drafts API unavailable)
- **Decisions log + Learnings:** Structured text blocks at end of report for the user to save

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual data export) — read RSAs, asset performance, ad group context, draft creation
- **Web-fetch capability** — for landing page copy (any agent web-fetch tool)
- Composes skill: [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence)
- Headline pattern library + ad copywriting principles in `ads-copywriting-principles.md` (in this skill folder)

## Cost

Free. Google Ads API + Meta Ad Library + Google Ads Transparency Center are all free at this scale.

## Universal Patterns

- **Suggestion-only:** Per-asset approval gate. The skill never auto-applies a variant.
- **Draft-first:** Approved variants are saved as drafts in Google Ads UI. User activates manually.
- **Hard validation:** 30/90 char + keyword-mirror + brand-don't list checks happen before user sees candidates.
- **Anti-laziness:** LP copy and competitor angles are pulled from API/web before asking the user — only confirmation gates are on outputs, never on inputs the agent could derive.
- **Self-healing:** If draft API call fails, output markdown fallback and surface the error.
- **Pattern rotation:** Generator rotates through 8+ headline patterns to avoid 3 same-feeling candidates per slot.

## Trigger Phrases

- "Optimize my RSAs"
- "Refresh my Google Ads headlines"
- "Replace weak ad assets"
- "Improve my Google Ads creative"
- "Run RSA optimizer"
