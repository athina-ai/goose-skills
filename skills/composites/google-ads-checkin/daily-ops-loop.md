# Workflow: Daily Ops Loop

SOP for ongoing Google Ads optimization once an initial audit has been run and prioritized actions have been taken. This is the steady-state cadence the optimization work settles into after the first round of changes.

## Cadence

| Account state | Skills to run | Frequency |
|---|---|---|
| Days 0–14 (post-launch / fresh changes) | `google-ads-checkin` | Daily |
| Days 0–14 | `google-ads-search-terms-miner` | Every 2–3 days |
| Days 15–30 | `google-ads-checkin` | Every 2 days |
| Days 15–30 | `google-ads-search-terms-miner` | Weekly |
| Days 30+ (mature) | `google-ads-checkin` | Every 3–5 days |
| Days 30+ | `google-ads-search-terms-miner` | Bi-weekly |
| When asset ratings drift | `google-ads-rsa-optimizer` | As triggered by check-in's lift findings |

## The loop, abstractly

```
1. CHECKIN runs (adaptive cadence)
   ├─ Pulls performance + lift on past suggestions
   ├─ Surfaces anomalies
   ├─ Proposes next actions
   └─ User approves which actions to run
       │
       ├─ If RSA refresh needed → trigger RSA OPTIMIZER
       ├─ If search terms drift → trigger SEARCH TERMS MINER
       ├─ If user-fixable issue (tracking, LP) → user does manually
       └─ If watch-list → wait for next check-in
2. Approved skills run, save drafts to Google Ads UI
3. User reviews drafts in Google Ads UI, activates manually
4. Activated changes accumulate in decisions log
5. Next CHECKIN measures lift on those decisions → repeat
```

## Approval discipline

Every skill requires per-item user approval before drafts are saved. If the user is going to be unavailable for a stretch:

- ✗ Do **not** lower the approval bar. Drafts pile up unsaved; that's the design.
- ✓ Do queue runs to fire when the user returns — `google-ads-checkin` can be scheduled.
- ✓ Do surface escalations clearly when the user does come back ("3 anomalies and 18 unactioned drafts since 2026-04-22").

## What this loop does NOT do

- ❌ No autonomous mutations — ever. Always drafts.
- ❌ No "set bid strategy to X" without explicit user approval.
- ❌ No new-campaign creation. This loop is for optimizing an existing account, not greenfield setup.

## When to break the loop

The loop is the steady state. Break it for:

- **New product launch** → Run a full account audit again. The optimization picture has shifted enough that prior decisions may not apply.
- **Major budget change** (>50%) → Run audit before resuming the loop. The whole optimization picture shifts.
- **New competitor entered** → Run search terms miner with focus on competitor brand bleed. Maybe RSA optimizer with new competitor angles.
- **Tracking broke** → Stop the loop until tracking is verified. Search terms miner is unreliable without conversions.
