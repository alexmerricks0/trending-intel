# CLAUDE.md — Trending Intel

## Project Overview

AI-powered GitHub trending analysis. A Cloudflare Worker runs daily via Cron Trigger, fetches GitHub trending repos, sends them to Claude for categorization and analysis, stores results in D1, and serves a public dashboard via Cloudflare Pages.

**Live at:** `trending.lfxai.dev`

## Architecture

```
Cron Trigger (daily) → Worker → GitHub API → Claude API → D1 → Dashboard (Pages)
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Worker | `worker/` | Cron-triggered agent: fetches GitHub trending, calls Claude for analysis, stores in D1, serves API |
| Dashboard | `dashboard/` | React frontend displaying daily/weekly trending analysis |
| Schema | `schema.sql` | D1 database schema |

## Tech Stack

- **Cloudflare Workers** — Cron Trigger + API
- **Cloudflare D1** — SQLite storage for daily analyses
- **Cloudflare Pages** — Dashboard hosting
- **Claude API** — AI analysis (Haiku for cost efficiency)
- **React + Vite + TypeScript** — Frontend
- **Tailwind CSS** — Styling

## Key Facts

- **Repo:** `~/Business/trending-intel/`
- **GitHub:** `alexmerricks0/trending-intel` (public)
- **Hosting:** Cloudflare Pages + Workers
- **Domain:** `trending.lfxai.dev`
- **Cron Schedule:** Daily at 06:00 UTC
- **License:** MIT

## Design System

Matches lfxai.dev:
- Background: `#0a0a0a`
- Accent: `#c9a227`
- Fonts: Bricolage Grotesque / DM Sans / JetBrains Mono

## Important Notes

- Claude API key stored via `wrangler secret put ANTHROPIC_API_KEY`
- GitHub API token (optional, for higher rate limits) via `wrangler secret put GITHUB_TOKEN`
- Use Haiku model to minimize API costs
- All data is public — no auth required on dashboard
- CORS should allow the Pages domain
