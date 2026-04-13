---
name: orthogonal-find-dentists
description: Build a sales prospect list of dental practices in a city — finds practices, decision makers, contact info, and buying signals. Use when asked to find dentists for outreach, prospect dental practices, build a lead list of dentists, or generate dental practice leads in a specific area.
source: orthogonal
---


# Find Dentists — Sales Prospecting for Dental Practices

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Build a prioritized prospect list of dental practices in any city. Goes beyond basic contact info — finds the decision maker (practice owner or office manager), what software and services the practice already uses, and intent signals like job postings that indicate they're actively hiring or growing.

## When to Use

- User wants to prospect dental practices in a city for sales outreach
- User asks "find me dentists in [city]" or "get dental practice leads in [area]"
- User is selling a product/service to dental practices and needs a lead list
- User wants to identify high-priority prospects (actively hiring, new practices, or missing a specific solution)

## Workflow

### 1. Parse the Request

Extract from the user's query:
- **City/location** (required) — city name, zip code, neighborhood, or area
- **Specialty** (optional) — general dentist, orthodontist, pediatric dentist, cosmetic dentist, oral surgeon, etc.
- **Max results** (optional, default 10) — scale up if user asks for more
- **Company/product** (optional) — if the user mentions a company name, domain, or product (e.g., "for our dental scheduling software", "suitable for our practice management tool"), extract it. This triggers competitor research in Step 6 to check whether each practice already uses a competing product

### 2. Find Dental Practices

Run 2-3 search strategies **in parallel**:

**Strategy A — Scrapegraph searchscraper** (primary — structured data in one call):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in {city} with practice name, phone number, email address, office address, and website URL",
  "num_results": 10
}'
```

This is the highest-signal source. In testing, it returned **57 practices** for San Francisco in a single call — far more than the requested 10. Returns structured JSON with practice names, phone numbers, addresses, websites, and sometimes emails.

**Strategy B — Tavily web search** (supplemental — Yelp/Healthgrades/Maps results):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "dentists in {city} phone number address",
  "max_results": 10,
  "include_answer": false
}'
```

Returns search result URLs + snippets. Parse dentist names, phone numbers, and addresses from the snippets.

**Strategy C — Exa search** (directory pages with full text):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "dentists in {city} phone number address",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'
```

Returns listing pages with full text content. Useful for parsing contact info from practice websites. Note: Exa sometimes returns irrelevant results — filter by relevance.

#### Scaling Up — Getting More Results

To get more than the initial batch, **search by neighborhood**:

```bash
# Run in parallel — one search per neighborhood
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in Mission District San Francisco with practice name, phone, email, address, website",
  "num_results": 10
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in Sunset District San Francisco with practice name, phone, email, address, website",
  "num_results": 10
}'

# ... repeat for each neighborhood
```

Guidelines: 10-20 results = default single round. 20-50 = search 3-5 neighborhoods. 50-100+ = search every neighborhood + dental society directories.

### 3. Extract & Deduplicate

From all results, extract per practice:
- **Practice name**
- **Phone number**
- **Address**
- **Website URL**
- **Email** (if found)
- **Dentist name(s)** (if listed)

Deduplicate by practice name + address, or by phone number.

### 4. Find the Decision Maker

This is the high-value step. For each practice, identify the **practice owner or office manager** — the person who actually buys software and services.

**Primary method — Scrape the practice website's About/Team page:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://smithfamilydental.com/about",
  "user_prompt": "Extract the names and roles of all staff. Identify the practice owner, office manager, or managing dentist. Also extract any email addresses and phone numbers on this page."
}'
```

Run in parallel for all practices with websites. This is the **most reliable method** for dental practices — in testing, it successfully identified decision makers on 5/5 websites (owners, office managers, managing dentists).

**URL path handling:** Try the homepage URL first — most practice websites mention the owner/managing dentist on the homepage. If the homepage doesn't have staff info, try appending `/about`, `/about-us`, `/our-team`, or `/team`. Note: appending paths like `/about` to some websites returns a 422 error. If that happens, fall back to the base homepage URL which almost always works.

