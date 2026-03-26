---
name: aeo-run
description: >
  Run Goose AEO analysis — executes saved queries against AI search engines (ChatGPT, Perplexity, Gemini, Grok, Claude, DeepSeek),
  analyzes responses for brand mentions, and generates a conversational visibility report. Uses npx goose-aeo CLI.
tags: [seo]
---

You are running a Goose AEO (Answer Engine Optimization) analysis for the user. This executes their saved queries against AI search engines, analyzes the responses for brand mentions, and generates a visibility report.

Always use `--json` for machine-readable output — never rely on interactive prompts.

## Step 1: Pre-Flight Check

Verify setup exists:

```bash
cat .goose-aeo.yml 2>/dev/null || echo "NOT_FOUND"
```

If `.goose-aeo.yml` doesn't exist, tell the user: "AEO hasn't been set up yet. Say 'set up AEO' or use `/aeo-setup` to get started."

If it exists, check the current state:

```bash
npx goose-aeo status --json
```

Show the user a brief summary: company name, number of queries, number of previous runs.

## Step 2: Cost Estimate

Run a dry-run to estimate cost:

```bash
npx goose-aeo run --dry-run --json
```

Parse the JSON and tell the user:
- Number of queries that will be run
- Which providers will be queried
- Total API calls
- Estimated cost in USD

Ask for confirmation: "This will cost approximately $X.XX. Want to proceed?"

Do NOT proceed without explicit user confirmation.

## Step 3: Execute Run

```bash
npx goose-aeo run --confirm --json
```

This may take several minutes. Tell the user it's running and to hang tight.

Parse the result and show:
- Run ID
- Duration
- Actual cost
- Any errors (if some provider calls failed)

## Step 4: Analyze Results

```bash
npx goose-aeo analyze --json
```

Show brief progress: "Analyzing responses for brand mentions..."

Parse the result and note:
- How many responses were analyzed
- Analysis cost
- Any alerts triggered (metric drops from previous run)

## Step 5: Generate Report

```bash
npx goose-aeo report --json
```

Parse the JSON report and present a **conversational summary** to the user. Do NOT just dump raw numbers. Structure it like this:

### Summary Format

**Overall Visibility:**
- "Your brand was mentioned in X% of AI search queries (visibility rate)"
- "Average prominence score: X/1.0 (how prominently you're featured when mentioned)"
- "Share of voice: X (your ranking position vs competitors)"

**By Provider** (only include providers that were run):
- "ChatGPT mentioned you in X% of queries"
- "Perplexity mentioned you in X% of queries"
- etc.

**Key Insights:**
- Highlight the best-performing provider
- Highlight the worst-performing provider
- If share of voice data is available, mention top competitors
- If any alerts were triggered, explain what dropped and by how much

**Actionable Recommendations:**
Based on the results, suggest 2-3 things the user could do:
- If visibility is low: "Consider creating content that directly answers these types of queries"
- If one provider is much lower: "You may want to focus on optimizing for [provider]"
- If competitors are outranking: "Your top competitors [X, Y] are mentioned more frequently — look at what content they have that you don't"

## Step 6: Next Steps

Offer the user these options:
1. **"See the dashboard"** — Run `npx goose-aeo dashboard` to open a visual dashboard. If the user is working from a client subdirectory (e.g., `gooseworks/`), use `npx goose-aeo dashboard <client-dir>` from the parent directory instead.
2. **"Compare with a previous run"** — If there are 2+ runs, offer to run a diff
3. **"Set up a schedule"** — Ask if they want weekly or daily automated runs
4. **"Refine queries"** — If results suggest some queries aren't relevant, offer to adjust

## Error Handling

- If the run fails partway through, some provider responses may still have been saved. Check the error count and tell the user which providers failed.
- If analysis fails, it usually means the OpenAI API key is missing (used for the analysis model). Tell the user.
- If the report shows all zeros, the brand name/domain may not match what AI engines use. Suggest checking the company name and description in `.goose-aeo.yml`.
- Common issue: if visibility is 0% across the board, explain that this means AI engines aren't mentioning the brand yet — this is the baseline, and the goal is to improve from here.
