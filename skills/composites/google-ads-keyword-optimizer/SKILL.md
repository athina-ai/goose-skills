---
name: google-ads-keyword-optimizer
description: >
  Analyze the keywords currently bidding in a live Google Ads account and propose
  per-keyword optimizations — pause underperformers, bid up / bid down, change
  match type, deduplicate cannibalizing keywords, improve Quality Score clusters.
  Pulls per-keyword performance + Quality Score components via Google Ads API,
  validates expansions against Keyword Planner. Per-item user approval; approved
  actions saved as drafts in Google Ads UI. Pure free stack — no paid tools.
tags: [ads]
---

# Google Ads Keyword Optimizer

Analyze the keywords currently running in a live Google Ads account and propose specific optimizations: pause / bid up / bid down / match-type change / dedupe / Quality Score remediation. Complements [`google-ads-search-terms-miner`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/google-ads-search-terms-miner) — that skill is *reactive* (mines what users searched), this skill is *proactive* (optimizes the keywords the user is currently bidding on).

**Core principle:** Per-keyword performance + Quality Score data + IS metrics are rich enough to make smart optimization proposals without third-party tools. The user's own data is the right source.

**Universal pattern:** Suggestion-only, draft-first. Per-item approval. Approved actions saved as drafts in Google Ads UI; user activates manually.

## When to Use

- "Optimize my Google Ads keywords"
- "Which keywords should I pause?"
- "Are my bids right?"
- "Find my keyword duplicates"
- "Improve my Quality Scores"
- "Run keyword optimizer"

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The skill uses Google Ads API queries throughout.
- Optional but recommended: a recent run of [`google-ads-account-audit`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/google-ads-account-audit) — it identifies which campaigns / ad groups have keyword issues so this skill can focus on them.

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Primary conversion goal** — what conversion event is being optimized for (Demos / Trials / Purchases / Leads)
3. **Target CPA** — explicit, or "back-calculate from LTV × margin", or "no target — benchmark me"
4. **Target ROAS** — if applicable
5. **Recent decisions** *(optional)* — paste any prior decisions log entries so the skill avoids re-proposing actions on keywords already paused / bid-changed in the last 14 days (let prior changes mature)
6. **Scope** — all active Search campaigns by default; user can override to specific campaigns
7. **Time window** — 30 days default (tactical); 90 days for strategic review

## Phase 1: Confirm Scope

| Parameter | Default | User can override |
|---|---|---|
| Time window | **30 days** | Yes |
| Campaign scope | All active Search campaigns | Yes — can scope to specific campaigns |
| Keyword status | Active only (skip paused/removed) | Yes |
| Pause threshold | High spend + 0 conv after **14+ days**, OR CPA > 2× target consistently | Yes |
| Bid-up trigger | Below target CPA + IS lost to rank > 25% | Yes |
| Bid-down trigger | CPA > 1.5× target consistently with adequate volume | Yes |

### Approval Gate 1

> "I'll analyze active keywords across all Search campaigns over the last 30 days. Surface underperformers, QS issues, match-type optimization opportunities, and duplicates. Want to adjust scope before I pull data?"

Wait for confirmation. Apply overrides.

## Phase 2: Pull Per-Keyword Data

Run **parallel GAQL queries** via the Google Ads API:

1. Active keywords across in-scope campaigns with metrics
2. Quality Score per keyword + components (Landing page experience, Expected CTR, Ad relevance)
3. Per-keyword IS metrics (search_impression_share, search_rank_lost_impression_share)
4. First-page CPC + top-of-page CPC bid estimates per keyword
5. Days since each keyword was added (for "give it time" check)

Example GAQL:

```sql
SELECT
  ad_group.name,
  campaign.name,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.quality_info.quality_score,
  ad_group_criterion.quality_info.creative_quality_score,
  ad_group_criterion.quality_info.post_click_quality_score,
  ad_group_criterion.quality_info.search_predicted_ctr,
  ad_group_criterion.cpc_bid_micros,
  ad_group_criterion.position_estimates.first_page_cpc_micros,
  ad_group_criterion.position_estimates.top_of_page_cpc_micros,
  metrics.clicks,
  metrics.impressions,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.search_impression_share,
  metrics.search_rank_lost_impression_share,
  segments.date
FROM keyword_view
WHERE
  ad_group_criterion.status = 'ENABLED'
  AND campaign.status = 'ENABLED'
  AND segments.date BETWEEN '{start}' AND '{end}'
```

## Phase 3: Classify Keywords (Bucket by Action)

For each keyword, classify into one bucket:

