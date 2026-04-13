---
name: orthogonal-weather-forecast
description: Get weather forecasts - temperature, precipitation, wind, and conditions
source: orthogonal
---


# Weather Forecast

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Get weather forecasts including temperature, precipitation, wind, and humidity for any location.

## When to Use

- User asks about weather
- User wants to know if it will rain
- User asks "what's the weather in [location]?"
- Planning outdoor activities
- Travel weather checks

## How It Works

Uses the Precip API to get weather data from meteorological sources.

## Usage

### Get Daily Forecast

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/daily","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2026-02-14","end":"2026-02-21"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/daily","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2026-02-14","end":"2026-02-21"}}'
```
</details>

### Get Hourly Forecast

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2026-02-14","end":"2026-02-15"}}'
```

### Get Temperature by Hour

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/temperature-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2026-02-14","end":"2026-02-15"}}'
```

### Get Recent Rain Data

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/recent-rain","query":{"latitude":"37.7749","longitude":"-122.4194"}}'
```

### Get Last 48 Hours

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/last-48","query":{"latitude":"37.7749","longitude":"-122.4194"}}'
```

## Parameters

- **latitude** (required) - Latitude (e.g., 37.7749)
- **longitude** (required) - Longitude (e.g., -122.4194)
- **start** (required for forecasts) - Start date (YYYY-MM-DD format)
- **end** (required for forecasts) - End date (YYYY-MM-DD format)

## Common Coordinates

- San Francisco: latitude=37.7749, longitude=-122.4194
- New York: latitude=40.7128, longitude=-74.0060
- Los Angeles: latitude=34.0522, longitude=-118.2437
- London: latitude=51.5074, longitude=-0.1278
- Tokyo: latitude=35.6762, longitude=139.6503

## Response

All endpoints return GeoJSON `FeatureCollection` with coordinates in `geometry` and weather data in `properties`.

### `/api/v1/daily` — properties.days[] array
- **precip** (number) - Total precipitation in mm
- **rain** / **snow** (number) - Rain and snow amounts in mm
- **precip_probability** (number|null) - Probability 0-100 (null for observations)
- **precip_type** (string) - `rain`, `snow`, `sleet`, or `freezing_rain`
- **startTime** (string) - ISO 8601 timestamp
- **source** (string) - `observation` or `forecast`

### `/api/v1/hourly` — properties.hours[] array
Same fields as daily, plus:
- **slr** (number) - Snow-to-liquid ratio

### `/api/v1/temperature-hourly` — properties.hours[] array
- **temperature** (number) - Temperature in °C
- **startTime** (string) - ISO 8601 timestamp

### `/api/v1/recent-rain` — properties (single object)
- **precip** (number) - Total precipitation in mm
- **rain** / **snow** / **sleet** / **freezing_rain** (number) - Breakdown by type in mm
- **precip_type** (string) - Dominant precipitation type
- **startTime** / **endTime** (string) - Time window of the observation
- **ago** (string) - Human-readable time since last data (e.g., "2 hours")
- **details** (string) - Data freshness note

### `/api/v1/last-48` — properties (single object)
- **precip** (number) - Total precipitation in last 48 hours in mm
- **rain** / **snow** / **sleet** / **freezing_rain** (number) - Breakdown by type in mm
- **precip_type** (string) - Dominant precipitation type
- **slr** (number) - Snow-to-liquid ratio
- **endTime** (string) - End of the 48-hour window

## Examples

**User:** "What's the weather in San Francisco this week?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/daily","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2026-02-14","end":"2026-02-21"}}'
```

**User:** "Will it rain in NYC tomorrow?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/hourly","query":{"latitude":"40.7128","longitude":"-74.0060","start":"2026-02-15","end":"2026-02-16"}}'
```

**User:** "How much rain fell in Seattle recently?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/recent-rain","query":{"latitude":"47.6062","longitude":"-122.3321"}}'
```

## Error Handling

- **400** - Missing required parameters (`latitude`, `longitude`, or date range for daily/hourly)
- **422** - Invalid date format — must be `YYYY-MM-DD`
- `precip_probability: null` means the data is from observations, not forecasts
- `source: "observation"` = historical data; `source: "forecast"` = predicted
- All precipitation values are in millimeters (mm), temperatures in Celsius (°C)

## Tips

- Convert city names to coordinates before calling
- Use current date for start, add days for end
- Date format must be YYYY-MM-DD
- recent-rain and last-48 don't need date parameters
