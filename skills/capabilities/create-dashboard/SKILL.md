---
name: create-dashboard
description: >
  Create a custom web dashboard (React + Vite + Express) inside your sandbox to visualize
  the agent's Turso database. The dashboard is served on port 3847 and the user sees it
  live in the "App" tab in Gooseworks. Use when the user asks for a dashboard,
  visualization, chart, metric view, or any custom UI powered by their agent's data.
tags: [dashboard, visualization, frontend]
---

You are helping the user build a custom dashboard from a starter template. The dashboard lives in the sandbox, is served on port 3847 by a single Express process (which also serves the React SPA — no CORS), and is viewable in the Gooseworks "App" tab.

**Single-port rule — never violate this.**
Express serves both the built SPA (`dist/public/`) and all `/api/*` routes on port 3847. Sandbox preview URLs give each port its own subdomain, so running the frontend and backend on separate ports would break with CORS. Never add a Vite dev server. Only build + serve.

---

## Step 1 — Detect state

Figure out what's already there before doing anything:

```bash
ls -la /home/daytona/dashboard 2>/dev/null || echo "NO_DASHBOARD"
ls -la /home/daytona/workspace/dashboard-src 2>/dev/null || echo "NO_MIRROR"
```

Four possible states:

| `/home/daytona/dashboard` | `/home/daytona/workspace/dashboard-src` | What to do |
|---|---|---|
| exists with `node_modules` | anything | Skip to **Step 3** (Customize) |
| missing | exists | Go to **Step 2b** (Restore) |
| missing | missing | Go to **Step 2a** (Fresh setup) |
| exists but no `node_modules` | anything | Run `npm install` then go to Step 3 |

---

## Step 2a — Fresh setup (first time for this agent)

Clone the template repo and install dependencies:

```bash
git clone --depth 1 https://github.com/gooseworks-ai/dashboard-template.git /home/daytona/dashboard
cd /home/daytona/dashboard
rm -rf .git
npm install
```

**If the clone fails** (repo not yet public), the template is bundled in the agent's toolchain — ask the user to check back once the repo is live, or manually scaffold from memory using the file layout in Step 4.

---

## Step 2b — Restore from mirror (after sandbox restart)

The agent's source lives in S3 at `/home/daytona/workspace/dashboard-src/`. Rehydrate it:

```bash
mkdir -p /home/daytona/dashboard
cp -r /home/daytona/workspace/dashboard-src/. /home/daytona/dashboard/
cd /home/daytona/dashboard
npm install
npx vite build
pkill -f "node server.js" || true
node server.js > /tmp/dashboard.log 2>&1 &
```

Verify it's up: `curl -s http://localhost:3847/api/health`. Then tell the user "Your dashboard is back up." Done.

---

## Step 3 — Understand what the user wants

Before writing any code:

1. **Ask** what they want to see if it's not obvious. Examples:
   - "A sales dashboard with MRR, new deals this week, and a pipeline chart"
   - "Churn by cohort"
   - "Campaign performance: opens, clicks, replies"
2. **Check what data exists** using the `query_database` MCP tool:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
   ```
   Then for each relevant table, look at its columns with `PRAGMA table_info(<table>)`.
3. **Confirm the plan** with the user before coding if the request is vague. One sentence: "I'll add a Revenue page with MRR and a weekly trend chart using `deals` and `payments`. Sound good?"

---

## Step 4 — Customize the template

The template layout:

```
/home/daytona/dashboard/
├── server.js                  ← Express: /api/query + static SPA on port 3847
├── src/
│   ├── App.tsx                ← add routes here
│   ├── pages/Overview.tsx     ← default landing page
│   ├── pages/...              ← add one file per page
│   └── components/
│       ├── Layout.tsx         ← sidebar nav — add NavLinks here for new pages
│       ├── MetricCard.tsx
│       └── Chart.tsx          ← recharts LineChart wrapper
└── src/lib/api.ts             ← runQuery() helper that calls /api/query
```

**For each page the user needs:**
1. Create `src/pages/<Name>.tsx`. Use `runQuery("SELECT ...")` from `src/lib/api.ts` to fetch data. Compose `MetricCard` + `Chart` + plain JSX.
2. Add the route in `src/App.tsx`.
3. Add a `NavLink` in `src/components/Layout.tsx`.

**For specialized queries** where a raw `SELECT` is awkward (aggregations, joins, parameterized queries), add a dedicated `/api/*` route in `server.js` and fetch it from the page. Keep these endpoints read-only — no writes from the dashboard.

**Style rules** (match the stone palette, match Gooseworks aesthetic):
- Stone palette only — `text-stone-500`, `border-stone-200`, `bg-stone-50`. No gray/zinc/slate.
- `font-normal` default, `text-xs` or `text-sm` preferred.
- `shadow-none`, minimal borders.
- Recharts with `stroke="#44403c"` (stone-700) and `stroke="#f5f5f4"` for grid.

---

## Step 5 — Build and serve

```bash
cd /home/daytona/dashboard
npx vite build
pkill -f "node server.js" || true
node server.js > /tmp/dashboard.log 2>&1 &
sleep 1
curl -s http://localhost:3847/api/health
```

If the health check returns `{"ok":true,"db":true}`, you're live. If `"db":false`, the sandbox is missing `AGENT_DB_URL` / `AGENT_DB_TOKEN` — tell the user and stop; they may need to enable an agent database first.

---

## Step 6 — Persist source to S3

Without this, the dashboard disappears on sandbox restart. Only mirror the source files — never `node_modules` or `dist`:

```bash
mkdir -p /home/daytona/workspace/dashboard-src
rsync -a --delete \
  --exclude node_modules --exclude dist --exclude .git \
  /home/daytona/dashboard/ /home/daytona/workspace/dashboard-src/
```

---

## Step 7 — Tell the user

Close with something like:

> Your dashboard is live. Open the **App** tab in the Gooseworks sidebar to see it. It auto-refreshes when I make changes — just tell me what to add, remove, or tweak.

---

## Iteration loop (what to do when the user asks for changes)

When the user asks for a change ("add a churn chart", "make the title bigger", "show only last 30 days"):

1. Edit the relevant files in `/home/daytona/dashboard/src/` (and `server.js` only if the query is new and complex).
2. Rebuild + restart:
   ```bash
   cd /home/daytona/dashboard
   npx vite build
   pkill -f "node server.js" || true
   node server.js > /tmp/dashboard.log 2>&1 &
   ```
3. Mirror back to S3 (Step 6).
4. Tell the user "Done — the App tab will refresh shortly."

The iframe in the App tab reloads automatically after your message completes. Never ask the user to hit refresh.

---

## Safety & correctness checklist

- ✅ Single port 3847. Express serves both SPA and API.
- ✅ No Vite dev server. Only `vite build`.
- ✅ Dashboard lives at `/home/daytona/dashboard/` — **outside** the S3 FUSE mount at `/home/daytona/workspace/`. Do not put `node_modules` inside the mount.
- ✅ Source mirrored to `/home/daytona/workspace/dashboard-src/` for restart persistence.
- ✅ Read-only queries. Do not expose write endpoints. The dashboard is for visualization.
- ✅ Stone palette, minimal borders, `font-normal`, `text-xs`/`text-sm`.
- ✅ Kill the old server before starting a new one (`pkill -f "node server.js"`). Don't leave zombies.
