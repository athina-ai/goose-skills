---
name: aeo-audit
description: >
  Run a Goose AEO website audit — scrapes your website pages and scores each one for AI search readability
  across 6 dimensions (positioning clarity, structured content, query alignment, technical signals, content depth,
  comparison content). Uses npx goose-aeo CLI.
tags: [seo]
---

You are running a Goose AEO website audit for the user. This scrapes their website pages and scores each one for AI search readability across 6 dimensions.

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

Show the user a brief summary: company name, domain, number of queries.

## Step 2: Run the Audit

```bash
npx goose-aeo audit --json
```

This may take a minute or two as it scrapes pages and scores each one with an LLM. Tell the user it's running.

## Step 3: Present Results

Parse the JSON output and present a **conversational summary**. Do NOT dump raw numbers.

### Overall Score
- Present the overall score as "Your site scores X.X / 10 for AI search readability"
- If score >= 7: "Your site is well-optimized for AI search engines."
- If score 4-7: "Your site has room for improvement in AI search readability."
- If score < 4: "Your site needs significant work to be cited by AI search engines."

### Per-Page Highlights
- Call out the best-scoring page and worst-scoring page
- For the worst page, mention the lowest dimension and what it means

### Dimension Breakdown
Briefly explain which dimensions are strongest and weakest across the site:
- **Positioning Clarity**: Does your site clearly explain what you do upfront?
- **Structured Content**: Do pages use headings, lists, FAQs that AI can parse?
- **Query Alignment**: Does your content match what people ask AI engines?
- **Technical Signals**: Schema markup, meta descriptions, clean HTML?
- **Content Depth**: Enough detail for AI to form a meaningful citation?
- **Comparison Content**: Do you compare yourself to alternatives?

### Recommendations
Present the recommendations as numbered actionable items.

## Step 4: Offer to Fix

Based on the lowest-scoring dimensions, offer specific actions:

- If structuredContent is low: "Want me to add FAQ sections to your key pages?"
- If comparisonContent is low: "Want me to create a comparison page (e.g., 'Your Product vs Alternatives')?"
- If queryAlignment is low: "Want me to create content pages that directly answer your tracked queries?"
- If technicalSignals is low: "Want me to improve your meta descriptions and add schema markup?"
- If positioningClarity is low: "Want me to rewrite your homepage intro to clearly state what you do?"
- If contentDepth is low: "Want me to expand the content on your thinnest pages?"

Ask: "Which of these would you like me to work on?"

## Error Handling

- If the audit fails with "No company found", tell the user to run `goose-aeo init` first.
- If it fails with "GOOSE_AEO_OPENAI_API_KEY is required", tell the user to set the env var.
- If no pages could be scraped, suggest checking the domain in `.goose-aeo.yml` and whether the site is publicly accessible.
