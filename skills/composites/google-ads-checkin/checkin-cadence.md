# Workflow: Check-in Cadence Logic

How `google-ads-checkin` decides the recommended cadence for a given account. This logic lives in the skill itself — this doc is the human-readable spec for how it works.

## Why adaptive cadence

Adaptive cadence beats fixed weekly digests for three reasons:

- A new account or a freshly-changed account needs near-constant attention (tracking can break, search terms surface fast, learning phase is fragile)
- A mature, stable account checked daily generates noise and approval fatigue
- Real performance marketers naturally adjust attention based on lifecycle — automation should match that

## Cadence levels

| Level | Cadence | When it applies |
|---|---|---|
| **Hot** | Every 4–6 hours | Days 0–3 after a new campaign launch OR a major change (e.g. bid strategy switch, large budget increase, RSA replacement batch >5 ad groups) |
| **Warm** | Daily | Days 4–14 (learning phase) |
| **Steady** | Every 2 days | Days 15–30 (early maturity) |
| **Cool** | Every 3–5 days | Days 30+ (mature, stable) |

Plus override: **on-demand** — user manually invokes `google-ads-checkin` whenever they want a fresh pulse.

## How the skill picks a cadence

Pseudo-logic:

```
days_since_launch = days since the oldest active campaign was created
days_since_change = days since last optimization (RSA replacement, negatives added, etc.)
recent_volatility = any of these in last 7 days:
  - ±20% spend swing day-over-day
  - ±20% CTR swing
  - ±20% conversion-rate swing
  - new anomaly fired

if days_since_change <= 3:
  cadence = HOT
elif days_since_launch <= 14 or days_since_change <= 14:
  cadence = WARM
elif days_since_launch <= 30:
  cadence = STEADY
elif recent_volatility:
  cadence = WARM  # promote when stable accounts go volatile
else:
  cadence = COOL
```

## Override rules

The skill **recommends** a cadence and surfaces the reasoning. The user (or whatever scheduling layer the calling agent uses) sets the actual schedule. Don't auto-schedule without user approval.

Common override patterns:

| User wants | Set cadence to |
|---|---|
| Tighter monitoring during a critical period | Hot or Warm regardless of recommendation |
| Less interruption during a stable stretch | Cool regardless of recommendation |
| Off entirely for X days (e.g. on PTO) | Pause the schedule |

## What "cadence" actually means

A check-in run does not mean making changes — it means generating a check-in report and surfacing proposed next actions. Whether anything happens depends on the user approving proposed actions in the report.

So a Hot cadence (every 4–6 hours) does NOT mean changes every 4–6 hours. It means the skill pulls fresh data and proposes actions every 4–6 hours; whether the user approves any is up to them.
