# Trending Intel — Implementation Plan

## Overview

Daily AI-powered GitHub trending analysis. A Cloudflare Worker runs on a cron schedule, fetches trending repos from GitHub, sends them to Claude for categorization and insight generation, stores the analysis in D1, and serves it via a public dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare Worker (trending-intel-worker)           │
│                                                      │
│  Cron Trigger (06:00 UTC daily)                      │
│    ├── 1. Fetch GitHub trending (today + this week)  │
│    ├── 2. Send to Claude Haiku for analysis          │
│    ├── 3. Store structured result in D1              │
│    └── 4. Done                                       │
│                                                      │
│  API Routes (serves dashboard)                       │
│    ├── GET /api/today        → today's analysis      │
│    ├── GET /api/history      → past 30 days          │
│    ├── GET /api/weekly       → weekly summary         │
│    └── GET /api/health       → health check          │
└─────────────────────────────────────────────────────┘
         ↕                          ↕
    D1 Database              Cloudflare Pages
  (trending-intel-db)      (trending.lfxai.dev)
```

## Phase 1: Worker + D1 (Backend)

### 1.1 D1 Schema (`schema.sql`)

```sql
-- Daily analysis records
CREATE TABLE IF NOT EXISTS daily_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,          -- '2026-02-12'
  trending_data TEXT NOT NULL,         -- raw JSON from GitHub
  analysis TEXT NOT NULL,              -- Claude's structured analysis (JSON)
  model TEXT NOT NULL DEFAULT 'haiku', -- which Claude model was used
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Individual trending repos (denormalized for querying)
CREATE TABLE IF NOT EXISTS trending_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stars_today INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  category TEXT,                       -- AI/ML, Web, DevTools, Infra, etc.
  ai_summary TEXT,                     -- Claude's one-line take
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, repo_name)
);

-- Weekly summaries (generated from daily data)
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,     -- '2026-02-10' (Monday)
  summary TEXT NOT NULL,               -- Claude's weekly analysis (JSON)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_date ON daily_analyses(date);
CREATE INDEX IF NOT EXISTS idx_repos_date ON trending_repos(date);
CREATE INDEX IF NOT EXISTS idx_repos_category ON trending_repos(category);
```

### 1.2 Worker Cron Job

**Data source:** GitHub trending page (no official API — scrape or use unofficial endpoints)
- Option A: `https://api.gitterapp.com/repositories?since=daily` (unofficial)
- Option B: Scrape `https://github.com/trending` HTML
- Option C: Use GitHub Search API sorted by stars created recently

**Recommended: Option C** — GitHub Search API is official, reliable, free with token:
```
GET https://api.github.com/search/repositories?q=created:>2026-02-11&sort=stars&order=desc&per_page=30
```

**Claude prompt structure:**
```
You are analyzing today's GitHub trending repositories. Categorize each repo,
write a one-line insight, and produce a daily briefing.

Categories: AI/ML, Web Framework, DevTools, Infrastructure, Security, Data, Mobile, Other

Output JSON with:
- categories: { [category]: [repos with summaries] }
- headline: one sentence summary of today's trends
- notable: 2-3 repos worth watching and why
- pattern: any emerging pattern across repos
```

### 1.3 Worker API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/today` | GET | Today's analysis (or most recent) |
| `/api/history?days=30` | GET | Past N days of analyses |
| `/api/weekly` | GET | Current week summary |
| `/api/repo/:name` | GET | Tracking history for a specific repo |
| `/api/health` | GET | Health check |

### 1.4 Wrangler Config

```toml
name = "trending-intel-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[triggers]
crons = ["0 6 * * *"]  # Daily at 06:00 UTC

[env.production]
d1_databases = [
  { binding = "DB", database_name = "trending-intel-db", database_id = "TBD" }
]
```

## Phase 2: Dashboard (Frontend)

### 2.1 Pages Setup

React + Vite + TypeScript + Tailwind. Same design system as lfxai.dev.

### 2.2 Dashboard Sections

1. **Header** — "Trending Intel" + date + nav
2. **Today's Headline** — AI-generated one-liner about today's trends
3. **Category Grid** — Cards for each category (AI/ML, Web, DevTools, etc.) with repo counts
4. **Trending List** — Full list of today's trending repos with:
   - Repo name + link
   - Stars gained today
   - Language badge
   - Category tag
   - AI one-line summary
5. **Notable Picks** — 2-3 highlighted repos with longer analysis
6. **Weekly Trend** — Chart showing category distribution over the past week
7. **Archive** — Browse past days

### 2.3 Design

- Dark theme matching lfxai.dev
- Gold accent for highlights and stats
- Mono font for repo names and stats
- Category color coding (subtle, not rainbow)
- Mobile responsive

## Phase 3: Deploy + Domain

1. Create D1 database: `wrangler d1 create trending-intel-db`
2. Run migrations: `wrangler d1 execute trending-intel-db --file=schema.sql`
3. Set secrets: `wrangler secret put ANTHROPIC_API_KEY` + `wrangler secret put GITHUB_TOKEN`
4. Deploy worker: `wrangler deploy --env production`
5. Deploy dashboard: `wrangler pages deploy dist --project-name=trending-intel`
6. Add CNAME: `trending` → `trending-intel.pages.dev` on Cloudflare DNS for lfxai.dev
7. Trigger first cron manually to seed data

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| Workers (1 cron/day + API calls) | Free tier |
| D1 (< 1MB) | Free tier |
| Pages | Free tier |
| Claude Haiku (~1 call/day, ~2k tokens) | ~$0.15/month |
| GitHub API (30 requests/day) | Free |
| **Total** | **~$0.15/month** |

## Build Order

1. `schema.sql` — database schema
2. `worker/` — cron job + API routes
3. Test cron locally with `wrangler dev --test-scheduled`
4. `dashboard/` — React frontend
5. Deploy everything
6. Set up subdomain
