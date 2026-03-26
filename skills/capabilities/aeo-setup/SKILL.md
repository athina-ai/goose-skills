---
name: aeo-setup
description: >
  Set up Goose AEO (Answer Engine Optimization) for a domain. Interactive setup that asks for your domain,
  detects competitors, configures AI search providers, and generates test queries. Uses npx goose-aeo CLI.
tags: [seo]
---

You are setting up Goose AEO (Answer Engine Optimization) for a user. AEO tracks how visible their company is across AI search engines like ChatGPT, Perplexity, Gemini, Grok, Claude, and DeepSeek.

Your job is to have a natural conversation with the user, gather the information needed, and run the CLI commands on their behalf. The user should never need to learn CLI syntax.

## Important: Non-Interactive Mode Only

The CLI uses interactive prompts (inquirer) that DO NOT work when run via the Bash tool. You MUST always use `--json` mode and pass all arguments as flags. Never run a command that would trigger an interactive prompt.

## Step 1: Gather Information

Ask the user for the following. Be conversational — you can ask these in one message or spread across a few:

- **Company domain** (e.g., `athina.ai`, `gumloop.com`) — required
- **Company name** (e.g., "Athina AI") — if not provided, derive from domain
- **A few competitors** — ask "Who are your main competitors?" If they're not sure, say you'll auto-discover them. Accept domain names or company names.
- **Which AI engines to monitor** — default is Perplexity, OpenAI, and Gemini. Ask if they want to add Grok, Claude, or DeepSeek. More providers = higher cost per run.

Do NOT proceed until you have at least the company domain.

## Step 2: Check Prerequisites

Check which API keys are available:
```bash
node -e "
const keys = {
  GOOSE_AEO_PERPLEXITY_API_KEY: !!process.env.GOOSE_AEO_PERPLEXITY_API_KEY,
  GOOSE_AEO_OPENAI_API_KEY: !!process.env.GOOSE_AEO_OPENAI_API_KEY,
  GOOSE_AEO_GEMINI_API_KEY: !!process.env.GOOSE_AEO_GEMINI_API_KEY,
  GOOSE_AEO_GROK_API_KEY: !!process.env.GOOSE_AEO_GROK_API_KEY,
  GOOSE_AEO_CLAUDE_API_KEY: !!process.env.GOOSE_AEO_CLAUDE_API_KEY,
  GOOSE_AEO_DEEPSEEK_API_KEY: !!process.env.GOOSE_AEO_DEEPSEEK_API_KEY,
  GOOSE_AEO_FIRECRAWL_API_KEY: !!process.env.GOOSE_AEO_FIRECRAWL_API_KEY,
};
console.log(JSON.stringify(keys, null, 2));
"
```

Tell the user which keys are set and which are missing for their chosen providers. If keys are missing, ask them to provide the values. When they do, write them to `.env`:
```bash
echo 'GOOSE_AEO_PERPLEXITY_API_KEY=pplx-...' >> .env
```

The GOOSE_AEO_OPENAI_API_KEY is also needed for query generation and analysis (not just as a monitored provider). Make sure the user knows this.

## Step 3: Run Init

Run the init command non-interactively. Build the flags from what the user told you:

```bash
npx goose-aeo init \
  --domain <domain> \
  --name "<company name>" \
  --providers <comma-separated-providers> \
  --competitors "<comma-separated-competitor-domains>" \
  --json
```

If the user provided seed competitors, pass them. If not, the tool will auto-discover using Perplexity (if the API key is set).

Parse the JSON output. Show the user:
- The competitors that were discovered/set
- The providers configured
- The config file location

Ask: "Do these competitors look right? Want to add or remove any?"

If the user wants changes, edit the `.goose-aeo.yml` file directly using the Edit tool — do NOT re-run init.

## Step 4: Generate Sample Queries

Generate a small batch for the user to review:

```bash
npx goose-aeo queries generate --limit 10 --dry-run --json
```

Show the queries to the user in a readable numbered list. Ask: "Do these queries look like the kind of things your potential customers would search for? Want to adjust anything?"

If the user wants changes:
- If the queries are off-topic, check the company description in `.goose-aeo.yml` and update it to be more accurate, then re-generate.
- If specific queries should be added, use: `npx goose-aeo queries add "<query text>" --json`
- If specific queries should be removed after generation, use: `npx goose-aeo queries remove <id> --json`

## Step 5: Generate Full Query Set

Once the user approves the direction, generate the full set:

```bash
npx goose-aeo queries generate --limit 50 --json
```

Tell the user how many queries were generated.

## Step 6: Hand Off

Tell the user:
- Setup is complete
- They can run their first analysis now by saying "run my AEO analysis" or using `/aeo-run`
- Each run will cost approximately $X (based on queries x providers — rough estimate: 50 queries x 3 providers ~ $2-5)
- They can view results in a dashboard after running

If the user initialized inside a client subdirectory (e.g., `gooseworks/`, `athina/`), remind them that the dashboard can be opened from the parent directory with:
```bash
npx goose-aeo dashboard <client-dir>
```

Ask if they want to run their first analysis right now. If yes, proceed with the `/aeo-run` flow (run the commands from that skill inline).

## Error Handling

- If init fails, show the error. Common issues: missing API keys, invalid domain format, Node.js version < 20.
- If query generation fails, it usually means the OpenAI API key is missing or invalid.
- Never silently swallow errors — always show them to the user and suggest a fix.
