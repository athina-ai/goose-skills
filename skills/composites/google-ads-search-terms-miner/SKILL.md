---
name: google-ads-search-terms-miner
description: >
  Mine the Google Ads search terms report for a live account. Runs N-gram
  analysis (1/2/3-word) by cost + ROAS, classifies n-gram themes into three
  buckets (scale / negative / expand), and proposes specific actions:
  negative keywords to add, keyword themes to expand, ad groups to investigate.
  Composes competitor-ad-intelligence for expansion ideas. Validates expansion
  proposals against Google Keyword Planner volume data. Per-item user approval;
  approved actions saved as drafts in Google Ads UI. No live mutations.
tags: [ads]
---

# Google Ads Search Terms Miner

The single highest-leverage ongoing optimization in Google Search Ads: mining the search terms report for waste (negative keyword candidates), winners (expansion candidates), and seasonal/intent mismatches.

**Core principle:** N-gram analysis (1/2/3-word phrases by cost + ROAS) reveals patterns invisible at the raw search-term level. A single search term spending $20 looks like noise; the 2-word n-gram "free download" spending $1,200 across 60 search terms is a screaming signal.

**Universal pattern:** Suggestion-only, draft-first. The skill proposes negatives + expansions, the user approves per-item, approved actions are saved as drafts in the Google Ads UI for the user to activate manually.

## When to Use

- "Mine search terms"
- "Find negative keywords I should add"
- "What keywords am I wasting money on?"
- "What new keywords should I add?"
- "Run search terms analysis"
- "Optimize my Google Ads keywords"

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The skill uses Google Ads API queries throughout.

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Primary conversion goal** — what conversion event is being optimized for
3. **Target CPA** — explicit, back-calculated from LTV × margin, or "no target — benchmark me"
4. **Brand-don't list** *(optional)* — words/phrases that should never appear in the user's ad copy or expansion keywords (sensitive language, regulated terms, off-brand topics)
5. **Top competitors** *(optional)* — used to recognize competitor brand bleed in search terms
6. **Recent decisions** *(optional)* — paste any prior decisions log entries so the skill avoids re-proposing negatives the user already added
7. **Scope** — all active Search campaigns by default; user can override

## Phase 1: Confirm Scope

| Parameter | Default | User can override |
|---|---|---|
| Time window | Last **30 days** | Yes — 14d for fresh accounts, 90d for mature |
| Spend threshold per term | ≥**$5** (filter noise) | Yes |
| Campaign scope | All active Search campaigns | Yes |
| N-gram window | **1, 2, and 3-word** phrases | Yes |
| Bucket thresholds | See Phase 3 | Yes |

### Approval Gate 1

> "I'll mine the last 30 days of search terms across all active Search campaigns. Filter noise below $5 per term. Run N-gram analysis on 1/2/3-word phrases. Want me to adjust before pulling data?"

Wait for confirmation.

## Phase 2: Pull Search Terms Report

Run via the Google Ads API:

```sql
SELECT
  search_term_view.search_term,
  campaign.name,
  ad_group.name,
  metrics.clicks,
  metrics.impressions,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  search_term_view.status
FROM search_term_view
WHERE
  segments.date BETWEEN '{start}' AND '{end}'
  AND metrics.cost_micros >= {threshold_micros}
  AND campaign.status = 'ENABLED'
```

