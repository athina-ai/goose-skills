---
name: google-ads-competitor-gap-analysis
description: >
  Produce a unified competitive position report for a Google Search ad account.
  Pulls Auction Insights via Google Ads API, scrapes currently-running competitor
  ads via competitor-ad-intelligence, scrapes competitor landing pages, then
  cross-references against the user's own keywords/RSAs/LPs to surface specific
  gaps: auction position diff, outranking share, ad angle gaps, keyword theme
  gaps, LP/offer gaps. Maps each finding to a specific follow-up skill (RSA
  optimizer / search terms miner / manual LP work). Free stack only — no paid
  competitor intel tools. Suggestion-only.
tags: [ads]
---

# Google Ads Competitor Gap Analysis

The unified "where you're lacking vs competitors" view. Pulls competitive context from multiple free sources and synthesizes it into a single report with specific, actionable findings.

**Core principle:** Most competitive intelligence in Search Ads sits scattered across Auction Insights, the Transparency Center, and competitor landing pages. None of these alone is actionable — combined, they reveal specific gaps tied to specific actions. This skill does the synthesis.

**What this skill does NOT do (free-stack honesty):** It does not estimate competitor CTR, conversion rate, or spend. Free data doesn't expose competitor performance metrics. Findings are positional ("you're outranked 47% of the time on `crm software`"), structural ("3 of 5 competitors lead with 'no credit card required', you don't"), and qualitative ("competitor X's LP has 5 trust badges, yours has 0") — not performance-comparative.

