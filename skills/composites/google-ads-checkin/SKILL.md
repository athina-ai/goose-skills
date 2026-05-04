---
name: google-ads-checkin
description: >
  Adaptive-cadence performance check-in for a Google Ads account being
  iteratively optimized. Pulls recent performance via the Google Ads API,
  measures lift on past suggestions (did approved RSA replacements improve
  asset ratings? did new negatives reduce waste?), surfaces anomalies,
  proposes the next round of optimizations, and outputs structured logs
  the user can persist for the next run. Cadence adapts to campaign maturity
  (every 4-6hr right after launch, daily during learning phase, every 2-5
  days when mature). Suggestion-only.
tags: [ads]
---

# Google Ads Check-in

The ongoing pulse on a Google Ads account being iteratively optimized. Replaces "weekly digest" cadence — adapts cadence to where each campaign is in its lifecycle, measures whether past suggestions worked, and proposes the next optimization round.

**Core principle:** A check-in is not a report. A report tells you what happened; a check-in measures whether past suggestions worked, surfaces what's drifting, and proposes specific next actions for approval.

**Universal pattern:** Suggestion-only, draft-first. The check-in surfaces findings + proposed next actions. The user approves per-item. Approved actions are executed by other skills (this skill never mutates the ad account itself).

## When to Use

- "Run a check-in on the account"
- "How are we doing?"
- "What's changed since last time?"
- "Did the RSA replacements work?"
- "What should I optimize next?"

Also intended to be **scheduled** as a recurring run (manual trigger, or via whatever scheduling mechanism the calling agent supports):

| Account state | Suggested cadence |
|---|---|
| Just launched / first 3 days | Every 4–6 hours |
| Learning phase / first 14 days | Daily |
| Early maturity / days 15–30 | Every 2 days |
| Mature / 30+ days | Every 3–5 days |

The skill itself recommends a cadence based on account age + recent volatility. The user (or scheduling layer) decides the actual cadence.

## Prerequisites

- A working Google Ads API connection (MCP server, native client, or manual export). The skill reads heavily across multiple GAQL queries.
- Optional but high-value: at least one prior run of `google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, or `google-ads-keyword-optimizer` — without past suggestions to measure lift on, the check-in degrades to a generic performance report.

## Phase 0: Intake

Ask the user for these inputs at the start of the run:

1. **Account ID** — the Google Ads customer ID
2. **Time since last check-in** — date of last check-in, or "first run"
3. **Decisions log since last check-in** *(optional but high-value)* — paste any prior decisions log entries (from earlier `google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, `google-ads-keyword-optimizer`, or `google-ads-account-audit` runs) so this skill can measure lift
4. **Top competitors** *(optional)* — used to track Auction Insights changes
5. **Target CPA / ROAS** — explicit, or "no target — benchmark me"
6. **Recent learnings** *(optional)* — paste any prior learnings entries so the skill can sharpen future proposals

If no prior decisions log is provided, the skill runs in "first check-in" mode: lift measurement is skipped, and the output focuses on performance snapshot + anomalies + next-round proposals based on the data alone.

## Phase 1: Determine Cadence Recommendation

Look at account age (oldest active campaign) + recent volatility:

```
Days since first active campaign:    {N}
Days since last optimization applied: {N}
Recent ±20% spend / CTR / conv-rate volatility (last 7d): {Y/N}

Recommended cadence: every {X} hours/days
```

If the user is running this skill manually, just note the cadence recommendation. If running on a schedule, the cadence is whatever the schedule fires at. See `checkin-cadence.md` (in this skill folder) for the full pseudo-logic.

## Phase 2: Pull Current Performance

Run via the Google Ads API, in parallel:

1. Account-level metrics over the period since last check-in
2. Campaign-level + ad group-level breakdowns
3. Asset performance ratings (RSA Best/Good/Low/Pending) — diff vs prior check-in if any
4. Day-by-day conversion + spend trend
5. Impression share metrics + Auction Insights diff

## Phase 3: Measure Lift on Past Suggestions

For each item in the decisions log provided at intake (skip this phase if no prior decisions):

| Past action | What to measure |
|---|---|
| RSA replacement | Did the new asset get a Best/Good rating? Has CTR or conv rate moved on the ad group? |
| Negative keyword added | Did wasted spend on that n-gram drop? |
| Keyword expansion | Is the new keyword getting impressions, clicks, conversions? |
| Budget reallocation | Did IS-lost-to-budget drop on the under-funded campaign? |
| LP fix (user-applied) | Has conv rate moved on that LP? |

Output specific findings:

```markdown
## Lift on past suggestions

### RSA optimizer (last run: 2026-04-15)
- ✓ Brand-defense ad group: 6 of 8 replacements now rated Good (was 0 Good before). CTR up from 4.1% → 5.6%.
- ⚠ Solution-aware ad group: 3 replacements still Pending (only 9 days impressions — not yet reliable).
- ✗ Competitor-alt ad group: 2 replacements rated Low. Note for next RSA run: candidates B and C didn't land — pattern was differentiation, may not fit this ad group's intent.

### Search terms miner (last run: 2026-04-18)
- ✓ Negative "free download" added 2026-04-18: wasted spend on n-gram dropped from $487 → $0 in 11 days.
- ✓ New keyword "ai sdr" exact: 14 conv at $58 CPA (target: $80). Promote to higher bid.
```

## Phase 4: Surface Anomalies

Detect anomalies relative to baseline:

