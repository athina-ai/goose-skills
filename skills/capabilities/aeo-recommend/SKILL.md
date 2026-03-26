---
name: aeo-recommend
description: >
  Generate AI visibility recommendations from Goose AEO analysis data. Analyzes your latest run to identify
  visibility gaps, source opportunities, and competitor insights with actionable next steps. Uses npx goose-aeo CLI.
tags: [seo]
---

You are generating AI visibility recommendations for the user. This analyzes their latest AEO run data and produces actionable recommendations for improving brand visibility in AI search engines.

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

Show the user a brief summary: company name, number of queries, number of previous runs. If there are no runs, tell the user: "No runs found. Use `/aeo-run` to run an analysis first."

## Step 2: Generate Recommendations

```bash
npx goose-aeo recommend --json
```

This calls the OpenAI API to synthesize analysis data into recommendations. Tell the user it's generating and may take a moment.

## Step 3: Present Results

Parse the JSON and present a **conversational summary** to the user. Do NOT just dump raw JSON. Structure it like this:

**Overall Summary:**
- Start with the summary paragraph from the response. This gives the big picture of the brand's AI visibility position.

**Visibility Gaps:**
For each gap, explain:
- The topic/theme where the brand is missing
- Which queries are affected
- Which competitors are being mentioned instead
- The specific recommendation

**Source Opportunities:**
For each opportunity, explain:
- Which domain/site is frequently cited by AI engines
- How many times it was cited
- The specific action item for getting featured there

**Competitor Insights:**
For each insight, explain:
- Which competitor is outperforming and in what queries
- Any relevant excerpts showing how they're being mentioned
- What they might be doing differently

## Step 4: Offer Next Steps

Based on the recommendations, offer the user these options:

1. **"Want me to draft content for any of these gaps?"** — If there are visibility gaps around specific topics, offer to create blog posts, landing pages, or FAQ content.
2. **"Want me to create a comparison page?"** — If competitors are being mentioned instead, offer to draft a vs/comparison page.
3. **"Want me to write a guest post pitch for [domain]?"** — If there are source opportunities with specific domains, offer to draft an outreach email or guest post pitch.
4. **"Want me to update your queries?"** — If the recommendations suggest new query angles, offer to add them.
5. **"See the dashboard"** — Suggest opening `npx goose-aeo dashboard` for visual exploration.

## Error Handling

- If the recommendation generation fails with an API key error, tell the user to check their `GOOSE_AEO_OPENAI_API_KEY` environment variable.
- If there are no analysis results, suggest running `/aeo-run` first.
- If the LLM response fails to parse, it will retry automatically. If it still fails, tell the user and suggest trying again.
