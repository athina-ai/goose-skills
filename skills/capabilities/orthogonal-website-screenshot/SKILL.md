---
name: orthogonal-website-screenshot
description: Take screenshots of websites and web pages
source: orthogonal
---


# Website Screenshot

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Capture screenshots of any website or web page. Useful for documentation, monitoring, and visual records.

## When to Use

- User asks for a screenshot of a website
- User wants to see what a site looks like
- Documenting web pages
- Monitoring website changes
- Creating visual records

## How It Works

Uses Notte or Brand.dev APIs to capture website screenshots.

## Usage

### Screenshot with Notte

```bash
# First start a session, then screenshot
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start","body":{"url":"https://stripe.com"}}'
# Then take screenshot with the session_id
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot"}'
```

### Screenshot with Brand.dev (simpler)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"stripe.com"}}'
```

### Scrape and Screenshot with Notte

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/scrape","body":{"url":"https://example.com"}}'
```

## Parameters

### Notte Session
- **url** (required) - Full URL to navigate to

### Brand.dev
- **domain** (required) - Website domain

## Response

### Brand.dev Response
Returns screenshot URL:
- **status** (string) - `ok` on success
- **domain** (string) - Domain that was screenshotted
- **screenshot** (string) - Public URL to the screenshot image (PNG)
- **screenshotType** (string) - `viewport` (above-the-fold) or `full_page`
- **code** (integer) - HTTP status code

### Notte Response
Returns page content + session:
- **markdown** (string) - Page content as markdown text
- **images** (array|null) - Extracted images (if any)
- **structured** (object|null) - Structured data (if extraction was requested)
- **session.session_id** (string) - Session ID for follow-up actions
- **session.status** (string) - `active` while session is open
- **session.credit_usage** (integer) - Credits consumed

To take an explicit screenshot via Notte session:
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot"}'
```

## Examples

**User:** "Take a screenshot of Notion's homepage"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"notion.so"}}'
```

**User:** "Capture what vercel.com looks like"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"vercel.com"}}'
```

**User:** "Screenshot and scrape the content from this article"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/scrape","body":{"url":"https://example.com/article"}}'
```

## Error Handling

- **400** - Missing required parameter (`domain` for Brand.dev, `url` for Notte)
- **404** - Domain not found or page doesn't exist
- **504** - Page took too long to load — retry or try simpler URL
- Brand.dev only screenshots the homepage (pass domain, not full URL)
- Notte sessions auto-expire after `idle_timeout_minutes` (default 3) — take screenshots promptly

## Tips

- Brand.dev is simpler for quick homepage screenshots
- Notte is more powerful for full page control
- For pages requiring login, use Notte sessions with authentication
- Screenshots are typically full-page or viewport-sized
- Some sites may block automated screenshots
