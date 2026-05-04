---
name: google-ads-account-audit
description: >
  Comprehensive live-API audit of an existing Google Search Ads account. Pulls raw
  data via the Google Ads API, runs N-gram analysis on search terms (1/2/3-word
  by cost + ROAS), audits conversion tracking, RSA pinning, impression-share losses,
  and landing-page message-match. Composes ad-campaign-analyzer and
  ad-to-landing-page-auditor. Output: raw metrics + specific findings + numbered
  immediate-actions list. No composite letter grades. Suggestion-only — user
  prioritizes which findings to act on.
tags: [ads]
---

# Google Ads Account Audit

A diagnostic-grade audit of a live Google Ads account. Pulls real data through the API, finds waste and opportunities through specific analytics (not generic AI summaries), and produces a numbered list of actions for the user to prioritize.

**Core principle:** Don't fabricate composite scores. Real performance marketers don't grade accounts A/B/C — they look at specific metrics and call out specific issues. Every finding ties back to a raw number the user can verify, and a specific action they can take.

**Universal pattern:** Suggestion-only. The audit identifies issues and proposes priorities. The user decides what gets fixed and in what order. Downstream skills (`google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, `google-ads-keyword-optimizer`) act on the priorities.

## When to Use

- "Audit my Google Ads account"
- "What's wrong with my Google Ads?"
- "Where am I wasting Google Ads spend?"
- "Run a full account audit"
- "Diagnose this Google Ads account"

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The audit reads heavily across multiple GAQL queries.
- Optional: a web-fetch tool for the landing-page audit phase.

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Primary conversion goal** — what conversion event is being optimized for (Demos / Trials / Purchases / Leads)
3. **Target CPA / ROAS** — explicit numbers, or LTV × margin to back-calculate, or "no target — benchmark me"
4. **Top competitors** *(optional)* — used for Auction Insights in Phase 6
5. **Geographic markets** *(optional)* — used to scope analysis if geo segmentation matters
6. **Time window** — 180 days default for deep audit; 56 days for tactical

## Phase 1: Confirm Audit Scope

Before pulling any data, confirm scope with the user:

| Parameter | Default | User can override |
|---|---|---|
| Time window | **180 days** (deep audit) — switch to **56 days** for tactical | Yes |
| Campaign scope | All active Search campaigns | Yes — can scope to specific campaigns |
| Include paused campaigns | No | Yes |
| Include experiments / drafts | No | Yes |

### Approval Gate 1

> "I'm about to audit your account over the last 180 days across all active Search campaigns. Want me to adjust the window or scope before I pull data?"

Wait for confirmation. Update parameters if the user redirects.

## Phase 2: Account Snapshot

Run **parallel GAQL queries** for speed. Pull:

1. **Account-level metrics** — total spend, impressions, clicks, conversions, conv value, CTR, conv rate, CPA, ROAS over the audit window
2. **Campaign-level breakdown** — same metrics per active Search campaign
3. **Ad group-level breakdown** — same metrics per ad group within each campaign
4. **Day-by-day spend trend** — 30-day rolling
5. **Account-level settings** — bid strategies in use, daily budgets per campaign, conversion actions configured

Output the account snapshot as a structured table. **Do not fabricate a "health score."** Just show the numbers.

```markdown
## Account Snapshot ({date range})

| Metric | Value |
|---|---|
| Total spend | ${X} |
| Impressions | {N} |
| Clicks | {N} |
| CTR | {X%} |
| Conversions | {N} |
| Conversion rate | {X%} |
| CPA | ${X} |
| Conv value | ${X} |
| ROAS | {X} |

### Campaigns
| Campaign | Spend | Conv | CPA | ROAS | Bid strategy | Status |
|---|---|---|---|---|---|---|
| ... | | | | | | |
```

## Phase 3: Conversion Tracking Audit

Tracking is broken in a large fraction of audits — check this before anything else, since every other finding depends on conversions being measured correctly.

For each configured conversion action:

| Check | Method | Failure mode |
|---|---|---|
| Is the action firing? | Pull conversions over last 7 / 30 days, compare to expected volume | Drops to 0 = pixel broken |
| Are values set? | Check if `value_settings.default_value` and `default_currency_code` are populated | Missing = can't compute ROAS |
| Is it imported into Google Ads bidding? | Check `category` and `include_in_conversions_metric` | Excluded = bid strategies are blind to it |
| Is attribution sane? | Check `attribution_model` (last-click vs data-driven) | Wrong model can mis-allocate credit |
| Counting (one vs every)? | Check `counting_type` | Wrong setting inflates lead-form-style conversions |

Output specific findings:

```markdown
## Tracking Findings

- ✗ Conversion action "Demo booked" has 0 firings in last 7 days (had 24 in prior 30 days). Likely broken — check pixel install on /demo-thank-you page.
- ⚠ Conversion action "Free trial signup" is set to count "Every" — this inflates conversion count. Should be "One" for trials.
- ✓ "Purchase" tracking is firing correctly with values populated.
```

## Phase 4: N-gram Search Terms Analysis

Pull the search terms report for the audit window (filter to terms with material spend, default ≥$5).

Use `scripts/ngram_analyzer.py` (in this skill folder) for tokenization, aggregation, ranking, and anomaly detection. Pure Python, standard library only — no dependencies. The script's `aggregate()`, `rank()`, and `find_anomalies()` functions cover Phase 4 needs.

For each search term, tokenize into:
- 1-word phrases
- 2-word phrases
- 3-word phrases

Aggregate by n-gram: total cost, total clicks, total conversions, total conv value. Compute CPA + ROAS per n-gram.

Produce four ranked tables:

```markdown
### Top spenders — 2-word n-grams
| 2-word phrase | Spend | Conv | CPA | ROAS | Sample terms |
|---|---|---|---|---|---|
| "free trial" | $4,200 | 18 | $233 | 2.1 | "free trial software", "free trial signup", ... |
| ... | | | | | |

### Biggest waste — 2-word n-grams (high spend, 0 or low conv)
| 2-word phrase | Spend | Conv | CPA | Sample terms |
|---|---|---|---|---|
| ... | | | | |

### Top performers — 2-word n-grams (high ROAS at meaningful spend)
| 2-word phrase | Spend | Conv | ROAS | Sample terms |
|---|---|---|---|---|
| ... | | | | |

### Same tables for 3-word n-grams
```

Surface specific anomalies:
- **Seasonal/temporal mismatches** — terms tied to specific dates/seasons running outside window (e.g. "Halloween rave" in March)
- **Competitor brand bleed** — competitor names showing up in spend without a competitor campaign
- **Job-seeker/researcher bleed** — "jobs", "salary", "tutorial", "course", "review" terms

## Phase 5: RSA Pinning + Asset Audit

For each ad group with active RSAs:

| Check | What it surfaces |
|---|---|
| Asset performance ratings | Count of headlines/descriptions marked **Best / Good / Low / Pending** per ad |
| Pinning density | % of headlines pinned to specific positions (excessive pinning kills RSA optimization) |
| Keyword-mirror coverage | Does at least 1 headline + 1 description literally contain the ad group's primary keyword? |
| Length compliance | Any headlines >30 chars or descriptions >90 chars? (shouldn't happen in live ads but verify) |
| RSA strength | Google's reported "Ad strength" rating per RSA |

Output:

```markdown
## RSA Asset Findings

- Ad group "Brand defense" has 12 of 15 headlines marked Low — heavy refresh needed
- 8 ad groups have all headlines pinned to position 1, blocking Google's optimization
- Ad group "Solution-aware" has no headline or description containing the keyword theme — message-match weak
- 3 RSAs flagged as "Poor" Ad strength
```

The deep RSA replacement work happens in `google-ads-rsa-optimizer` — this audit just surfaces *which* ad groups need attention.

## Phase 6: Impression Share + Auction Insights

Pull impression-share metrics per campaign:

| Metric | What it tells us |
|---|---|
| `search_impression_share` | What % of available impressions you're capturing |
| `search_budget_lost_impression_share` | % lost because budget runs out — you'd benefit from more spend here |
| `search_rank_lost_impression_share` | % lost to bid/quality — bid up or improve QS |
| `search_top_impression_share` | % of impressions that were top-of-page |
| `search_absolute_top_impression_share` | % that were position 1 |

Pull **Auction Insights** for each campaign with material spend. This shows competitors in the auction and their relative position.

### Approval Gate 2

Before pulling Auction Insights, confirm the competitor list with the user:

> "Which competitors should I benchmark against in Auction Insights? (You can list domains, brand names, or 'just show me whoever Google reports back.')"

Wait for confirmation.

Output:

```markdown
## Impression Share Findings

- Campaign "Brand" — 100% IS, 98% abs top: brand defense is solid
- Campaign "Solution-aware" — 34% IS, 41% lost to budget, 25% lost to rank: increasing budget here could capture meaningful additional volume
- Campaign "Competitor" — 22% IS, 78% lost to rank: bidding too low or QS too low

## Auction Insights ({date range})
| Competitor | Impression share | Avg position vs you | Above us % | Top of page % |
|---|---|---|---|---|
| ... | | | | |
```

## Phase 7: Landing Page Message-Match Audit

Compose the existing [`ad-to-landing-page-auditor`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/ad-to-landing-page-auditor) skill.

Inputs to pass through:
- Each unique landing page URL in active campaigns
- For each LP, the ads that point to it (headlines + descriptions)

The skill will produce per-LP scores on:
- Promise continuity (does the LP deliver on the ad's promise?)
- Language match (does the LP use the same words/phrases as the ad?)
- CTA alignment
- Specificity match

Surface only the LPs scoring poorly — don't pad the report with fine LPs.

## Phase 8: Synthesize Findings + Immediate Actions

Combine findings from Phases 3–7 into a numbered priority list. **Do not fabricate a letter grade.** Just rank by estimated impact (rough categories: high / medium / low) and let the user pick what to tackle first.

```markdown
## Immediate Actions to Review

### High impact
1. Fix conversion tracking for "Demo booked" (Phase 3) — 0 conversions firing means bid strategies are blind. Recommend: check pixel install on /demo-thank-you, run real-time conv check.
2. Add "free + jobs + careers + tutorial" to negative keyword list (Phase 4) — currently bleeding $1,200/mo on these themes.
3. Increase budget on "Solution-aware" campaign (Phase 6) — 41% IS lost to budget at strong CPA.

### Medium impact
4. RSA refresh on "Brand defense" ad group (Phase 5) — 12 of 15 headlines marked Low. Run google-ads-rsa-optimizer.
5. Fix LP message-match on "competitor-alternative" ads (Phase 7) — sending traffic to homepage, ad promised comparison.

### Low impact
6. ...
```

### Approval Gate 3

Present the immediate-actions list to the user. Ask:

> "Here are the findings, ranked by impact. Which do you want to tackle first? Some can be addressed by other skills in this suite (RSA optimizer, search terms miner, keyword optimizer), others need your input."

Map approved actions to follow-up skills:
- Negative keyword work → `google-ads-search-terms-miner`
- RSA refresh work → `google-ads-rsa-optimizer`
- Keyword performance issues (pauses / bid changes / QS clusters / duplicates) → `google-ads-keyword-optimizer`
- Competitive position concerns (auction loss, angle gaps, LP gaps) → `google-ads-competitor-gap-analysis`
- Tracking fixes → user action with the skill's specific instructions
- Budget reallocation → user action with the skill's rationale
- LP fixes → user action with the audit findings as input

## Phase 9: Output

The skill returns the full audit inline. End with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for future reference)

```
{YYYY-MM-DD} | google-ads-account-audit | Audit completed for window {date range}. Top findings: tracking break on "Demo booked", $1,200/mo bleed on free/jobs/careers/tutorial themes, 41% IS lost to budget on Solution-aware. User prioritized: 1, 2, 3.
```

### Suggested filename for full audit report

`google-ads-audit-{YYYY-MM-DD}.md` — the user can save the inline audit wherever fits their workflow.

## Output Summary

- **Inline:** Full audit report with all phases, snapshot tables, findings, and immediate-actions list
- **Decisions log:** Structured text block at end of report for the user to save
- **Triggers:** Specific follow-up skills the user can invoke based on approved actions

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual export) — for parallel GAQL queries
- **Web-fetch capability** — for LP audits (via the composed skill)
- Composes skill: [`ad-campaign-analyzer`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/ad-campaign-analyzer) for analytic logic
- Composes skill: [`ad-to-landing-page-auditor`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/ad-to-landing-page-auditor) for Phase 7

## Cost

Free. Google Ads API read ops within free quota. Web fetches for LP audit are free.

## Universal Patterns

- **Suggestion-only:** No mutations. The audit produces findings; the user picks priorities.
- **Raw metrics, not letter grades:** Every finding cites specific numbers. No "B+ overall account health" framing.
- **Parallel GAQL:** Pull data in parallel for speed.
- **Anti-laziness:** Pull data first, only ask the user when something can't be derived from the API.
- **Self-healing:** Retry transient API errors with backoff. Don't escalate on first failure.

## Trigger Phrases

- "Audit my Google Ads account"
- "What's wrong with my Google Ads?"
- "Where am I wasting Google Ads spend?"
- "Diagnose this account"
- "Run a full audit"