| Anomaly | Trigger |
|---|---|
| Spend spike or crash | ±30% vs 7-day baseline |
| CTR drop | -25% vs 7-day baseline at material impressions |
| Conversion rate drop | -25% vs 7-day baseline at material clicks |
| Conversion volume drop to zero | Tracking probably broken — flag urgently |
| Impression share crash | IS dropped >15 percentage points |
| Auction Insights: new competitor entered top 5 | Track |
| RSA strength rating drop | One or more RSAs dropped to "Poor" |
| Quality Score drop on top keywords | Avg QS down ≥1 on keywords with material spend |

Don't fabricate composite scores. Just surface the specific anomaly with the metric.

```markdown
## Anomalies

- 🚨 Conversions dropped to 0 on 2026-04-27 — tracking may be broken. Verify pixel on /demo-thank-you immediately.
- ⚠ Brand-defense IS dropped from 100% → 78% over last 3 days. Possible competitor outbidding or budget cap hit.
- ⚠ "Acme Corp" appeared in Auction Insights top 5 (wasn't there last check-in) — new competitor.
```

## Phase 5: Propose Next Round

Combine lift findings + anomalies + new opportunities into a concrete next-round proposal. Don't propose generic "do more optimization" — propose specific actions tied to specific findings.

```markdown
## Proposed next actions

### Investigate / fix (high priority — user action)
1. Conversion tracking on /demo-thank-you — verify pixel firing. Requires manual user action.
2. Investigate brand-defense IS drop — check Auction Insights detail, consider bid increase if competitor pressure.

### AI agent can run (with your approval)
3. RSA optimizer rerun on Competitor-alt ad group — past replacements rated Low, try different patterns (urgency, scarcity instead of differentiation). Run `google-ads-rsa-optimizer`.
4. Search terms mining on "Acme Corp" — new competitor showing up, check if their brand terms are in your search queries. Run `google-ads-search-terms-miner` with focus on brand bleed.
5. Bid up on "ai sdr" — past run promoted at standard bid, performance is well below CPA target with IS lost to rank > 30%. Run `google-ads-keyword-optimizer` Phase 3 (Bid up bucket) on this keyword.
6. Pause underperformers in Solution-aware — 5 keywords with $300+ spend and 0 conv over 21+ days. Run `google-ads-keyword-optimizer`.
7. Competitive gap analysis — Acme Corp's IS up 12pp in Solution-aware over 30 days. Run `google-ads-competitor-gap-analysis` to see if their angles/keywords have shifted.

### Watch list (no action yet)
8. Solution-aware ad group RSAs still Pending — re-check next check-in (target: 14+ days impressions).
```

### Approval Gate

Present findings + proposed next actions to user. Ask:

> "Here's the check-in. Lift on past suggestions, anomalies, and proposed next actions. Which next actions do you want to run? Some are user-only (tracking fixes), some are skills you'd approve me to trigger."

For agent-runnable actions: user picks which to trigger. The agent chains directly into the relevant skill (`google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, `google-ads-keyword-optimizer`, `google-ads-competitor-gap-analysis`) or schedules it for later.

For user-only actions: the skill provides specific instructions (e.g. "open Google Tag Assistant on /demo-thank-you, verify the conversion event fires when the form submits").

## Phase 6: Output

The skill returns the full check-in inline, ending with these structured blocks the user can persist (anywhere they want):

### Decisions log entry (suggested to save for the next check-in)

```
{YYYY-MM-DD} | google-ads-checkin | Reviewed since last check-in {prior date}. Approved: rerun RSA optimizer on Competitor-alt; mine search terms for Acme Corp brand bleed. User-only: fix /demo-thank-you tracking.
```

### Learnings to capture

```
{YYYY-MM-DD} — Differentiation-pattern RSA replacements landed in Brand-defense (6/8 → Good) but didn't land in Competitor-alt (2/3 → Low). Hypothesis: Competitor-alt intent rewards urgency/scarcity, not differentiation. Try those patterns on next RSA run.
```

These notes can be passed back into this skill (or `google-ads-rsa-optimizer`, `google-ads-search-terms-miner`, etc.) on the next run to inform future proposals.

### Suggested filename for the check-in report

`google-ads-checkin-{YYYY-MM-DD-HHMM}.md` — the user can save the inline check-in wherever fits their workflow.

## Output Summary

- **Inline:** Full check-in: cadence recommendation, performance snapshot, lift on past suggestions, anomalies, proposed next actions
- **Decisions log + Learnings:** Structured text blocks at end of report for the user to save
- **Optional follow-up triggers:** Specific skills the user approved to run next

## Tools Required

- **Google Ads API connection** (MCP server, native client, or manual export) — for performance pulls, asset ratings, IS / Auction Insights data
- Anomaly detection logic (built into this skill's Phase 4)
- Check-in report template at `templates/checkin-report.template.md` in this skill folder
- Cross-references other skills in this Google Ads suite as user-approved next actions

## Cost

Free.

## Universal Patterns

- **Suggestion-only:** Findings + proposed next actions. User picks what runs.
- **Draft-first:** No mutations from the check-in itself. If the user approves a follow-up skill, that skill drafts.
- **Adaptive cadence:** Every 4–6hr fresh → daily learning → 2–3 day mature.
- **No composite scores:** Raw metrics + specific findings. No "B+ overall."
- **Lift-first framing:** Always measure whether past suggestions worked before proposing new ones.
- **Anti-laziness:** Cadence recommendation derived from account age + volatility, not asked of user.
- **End-of-session ritual:** Output decisions log + learnings entries on every run for the user to persist.

## Trigger Phrases

- "Run a check-in on the account"
- "How are we doing?"
- "What's changed since last time?"
- "Did the optimizations work?"
- "What should I optimize next?"