| Bucket | Trigger | Action |
|---|---|---|
| 🔴 **Pause candidate** | High spend + 0 conv after 14+ days, OR CPA consistently > 2× target | Propose pause |
| 🟠 **Bid down** | CPA between 1.5× and 2× target with adequate conv volume | Propose lower bid |
| 🟢 **Bid up** | CPA at or below target + IS lost to rank > 25% | Propose raise bid |
| 🚫 **Bid floor** | Top-of-page CPC required exceeds your bid by >50%, AND you're not winning | Note: realistically can't compete here at current budget |
| ⏸ **Hold** | Performing at target — no change | Skip |

Surface specific findings, not generic guidance:

```markdown
### 🔴 Pause candidates
| Keyword | Match | Spend | Conv | CPA | Days | QS | Reason |
|---|---|---|---|---|---|---|---|
| "enterprise crm software" | Phrase | $487 | 0 | — | 30 | 6 | 0 conv after 30 days at 4× expected click volume |
| "best b2b saas tools" | Broad | $312 | 0 | — | 21 | 4 | High spend, 0 conv, low QS suggests poor relevance |

### 🟢 Bid up
| Keyword | Match | Spend | Conv | CPA | IS lost rank | Action |
|---|---|---|---|---|---|---|
| "ai sdr" | Exact | $210 | 6 | $35 | 47% | Bid up from $4.50 → $7.00 to capture more impressions |
```

## Phase 4: Quality Score Analysis

Group keywords by QS:

| QS bucket | Count | Spend share | Top issues |
|---|---|---|---|
| 9-10 (top) | N | X% | — |
| 7-8 (good) | N | X% | — |
| 4-6 (medium) | N | X% | LP exp gaps, CTR gaps |
| 1-3 (poor) | N | X% | Major issues |

For each QS cluster ≤ 6, drill into components:

- **Landing page experience: below average** → surface specific LP URLs scoring poorly. Cross-reference with [`ad-to-landing-page-auditor`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/ad-to-landing-page-auditor) findings if a recent audit was run. Action: review LP for message-match.
- **Expected CTR: below average** → propose RSA refresh on the ad group (chain to [`google-ads-rsa-optimizer`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/google-ads-rsa-optimizer)).
- **Ad relevance: below average** → keyword theme mismatch with ad copy. Action: split keyword to a better-matched ad group, OR refresh ads to mention the keyword theme literally.

Output specific QS improvement actions, not generic "improve your QS":

```markdown
### Quality Score remediation

5 keywords in ad group "enterprise-crm" have LP experience "below average":
- All point to /pricing
- LP hero: "AI Outbound Tool" (mismatched with ad group keyword theme)
- Action: review LP for message-match. Suggested chain: run google-ads-account-audit Phase 7 (LP audit) on /pricing for these keywords.

3 keywords in "competitor-alt" have Expected CTR "below average":
- Current RSA assets: 4 of 8 headlines marked Low
- Action: chain to google-ads-rsa-optimizer for this ad group
```

## Phase 5: Match-Type Optimization

For each keyword, evaluate match-type fit using its triggered search terms (cross-reference with `google-ads-search-terms-miner` output if recent run exists):

| Current → Proposed | When |
|---|---|
| Broad → Phrase or Exact | High spend + low relevance search terms triggering it |
| Phrase → Exact + add negatives | Many irrelevant variants triggering, exact match would tighten |
| Exact → Phrase | Performing well, but many close-variant negatives suggest there's adjacent volume worth capturing |

Output proposals with the search-term evidence:

```markdown
### Match-type changes

"crm software" (Broad) → propose change to Phrase
- Triggered 47 search queries over 30 days
- 23 of 47 are clearly irrelevant ("free crm software tutorial", "crm software jobs")
- Tightening to phrase would block ~$180/mo waste
```

## Phase 6: Duplicate / Cannibalization Detection

For each unique (keyword text + match type) combination, check if it appears in multiple ad groups within the same campaign:

- ❌ **Same keyword + same match type in 2+ ad groups** → cannibalization. Recommend: keep in highest-performing ad group (best CPA), pause in others.
- ⚠️ **Same keyword text, different match types across ad groups** → may be intentional (different intent → different LP). Flag for review, don't auto-propose action.

```markdown
### Duplicates / cannibalization

"ai sdr" (Exact) appears in 3 ad groups:
- "Solution-aware" — $210 spend, 6 conv, $35 CPA ← **highest performer**
- "Brand-defense" — $89 spend, 1 conv, $89 CPA
- "Competitor-alt" — $44 spend, 0 conv, —

Recommend: keep in "Solution-aware", pause in other two.
```

## Phase 7: Volume Sanity Check via Keyword Planner

For Bid-up + Match-type-expansion proposals, validate against Google Keyword Planner:

- Average monthly search volume
- Forecast clicks at proposed bid
- Top-of-page CPC range

If a Bid-up proposal targets a low-volume keyword, deprioritize — bidding harder for nothing. If volume is high but you're at low IS, the bid-up case strengthens.

If a Match-type-expansion (e.g. Exact → Phrase) targets a keyword with limited related-query volume, deprioritize.

## Phase 8: Per-Item Approval

Present proposals organized by bucket. Run through in this order (lowest risk first):

1. **Pause candidates** (lowest risk — stops bleed)
2. **Duplicates / cannibalization** (low risk — consolidates spend)
3. **Bid down** (low risk — caps overspend)
4. **Match-type changes** (medium — affects future query coverage)
5. **Bid up** (medium — increases spend)
6. **Quality Score remediation** (chains to other skills — chain proposals require explicit approval)

For each item:
- ✓ approve as proposed
- edit (e.g. set a different bid amount, change scope)
- ✗ reject

### Approval Gate 2 (final summary before saving drafts)

```markdown
### Final summary

**Pause: 8 keywords**
- 5 in Solution-aware ad group
- 3 in Competitor-alt ad group

**Bid changes: 12 keywords**
- 4 bid up (avg +$2.50 increase)
- 8 bid down (avg -$1.20 decrease)

**Match-type changes: 3 keywords**
- 2 Broad → Phrase
- 1 Phrase → Exact

**Duplicates: 2 deduplications**
- "ai sdr" pause in 2 ad groups
- "saas crm" pause in 1 ad group

**QS remediation actions queued:**
- LP audit on /pricing (chain to google-ads-account-audit Phase 7)
- RSA refresh on "competitor-alt" ad group (chain to google-ads-rsa-optimizer)

Ready to save these as drafts in your Google Ads account?
```

Wait for explicit confirmation.

## Phase 9: Save as Drafts

For each approved action, save via the Google Ads API:

| Action | Draft type |
|---|---|
| Pause | Paused-keyword draft |
| Bid change | Bid-update draft |
| Match-type change | New keyword (new match type) + pause original (combined draft) |
| Dedupe | Pause-in-ad-group draft for non-winning copies |

If draft creation isn't available via the connected API, output a **copy-paste-ready document** the user can apply manually in the Google Ads UI. Suggested filename: `google-ads-keyword-changes-{YYYY-MM-DD}.md`.

For QS remediation actions: don't save these as drafts (they trigger other skills). Just log them and queue the chained skill runs for the user's next session.

## Phase 10: Output

The skill returns the analysis inline, ending with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for future reference)

```
{YYYY-MM-DD} | google-ads-keyword-optimizer | Paused 8 keywords, bid-changed 12, match-type-changed 3, deduped 2. QS remediation queued: LP audit on /pricing, RSA refresh on competitor-alt. | Top patterns: pause for high-spend-zero-conv (5 of 8); bid-up triggered by IS-lost-to-rank > 30%.
```

### Learnings to capture

- Which keyword patterns the user approves vs. rejects (e.g. "user consistently rejects pauses on competitor brand terms — keep them as defensive even at 0 conv")
- Which match-type changes the user edits (signal for what's actually relevant in their account)

These notes can be passed back into this skill (or `google-ads-checkin`) on the next run to inform future proposals.

## Output Summary

- **Inline:** Full analysis report with proposals and approvals
- **In Google Ads:** Drafts for each approved action (or fallback markdown if drafts API unavailable)
- **Decisions log + Learnings:** Structured text blocks at end of report for the user to save

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual data export) — keyword data, QS components, IS metrics, draft creation
- **Google Keyword Planner access** (typically via the same Google Ads API connection) — volume validation for bid-up + expansion proposals

## Cost

Free.

## Universal Patterns

- **Suggestion-only:** Per-item approval gate.
- **Draft-first:** Approved actions saved as drafts. User activates from Google Ads UI.
- **Anti-laziness:** Pull all keyword + QS + IS data first; never ask the user something derivable from the API.
- **Self-healing:** Log API errors, retry with backoff. Output markdown fallback if draft creation fails.
- **No autonomous actions:** Even "obvious" pauses (e.g. $500 spend, 0 conv, 60 days) require user approval per item.
- **Cross-skill chaining:** When findings warrant deeper work (LP issues, RSA issues), propose chaining to `google-ads-account-audit` Phase 7 or `google-ads-rsa-optimizer` rather than trying to do everything in this skill.

## Trigger Phrases

- "Optimize my keywords"
- "Which keywords should I pause?"
- "Are my bids right?"
- "Find keyword duplicates"
- "Improve my Quality Scores"
- "Run keyword optimizer"
- "Audit my keyword performance"
