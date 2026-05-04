---
name: fiber-contact-reveal
description: Reveal work emails, personal emails, and phone numbers from LinkedIn profiles using Fiber AI. Three tiers (standard, turbo, exhaustive) plus batch mode for up to 2000 people.
source: orthogonal
---


# Fiber AI - Contact Details Reveal

Reveal verified work emails, personal emails, and phone numbers for any LinkedIn profile. Choose from three speed/coverage tiers or use batch mode for lists.

## Cost Reference

Standard (`/v1/contact-details/single`) — best balance of speed, cost, coverage. Timeout: 2 min.

| Data requested | Cost |
|----------------|------|
| All emails + phone numbers | **$0.10** |
| Work email only | **$0.04** |
| Personal email only | **$0.04** |
| All emails (work + personal) | **$0.06** |
| Phone only | **$0.06** |

Turbo (`/v1/contact-details/turbo/sync`) — fastest, premium enrichment stack. Timeout: 90 sec. **1.4x standard cost.**

| Data requested | Cost |
|----------------|------|
| All emails + phone numbers | **$0.14** |
| Work email only | **$0.06** |
| Personal email only | **$0.06** |
| All emails (work + personal) | **$0.10** |
| Phone only | **$0.10** |

Exhaustive (`/v1/contact-details/exhaustive/start`) — maximum coverage, async. **~2.4x standard cost.**

| Data requested | Cost |
|----------------|------|
| All emails + phone numbers | **$0.24** |
| Work email only | **$0.10** |
| Personal email only | **$0.10** |
| All emails (work + personal) | **$0.18** |
| Phone only | **$0.08** |

Batch (`/v1/contact-details/batch/start`) — up to 2000 people, async. **Same per-person cost as standard.**

Partial reveals only bill for delivered data. Undelivered data is refunded.

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`

Reveal contact details for people from their LinkedIn profiles. Four tiers optimized for different speed, coverage, and cost tradeoffs.

## Capabilities

- **Standard contact reveal**: Best balance of speed, cost, and coverage. Synchronous, returns in under 2 minutes.
- **Turbo contact reveal**: Fastest option using premium enrichment stack. Synchronous, returns in under 90 seconds. Higher cost.
- **Exhaustive contact reveal**: Maximum coverage. Runs all waterfall steps in parallel. Asynchronous (start then poll). Returns the most emails and phone numbers on average.
- **Batch contact reveal**: Process up to 2000 people at once. Asynchronous (start then poll). Same pricing as standard per person.

## Usage

### Standard contact reveal (recommended default)

Best balance of speed, cost, and coverage. Use this unless you have a specific reason to choose another tier.

Parameters:
- linkedinUrl* (string) - LinkedIn profile URL or slug (e.g. 'https://www.linkedin.com/in/williamhgates' or 'williamhgates')
- enrichmentType (object) - Which contact types to request. Default: all enabled.
  - getWorkEmails (boolean, default true)
  - getPersonalEmails (boolean, default true)
  - getPhoneNumbers (boolean, default true)
- validateEmails (boolean, default true) - Whether to bounce-validate emails before returning. Disabling speeds up response. No additional cost.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/single","body":{"linkedinUrl":"https://www.linkedin.com/in/williamhgates","enrichmentType":{"getWorkEmails":true,"getPersonalEmails":true,"getPhoneNumbers":true},"validateEmails":true}}'
```

Response contains:
- `output.profile.emails` - Array of objects with `email`, `type` (work/personal/other), `status` (valid/risky/unknown/invalid)
- `output.profile.phoneNumbers` - Array of objects with `number`, `type` (mobile/other/unknown)
- `output.profile.status` - One of: started, live-enriching, grabbing-contact-info, completed, failed
- `chargeInfo.creditsCharged` - Credits used for this request

To get only work emails (saves cost):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/single","body":{"linkedinUrl":"https://www.linkedin.com/in/williamhgates","enrichmentType":{"getWorkEmails":true,"getPersonalEmails":false,"getPhoneNumbers":false}}}'
```

### Turbo contact reveal

Fastest option. Uses a premium enrichment stack for lowest latency. Higher cost.

Parameters:
- linkedinUrl* (string) - LinkedIn profile URL or slug
- enrichmentType (object) - Same as standard

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/turbo/sync","body":{"linkedinUrl":"https://www.linkedin.com/in/williamhgates","enrichmentType":{"getWorkEmails":true,"getPersonalEmails":true,"getPhoneNumbers":true}}}'
```

Response format is identical to standard.

### Exhaustive contact reveal (async - start then poll)

Maximum coverage. Runs all waterfall steps in parallel. Returns more emails and phone numbers on average than standard or turbo.

**Step 1: Start the exhaustive reveal**

Parameters:
- linkedinUrl* (string) - LinkedIn profile URL or slug
- enrichmentType (object) - Same as standard

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/exhaustive/start","body":{"linkedinUrl":"https://www.linkedin.com/in/williamhgates","enrichmentType":{"getWorkEmails":true,"getPersonalEmails":true,"getPhoneNumbers":true}}}'
```

Response returns a `taskId`:
```json
{"output": {"taskId": "task_abc123"}}
```

**Step 2: Poll for results**

Wait 10-30 seconds, then poll. Repeat until `output.done` is true.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/exhaustive/poll","body":{"taskId":"task_abc123"}}'
```

When `output.done` is true, the response contains the same `output.profile.emails` and `output.profile.phoneNumbers` arrays as the synchronous endpoints.

### Batch contact reveal (async - up to 2000 people)

Process a list of LinkedIn profiles at once. Same pricing as standard per person. Duplicates are automatically skipped.

**Step 1: Start the batch**

Parameters:
- personDetails* (array) - Array of objects, each with a `linkedinUrl.value` field
- enrichmentTypes (object) - Same structure as enrichmentType above

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/batch/start","body":{"personDetails":[{"linkedinUrl":{"value":"https://www.linkedin.com/in/person1"}},{"linkedinUrl":{"value":"https://www.linkedin.com/in/person2"}},{"linkedinUrl":{"value":"https://www.linkedin.com/in/person3"}}],"enrichmentTypes":{"getWorkEmails":true,"getPersonalEmails":true,"getPhoneNumbers":true}}}'
```

Response:
```json
{"output": {"taskId": "batch_abc123", "numPeopleEnqueued": 3, "numDuplicatesSkipped": 0}}
```

**Step 2: Poll for results**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/contact-details/batch/poll","body":{"taskId":"batch_abc123"}}'
```

Poll every 15-30 seconds until complete. Results contain per-person contact details.

## Use Cases

1. **Sales outreach**: Find work emails for a list of target prospects from LinkedIn
2. **Recruiting**: Get personal emails and phone numbers for passive candidates
3. **Account-based marketing**: Batch-reveal contact details for all decision-makers at target accounts
4. **Lead enrichment**: Add verified contact info to existing lead lists that only have LinkedIn URLs

## Tips

- **Choosing a tier**: Single person, need it now? Use Standard (cheapest) or Turbo (fastest). Need maximum coverage? Use Exhaustive. List of 2+ people? Use Batch.
- Always prefer Standard over Turbo unless latency is critical (saves $0.04-0.10 per person)
- Use `enrichmentType` to request only what you need: work-email-only costs $0.04 vs $0.10 for everything
- For lists of 5+ people, use Batch mode instead of looping Standard calls (same cost, better throughput)
- The `validateEmails` flag on Standard has no extra cost but adds latency. Disable if you validate emails separately downstream
- Canonical LinkedIn URLs (with /in/ prefix) give best match quality