**Fallback — Fiber kitchen-sink** (if you found a LinkedIn URL for someone at the practice):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person"}'
  "profileIdentifier": "https://linkedin.com/in/drmanali"
}'
```

Returns full profile data with email, phone, and work history.

**Important: Fiber people-search and job-search with searchParams filters are unreliable** — in testing, both returned 400 errors consistently even with documented parameter formats. Do NOT rely on these as primary methods. Use Scrapegraph smartscraper for decision maker discovery and Scrapegraph searchscraper for job posting signals instead.

### 5. Get Decision Maker Contact Info

For each decision maker identified in Step 4, find their direct email:

**Scrape the practice contact page** (most reliable for dental practices):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://smithfamilydental.com/contact",
  "user_prompt": "Extract all email addresses and phone numbers from this page"
}'
```

In testing, this found practice emails (info@, office@) on most sites. For decision maker personal emails, try:

**Hunter email-finder** (predict email by name + domain):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"smithfamilydental.com","first_name":"Sarah","last_name":"Johnson"}}'
```

Note: Hunter often returns null for small dental practice domains. It works better for larger group practices.

**Tomba LinkedIn-to-email** (if LinkedIn URL found):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/linkedin","query":{"url":"https://linkedin.com/in/sarahjohnson"}}'
```

**Exa LinkedIn discovery** (find LinkedIn URL for the decision maker):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "Dr. Manali Rathod dentist San Francisco",
  "numResults": 3,
  "includeDomains": ["linkedin.com"]
}'
```

Once you have a LinkedIn URL, use Fiber kitchen-sink or Tomba for email extraction.

**Realistic expectations:** Decision maker personal emails are hard to find for dental practices. Most contact info you'll get is practice-level (info@, office@). This is still valuable — the key insight is knowing WHO to ask for when you call or email.

### 6. Competitive Intel — Check for Competing Products

If the user mentioned a company or product (e.g., "suitable for our dental scheduling software", "prospects for our practice management tool"), research that company's competitors first, then check each dental practice's website for those competitors. This tells the sales team which practices are greenfield vs. competitive displacement.

**Step 1 — Research the user's company and its competitors:**

```bash
# Look up the company to understand what they do
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{company_domain}",
  "user_prompt": "What does this company do? What product or service do they offer to dental practices? Describe it in one sentence."
}'

# Find competitors
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "competitors and alternatives to {company} for dental practices",
  "num_results": 5
}'
```

From these results, build a list of competitor product names to check for.

**Step 2 — Check each practice's website for competing products:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://smithfamilydental.com",
  "user_prompt": "Does this dental practice use or mention any of the following products or services: {competitor_1}, {competitor_2}, {competitor_3}? Also check for any similar {product_category} tools. Look in the page content, footer, embedded widgets, and any third-party integrations."
}'
```

Run in parallel for all practices.

**If no company/product was mentioned**, use a broad tech stack scan instead:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://smithfamilydental.com",
  "user_prompt": "What software, tools, and third-party services does this dental practice use? Look for: online scheduling/booking systems, patient portals, practice management software, payment processors, chatbots, answering services, marketing tools, review platforms, or any other integrations mentioned in the page content, footer, or embedded widgets."
}'
```

Flag practices based on findings:
- **No competing solution detected** — top priority prospect (greenfield)
- **Uses a competitor** — note which one. Lower priority, but may be open to switching. The sales team can tailor their pitch against the specific competitor
- **Unknown** — couldn't determine from website

### 7. Intent Signals — Identify Ready-to-Buy Prospects

These signals indicate a practice is actively growing or hiring, making them high-priority targets.

**Signal A — Active job postings** (strongest buying signal):

Use Scrapegraph searchscraper to find dental practices with open positions. Tailor the job title to what the user is selling — e.g., if selling staffing solutions, look for any open roles; if selling a specific product, look for roles that product would replace or support:

```bash
# Example: find practices hiring for front desk / receptionist roles
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dental practices hiring receptionist or front desk in {city}, list the practice name, job title, and salary",
  "num_results": 10
}'

# Example: find practices hiring dental assistants
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dental practices hiring dental assistant in {city}, list the practice name, job title, and salary",
  "num_results": 10
}'
```

In testing, this returned **11 SF practices** actively hiring front desk staff in a single call, with practice names and salary ranges. This is the most efficient way to find this signal.

For more comprehensive job listing coverage, also scrape job board listing pages:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "dental {role} job opening {city}",
  "max_results": 5,
  "include_answer": false
}'

# Then scrape the top job listing page for specific practice names
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.glassdoor.com/Job/{city}-dental-receptionist-jobs-SRCH_...",
  "user_prompt": "Extract all dental practice names that are hiring, along with the job title, salary if listed, and location"
}'
```