Pull also: list of currently-active negative keywords per campaign + ad group (so we don't propose duplicates).

## Phase 3: N-gram Analysis

Use `scripts/ngram_analyzer.py` (in this skill folder) for tokenization, aggregation, ranking, and anomaly detection. Pure Python, standard library only — no dependencies to install.

For each search term, tokenize into 1-word, 2-word, and 3-word phrases (lowercase, strip punctuation). Aggregate by n-gram:

```
n-gram → {
  total_cost,
  total_clicks,
  total_impressions,
  total_conversions,
  total_conv_value,
  cpa = total_cost / total_conversions,  # null if 0 conv
  roas = total_conv_value / total_cost,  # null if no value tracking
  sample_terms: [list of 3-5 representative search terms],
  campaigns: [where this n-gram appears]
}
```

Produce four ranked tables per n-gram window (1/2/3):

| Table | Sort | Filter |
|---|---|---|
| Top spenders | by cost desc | top 30 |
| Biggest waste | by cost desc, conv = 0 OR CPA > 2× target | top 20 |
| Top performers | by ROAS desc, min spend | top 20 |
| Anomalies | seasonal/intent mismatches | flagged |

### Anomaly detection

Surface n-grams that look out of place:

- **Seasonal/temporal** — terms tied to specific dates/seasons running outside window (e.g. "halloween" in March)
- **Job-seeker / researcher / student bleed** — "jobs", "salary", "tutorial", "course", "review", "wikipedia", "reddit", "quora"
- **Competitor brand bleed** — competitor names showing up in spend without a competitor campaign (or with weak performance)
- **Free / unrelated bleed** — "free download" for paid SaaS, "open source" for closed product, etc.

## Phase 4: 3-Bucket Classification

For each meaningful n-gram (above noise threshold), classify into one of three buckets via intent reasoning:

| Bucket | Signal | Suggested action |
|---|---|---|
| **🔴 Negative** | High spend + 0 or near-0 conversions, OR high CPA, OR clear intent mismatch | Add as negative keyword |
| **🟢 Scale** | High spend + good performance (CPA at or below target, ROAS at or above target) | Expand: add as exact-match keyword in dedicated ad group, raise bid |
| **🟡 Expand** | Low spend + good performance | Lower-priority expansion: add to existing ad group as exact match, monitor |

Plus **anomaly bucket** from Phase 3 — these get treated as negatives unless the user redirects.

For each n-gram in each bucket, draft the specific proposed action with reasoning.

```markdown
### 🔴 Negative — proposed
| N-gram | Spend | Conv | Sample terms | Why | Match type | Scope |
|---|---|---|---|---|---|---|
| "free download" | $487 | 0 | "free download crm", "free download tool", ... | Free intent, no commercial signal. 0 conv across 31 search terms. | Phrase | Campaign-level |
| "salary" | $213 | 0 | "saas product manager salary", ... | Job-seeker bleed | Phrase | Account-level |
| "halloween" | $89 | 0 | (in March) | Seasonal mismatch | Phrase | Campaign-level |
```

```markdown
### 🟢 Scale — proposed
| N-gram | Spend | Conv | CPA | ROAS | Sample terms | Why | Action |
|---|---|---|---|---|---|---|---|
| "ai sdr" | $1,240 | 18 | $69 | 3.1 | "ai sdr tool", "ai sdr platform", ... | Below target CPA at meaningful volume | Promote to dedicated ad group with exact match keywords |
```

```markdown
### 🟡 Expand — proposed
| N-gram | Spend | Conv | Sample terms | Why | Action |
|---|---|---|---|---|---|
| "for b2b saas" | $124 | 4 | "lead gen for b2b saas", ... | Specificity matches ICP, low spend, good conv rate | Add as exact-match keyword in Solution-aware ad group |
```

## Phase 5: Validate Expansion Candidates Against Keyword Planner

For each proposed Scale + Expand keyword, query Google Keyword Planner API for:
- Average monthly search volume
- Competition level
- Estimated bid range

If a proposed expansion has near-zero search volume, deprioritize it — it's a long-tail with no scale potential. Surface in the report but mark "low volume, monitor only."

## Phase 6: Optional — Competitor-Inspired Expansion

If the user wants competitor-inspired expansion, compose [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence) on top competitors and surface keyword themes competitors are bidding on that the user isn't. This is opt-in (extra approval gate) because it's a different type of expansion than the in-account-data-driven proposals.

### Approval Gate 2 (optional)

> "Want me to also pull competitor ad data and surface keyword themes they're bidding on that you're not?"

If yes, run competitor-ad-intelligence and add findings as a separate "Competitor-inspired expansion" section.

## Phase 7: Per-Item User Approval

Present the full proposal to the user, organized by bucket. For each item, the user can:

- **✓** approve as proposed
- **edit** approve with edits (e.g. change match type, scope to specific ad group)
- **✗** reject (don't add)

Run through Negatives first (lowest risk, highest hygiene impact), then Scale, then Expand, then optional Competitor-inspired.

```markdown
### 🔴 Negative — review

1. "free download" — Phrase, Campaign-level — $487 wasted, 0 conv → ✓ / edit / ✗
2. "salary" — Phrase, Account-level → ✓ / edit / ✗
3. "halloween" — Phrase, Campaign-level → ✓ / edit / ✗
[...]

### 🟢 Scale — review

1. "ai sdr" — Promote to dedicated ad group, exact match → ✓ / edit / ✗
[...]
```

### Approval Gate 3 (final summary)

After per-item review:

```markdown
### Final summary

**Negatives to add: 12**
- 8 at campaign level, 3 at ad group level, 1 at account level

**Keywords to add (Scale): 4**
- 2 in new ad group "AI SDR — Exact"
- 2 in existing "Solution-aware" ad group

**Keywords to add (Expand): 6**
- All in existing ad groups as exact match

**Skipped: 5**

Ready to save these as drafts in your Google Ads account? You'll review and apply them from the Google Ads UI. I won't apply anything.
```

Wait for explicit confirmation.

## Phase 8: Save as Drafts

Push approved actions to Google Ads as drafts via the Google Ads API:

- **Negatives** → save as draft negative keyword changes (campaign / ad group / account level as configured)
- **Scale + Expand keywords** → save as draft new keywords in the specified ad groups (new ad groups created as drafts if needed)

If draft creation isn't available via the connected API, output a **copy-paste-ready document** the user can apply manually in the Google Ads UI. Suggested filename: `google-ads-keyword-changes-{YYYY-MM-DD}.md`.

## Phase 9: Output

The skill returns the analysis inline, ending with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for future reference)

```
{YYYY-MM-DD} | google-ads-search-terms-miner | Approved 12 negatives, 4 scale keywords, 6 expand keywords. Skipped 5. | Top waste themes: "free download", "salary", "tutorial". Top expansion: "ai sdr".
```

### Learnings to capture

- Patterns of negatives the user approves vs. skips (next run, prioritize the patterns they like)
- Expansion keywords the user edits or rejects (signal for what's actually relevant)

These notes can be passed back into this skill (or `google-ads-checkin`) on the next run to inform future proposals.

## Output Summary

- **Inline:** Full N-gram tables, bucket classifications, and proposals
- **In Google Ads:** Drafts for each approved action (or fallback markdown if drafts API unavailable)
- **Decisions log + Learnings:** Structured text blocks at end of report for the user to save

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual data export) — search terms report, current negatives, draft creation
- **Google Keyword Planner access** (typically via the same Google Ads API connection) — volume validation
- Composes skill: [`competitor-ad-intelligence`](https://github.com/gooseworks-ai/goose-skills/tree/main/skills/composites/competitor-ad-intelligence) (optional, Phase 6)

## Cost

Free. All data sources are free at this scale.

## Universal Patterns

- **Suggestion-only:** Per-item approval gate.
- **Draft-first:** Approved actions saved as drafts. User activates from Google Ads UI.
- **Anti-laziness:** Pull data first, only ask user for things we can't derive.
- **Self-healing:** Log API errors, retry with backoff. Output markdown fallback if draft creation fails.
- **N-gram rigor:** Every classification ties back to specific n-gram metrics, not gut feel. User can always audit the math.
- **No autonomous additions:** Even "obvious" negatives like "salary" or "jobs" require user approval.

## Trigger Phrases

- "Mine search terms"
- "Find negative keywords I should add"
- "What keywords am I wasting money on?"
- "What new keywords should I add?"
- "Optimize my Google Ads keywords"
- "Run search terms analysis"