**Universal pattern:** Suggestion-only, draft-first. The skill proposes findings + actions; user approves which to act on; approved actions chain to other skills (`google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, `google-ads-keyword-optimizer`). This skill itself doesn't push drafts to the Google Ads UI — it produces a report and queues follow-up skill runs.

## When to Use

- "How am I doing vs competitors?"
- "Where am I lacking vs competitors?"
- "What angles are competitors using that I'm not?"
- "Run a competitive gap analysis"
- "Show me where competitors are winning"

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The skill queries Auction Insights via the Google Ads API.
- The [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence) skill installed (composed in Phase 3).
- A web-fetch capability for competitor landing-page scraping (optional but recommended).

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Top competitors** — names + URLs (ideally 3–5)
3. **Brand voice profile** *(optional)* — short description used for "what angles fit our brand"
4. **Brand-don't list** *(optional)* — words/phrases that should never appear in the user's ad copy
5. **Recent decisions** *(optional)* — paste any prior decisions log entries so the skill avoids re-proposing the same gap-fixes

## Phase 1: Confirm Scope

Before pulling data, confirm with user:

| Parameter | Default | User can override |
|---|---|---|
| Competitor list | List from Phase 0 | Yes — can add/remove |
| Campaigns to analyze | All active Search campaigns | Yes |
| Time window for Auction Insights | Last 30 days | Yes |
| Include LP scraping | Yes | Yes — can skip if competitor LPs are well-known |
| Auction Insights granularity | Per campaign | Yes — can drill to ad group |

### Approval Gate 1

> "I'll analyze competitive position vs these competitors: {list}. Pull Auction Insights from the last 30 days, scrape currently-running ads via the Transparency Center, and audit their landing pages. Want to adjust the competitor list or scope before I pull data?"

Wait for confirmation. Apply overrides.

## Phase 2: Auction Position Pull

Run **parallel GAQL queries** on `auction_insight_view` for each in-scope campaign:

```sql
SELECT
  campaign.name,
  ad_group.name,
  auction_insight_domain.domain,
  metrics.search_impression_share,
  metrics.search_absolute_top_impression_share,
  metrics.search_top_impression_share,
  metrics.search_outranking_share,
  metrics.search_rank_lost_impression_share,
  segments.date
FROM auction_insight_view
WHERE
  segments.date BETWEEN '{start}' AND '{end}'
  AND campaign.status = 'ENABLED'
```

Aggregate per (campaign, competitor_domain). For each competitor:
- Their IS in your auctions
- Their abs top % vs yours
- How often they outrank you (`outranking_share`)
- Trend: improving / stable / declining over the window

Output:

```markdown
## Auction Position vs Competitors

### Campaign: Solution-aware
| Competitor | Their IS | Your IS | Their abs top % | Your abs top % | Outranks you | Trend |
|---|---|---|---|---|---|---|
| acme.com | 42% | 28% | 18% | 12% | 51% | ⬆ improving |
| beta.io | 31% | 28% | 14% | 12% | 44% | ➡ stable |
| ... |

### Campaign: Competitor-alt
[same]
```

Surface specific findings:
- Competitors with growing IS share (entering the auction more aggressively)
- Competitors with high abs top % vs yours (winning premium placements)
- New competitors not in the user-provided list (auto-suggest adding for future analyses)

## Phase 3: Competitor Ad Copy Pull

Compose [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence). Pass:
- Competitor names + URLs from Phase 1
- Channel: Google Ads (Transparency Center) — Meta Ad Library is auxiliary
- Time window: currently-running ads

The skill returns currently-running competitor ads with:
- Headline / description text
- Sitelinks / callouts they use
- Ad variants per competitor

## Phase 4: Angle / Hook Categorization

For each competitor, categorize their ads against the headline pattern library:

| Pattern | Examples (from competitor ads) | Competitors using |
|---|---|---|
| Urgency / scarcity | "Q2 dates booking fast", "Limited spots" | acme.com, beta.io |
| Numeric proof | "500+ teams", "Trusted by Fortune 500" | acme.com, gamma.co |
| Friction-remover | "No credit card required", "Free 14-day trial" | beta.io, gamma.co, delta.io |
| Differentiation | "Built for B2B SaaS, not generic" | acme.com |
| Trust signal | "SOC2 Compliant", "GDPR Ready" | gamma.co, delta.io |

For each pattern, note:
- **Competitors using it** (count + names)
- **User using it?** (cross-reference active RSAs in their account)

Then surface gaps:

```markdown
## Angle Gaps

**Angles 3+ competitors use that you don't:**
1. **Friction-remover (no credit card / free trial)** — used by acme.com, beta.io, gamma.co, delta.io. You don't reference this in any active RSA.
   → Suggested: chain to `google-ads-rsa-optimizer` to test friction-remover variants.

2. **SOC2 / Compliance trust signal** — used by gamma.co, delta.io. You have SOC2 compliance per Phase 0 intake but don't surface in ads.
   → Suggested: chain to `google-ads-rsa-optimizer` to add trust-signal variants.

**Angles you use that competitors don't (your differentiation):**
- "AI-native" framing — only you. Keep using this.
- Specific integration call-outs — only you. Keep using this.
```

## Phase 5: Keyword Theme Gap Analysis

Cross-reference the language in competitor ads against the user's active keyword themes (pulled fresh from the Google Ads API).

Identify keyword themes that:
- **Competitors clearly target** (multiple competitors run ads for it) AND
- **You don't target** (no active keyword in your account contains the theme)

```markdown
## Keyword Theme Gaps

| Theme competitors target | Competitors using it | You target? | Action |
|---|---|---|---|
| "automation" | acme.com, beta.io, gamma.co | No | Chain to `google-ads-search-terms-miner` Phase 6 to evaluate adding |
| "for sales teams" | acme.com, gamma.co | Partially (only "Solution-aware" ad group) | Chain to `google-ads-search-terms-miner` to evaluate expansion across more ad groups |
```

Don't propose blind keyword expansion — the search-terms-miner skill validates volume + intent before adding. This skill just surfaces the theme.

## Phase 6: Landing Page Comparison

For each competitor, fetch their primary LP via whatever web-fetch tool the agent has available. Compare to user's LPs (referenced in active campaigns).

Score competitor LPs on:
- Hero headline pattern
- Trust signals (logos, badges, customer counts, security/compliance)
- Social proof (testimonials, reviews, ratings)
- CTA (text + position)
- Offer (free trial / demo / pricing transparency)
- Risk reversal (no CC, money back, etc.)

Compare side-by-side with user's LPs:

```markdown
## Landing Page Gaps

**Trust signals present on most competitor LPs, missing from yours:**
- Customer logos: 4 of 5 competitors show logo strip above fold. Your /pricing has none.
- Security badges: 3 of 5 competitors show SOC2 / GDPR badges. You don't.
- Customer count: 4 of 5 competitors prominently show "X+ teams trust us". You don't.

**CTAs:**
- Competitors all use "Start free trial" or "Book a demo". You use "Get started" — vaguer.

**Risk reversal:**
- 4 of 5 competitors say "No credit card required" above the fold. You don't.

→ Suggested: manual LP improvements with this gap list as input. Re-run `google-ads-account-audit` Phase 7 (LP audit) after fixes.
```

## Phase 7: Synthesize Action Plan

Combine findings from Phases 2–6 into a numbered action plan, ranked by estimated impact and tied to specific follow-up skills.

```markdown
## Competitive Action Plan

### High impact
1. **Add friction-remover angle to RSAs** — 4 of 5 competitors use it; you don't. Chain to `google-ads-rsa-optimizer` for Solution-aware + Brand-defense ad groups.
2. **Surface SOC2 compliance in trust-signal headlines** — your intake says you're SOC2 but ads don't mention it. Chain to `google-ads-rsa-optimizer`.
3. **Investigate "automation" keyword theme** — 3 competitors target, you don't. Chain to `google-ads-search-terms-miner` Phase 6 for keyword evaluation.

### Medium impact
4. **Auction position decline on Solution-aware** — acme.com's IS up 12pp in 30 days. Investigate if they raised bids. Chain to `google-ads-keyword-optimizer` for bid review.
5. **Add customer logo strip to /pricing** — 4 of 5 competitors do this. User action.
6. **Add "no credit card required" to /pricing above fold** — competitor pattern. User action.

### Watch list
7. New competitor `delta.io` appeared in Auction Insights with 18% IS — wasn't in the input list. Add to monitoring.
```

### Approval Gate 2

Present the action plan to the user. Ask:

> "Here's the competitive gap analysis. Which actions do you want to act on? Some chain to other skills in this Google Ads suite (RSA optimizer, search terms miner, keyword optimizer); LP fixes need to be done manually with these findings as input."

Map approved actions:
- RSA changes → queue `google-ads-rsa-optimizer` run
- Keyword theme expansion → queue `google-ads-search-terms-miner` run
- Bid investigation → queue `google-ads-keyword-optimizer` run
- LP changes → manual user action with findings as input
- New competitor → propose adding to user's competitor list for future analyses

## Phase 8: Output

The skill returns the full gap-analysis report inline, ending with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for future reference)

```
{YYYY-MM-DD} | google-ads-competitor-gap-analysis | Identified 3 high-impact gaps (friction-remover angle, SOC2 trust signal, "automation" theme) + 3 medium-impact (auction decline, LP logos, LP risk reversal). User approved chaining to RSA optimizer + search-terms-miner. New competitor delta.io added to competitor list.
```

### Learnings to capture

```
{YYYY-MM-DD} — Competitor angle pattern: friction-remover ("no CC required") is used by 4 of 5 competitors. Likely category convention. Test in next RSA round.
```

### Suggested filename for the gap analysis report

`google-ads-competitor-gap-{YYYY-MM-DD}.md` — the user can save the inline report wherever fits their workflow.

If a new competitor was discovered, propose to the user:

> "delta.io appeared in Auction Insights with 18% IS — they weren't in your input list. Recommend adding them to your competitor list for future analyses."

## Output Summary

- **Inline:** Full gap analysis report with auction position, angle gaps, keyword theme gaps, LP gaps, and action plan
- **Decisions log + Learnings:** Structured text blocks at end of report for the user to save
- **Optional follow-up triggers:** Specific skills the user approved to run next

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual export) — Auction Insights via `auction_insight_view` GAQL
- **Web-fetch capability** — competitor LP scraping (any agent web-fetch tool)
- Composes skill: [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence) for currently-running competitor ad copy

## Cost

Free.

## Universal Patterns

- **Suggestion-only:** No mutations. Findings + proposed actions. User picks what runs.
- **Free-stack honesty:** No fabricated performance benchmarks. We surface what we can measure (positional, structural, qualitative gaps), not what we can't (competitor CTR, CVR, spend).
- **Cross-skill chaining:** Gaps map to specific follow-up skills with phase-level precision (e.g. "chain to `google-ads-search-terms-miner` Phase 6").
- **No composite letter grades:** Each finding cites specific data — IS percentages, competitor counts, named competitors.
- **Anti-laziness:** Pull all data first; only ask the user when something can't be derived from the API or competitor scraping.
- **Self-healing:** Retry transient API errors with backoff. Note in learnings if competitor scraping fails for a specific domain.
- **Findings drive prioritization, not noise:** Don't pad with every tiny gap. Threshold for inclusion: ≥3 competitors using a pattern OR ≥10 percentage points IS difference OR clear directional trend.

## What's Out of Scope

- **Estimated competitor CTR / CVR per keyword** — requires paid competitive-intelligence tools (e.g. AdGooroo). This skill stays free-only.
- **Real-time competitor change alerts** (new keywords added, bid strategy shifts) — requires paid monitoring tools (e.g. Adthena Smart Monitor).
- **Historical ad copy archive beyond what's currently running** — requires paid tools (e.g. SpyFu).

If you need these capabilities, this skill won't deliver them — that's a different (paid) tool category.

## Trigger Phrases

- "How am I doing vs competitors?"
- "Where am I lacking vs competitors?"
- "What angles are competitors using that I'm not?"
- "Run a competitive gap analysis"
- "Show me where competitors are winning"
- "Competitive analysis"
- "Competitor benchmark"