In testing, scraping Glassdoor returned **29 practices** hiring in the SF Bay Area with salary data. Cross-reference these with your practice list from Step 2 — matches are your highest-priority prospects.

**Signal B — New practices** (recently opened, still building their operations):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "new dental practice opening {city} 2025 2026",
  "max_results": 10,
  "topic": "news",
  "include_answer": false
}'
```

New practices are more open to adopting new tools and services from day one.

**Signal C — Practice size** (from the team page scrape in Step 4):

Solo practices and small group practices (2-5 dentists) are typically the sweet spot for most dental products — large enough to have real operational needs, small enough that they don't have enterprise procurement processes.

### 8. Present Results

Output a prioritized prospect list. **Always show the full website URL** (e.g., `https://smithdental.com`) — not just "Website" or a markdown link. The sales team needs to be able to click or copy-paste the URL directly:

```
## Dental Practice Prospects in {City}

Found {N} practices, ranked by sales readiness:

### High Priority (strong buying signals)
| # | Practice | Decision Maker | Title | Phone | Email | Website | Signal |
|---|----------|---------------|-------|-------|-------|---------|--------|
| 1 | Smith Dental | Sarah Johnson | Office Manager | (415) 555-1234 | info@smithdental.com | https://smithdental.com | Actively hiring |
| 2 | ... | ... | ... | ... | ... | ... | New practice |

### Medium Priority (no competing solution detected)
| # | Practice | Decision Maker | Title | Phone | Email | Website | Notes |
|---|----------|---------------|-------|-------|-------|---------|-------|
| 3 | ... | ... | ... | ... | ... | https://... | Solo practice, no competing solution found |

### Lower Priority (competing solution detected)
| # | Practice | Decision Maker | Title | Phone | Email | Website | Current Solution |
|---|----------|---------------|-------|-------|-------|---------|-----------------|
| 8 | ... | ... | ... | ... | ... | https://... | Uses {competing product} |

### Summary
- Total practices found: {N}
- Decision makers identified: {count}/{N}
- Practices actively hiring: {count} (high priority)
- Practices with no competing solution: {count}
- Practices with competing solution: {count}
```

## APIs Used

1. **Scrapegraph** `/v1/searchscraper` — find dental practices via web search, find hiring signals, and research competitors
2. **Scrapegraph** `/v1/smartscraper` — scrape practice websites for decision maker names, emails, and check for competing products
3. **Tavily** `/search` — supplemental web search, job board discovery, new practice detection
4. **Exa** `/search` — find directory pages, LinkedIn URL discovery for decision makers
5. **Fiber** `/v1/kitchen-sink/person` — enrich decision maker with LinkedIn URL (when available)
6. **Hunter** `/v2/email-finder` — find decision maker email by name + domain
7. **Tomba** `/v1/linkedin` — LinkedIn-to-email lookup

## Examples

**User:** "Find dentists in San Francisco for our sales team"
```bash
# Step 2: Find practices (run in parallel)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in San Francisco with practice name, phone number, email address, office address, and website URL",
  "num_results": 10
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "dentists in San Francisco phone number address",
  "max_results": 10,
  "include_answer": false
}'

# Step 4: Find decision makers (run in parallel for each practice)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.thedentalpracticesf.com",
  "user_prompt": "Extract the names and roles of all staff. Identify the practice owner, office manager, or managing dentist. Also extract any email addresses and phone numbers."
}'

# Step 6: Competitive intel (run in parallel — tailor prompt to what you're selling)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.thedentalpracticesf.com",
  "user_prompt": "What software, tools, and third-party services does this dental practice use? Look for online scheduling systems, patient portals, practice management software, payment processors, chatbots, answering services, or any integrations in the page content, footer, or widgets."
}'

# Step 7: Intent signals — who is actively hiring?
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dental practices hiring receptionist or front desk in San Francisco, list the practice name, job title, and salary",
  "num_results": 10
}'
```

**User:** "Find me dentists in San Francisco suitable for our dental scheduling software" (user provides their company domain separately or it's known from context)
```bash
# Step 1: Research the user's company and find competitors
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://{user_company_domain}",
  "user_prompt": "What does this company do? What product or service do they offer to dental practices?"
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "competitors and alternatives to {user_product_description} for dental practices",
  "num_results": 5
}'

# Step 2: Find practices (parallel)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in San Francisco with practice name, phone number, email address, office address, and website URL",
  "num_results": 10
}'

# Step 6: Check each practice for competitors (parallel, for each practice)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://www.thedentalpracticesf.com",
  "user_prompt": "Does this dental practice use or mention any of the following: {competitor_1}, {competitor_2}, {competitor_3}? Also check for any similar scheduling tools in the page content, footer, or embedded widgets."
}'
```

**User:** "Which dental practices in Denver are hiring receptionists?"
```bash
# Go straight to intent signals
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dental practices hiring receptionist or front desk in Denver Colorado, list the practice name, job title, and salary",
  "num_results": 10
}'

# Then enrich those specific practices
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://denverdental.com",
  "user_prompt": "Extract the names and roles of all staff. Identify the practice owner or office manager. Extract email addresses and phone numbers."
}'
```

**User:** "Build a prospect list of 50 dental practices in Austin TX"
```bash
# Scale up with neighborhood searches (run all in parallel)
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in Downtown Austin Texas with practice name, phone, email, address, website",
  "num_results": 10
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in South Austin Texas with practice name, phone, email, address, website",
  "num_results": 10
}'

curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/searchscraper"}'
  "user_prompt": "dentists in North Austin Texas with practice name, phone, email, address, website",
  "num_results": 10
}'

# ... continue for Round Rock, Cedar Park, East Austin, West Austin, etc.
```

## Error Handling

- **Smartscraper 422 on /about path** — Some websites return 422 when you append paths like `/about`. Fall back to scraping the homepage URL (no path) which almost always works
- **Website has no team/about page** — Scrape the homepage. Many solo practices list the dentist's name on the homepage
- **Hunter returns null for decision maker** — Expected for small practice domains. Use the practice's general email (info@, office@) as fallback and note the decision maker's name so the sales rep can ask for them by name
- **Fiber people-search returns 400** — Known issue. Do not rely on Fiber people-search or job-search with filter params. Use Scrapegraph smartscraper for decision makers and Scrapegraph searchscraper for job posting signals instead
- **No hiring signal found** — Not every city will have dental practices actively posting receptionist jobs. This just means fewer high-priority signals, not that the prospects are bad

## Tips

- **Website team pages are the #1 source for decision makers** — In testing, scraping the About/Team page found the owner or office manager on 5/5 practice websites. This is far more reliable than LinkedIn-based people search for small dental practices
- **Scrapegraph searchscraper is the workhorse** — Use it for finding practices AND for finding which practices are hiring receptionists. In testing it returned 57 practices and 11 hiring signals in separate single calls
- **Combine decision maker name + practice phone** — Even if you can't find a personal email, knowing the decision maker's name + calling the practice phone is a strong outreach combo. "Hi, can I speak with Rosie Franco, your office manager?" beats a cold call to the front desk
- **Job postings are the strongest intent signal** — A practice actively hiring indicates growth or staffing challenges — both make them receptive to new solutions. Cross-reference hiring practices with your prospect list for instant high-priority leads
- **Competitive intel from websites is imperfect** — "No competing solution detected" means nothing was visible on the website — not that they definitely don't have one. Note this caveat in results
- **Tailor competitive intel to what you're selling** — The smartscraper prompt should check for tools in your product category specifically. A broad prompt works as a default, but a targeted prompt yields more actionable results
- **Practice size matters** — Solo practices and small groups (2-5 dentists) are the sweet spot. Very large dental chains (Western Dental, Pacific Dental Services) have enterprise procurement. Filter these out
- **Scrape the homepage, not subpages** — When extracting decision maker info, scraping the homepage works more reliably than trying specific paths (/about, /team) which sometimes 422. The homepage usually mentions the lead dentist(s)
- **Phone numbers have ~100% coverage** — Every practice has a phone. Decision maker personal emails are rare (~20-30%). Practice general emails (info@, office@) are findable ~50-60% of the time
- **Search by neighborhood to scale up** — Break the city into neighborhoods and run parallel searches. For San Francisco, 8-10 neighborhoods can yield 100+ unique practices
- **Filter out clinics and dental schools** — Scrapegraph sometimes returns community health centers, university dental clinics, and public health dentists. Filter these out — they're not buying commercial software
