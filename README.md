# Trending Intel

AI-powered daily analysis of GitHub's trending repositories. A Cloudflare Worker fetches trending repos each morning, sends them to Claude for categorization and insight, stores the results in D1, and serves them through a public dashboard.

**Live at [trending.lfxai.dev](https://trending.lfxai.dev)**

## How It Works

```
Cron (06:00 UTC) → GitHub Search API → Claude Haiku → D1 → Dashboard
```

1. **Fetch** — Two parallel GitHub Search API queries discover new hot repos and active popular repos
2. **Analyze** — Claude Haiku categorizes each repo (AI/ML, Web, DevTools, Infrastructure, Security, Data) and generates a daily briefing
3. **Store** — Structured analysis is persisted in Cloudflare D1
4. **Serve** — React dashboard displays today's analysis with archive browsing

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite at edge) |
| AI | Claude Haiku via OpenRouter |
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Hosting | Cloudflare Pages |
| Data | SWR with 5-minute refresh |

## Project Structure

```
├── worker/
│   ├── src/
│   │   ├── index.ts      # Worker entry, API routes, cron handler
│   │   ├── github.ts     # GitHub Search API client
│   │   └── claude.ts     # AI analysis via OpenRouter
│   └── wrangler.toml     # Worker + D1 + cron config
├── dashboard/
│   ├── src/
│   │   ├── App.tsx        # Main app with view routing
│   │   ├── api.ts         # Typed API client
│   │   └── components/    # Header, CategoryCard, RepoList, etc.
│   └── tailwind.config.js # lfxai.dev design system
└── schema.sql             # D1 database schema
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/today` | Latest analysis |
| `GET /api/date/:date` | Analysis for a specific date (YYYY-MM-DD) |
| `GET /api/history?days=30` | Past analyses with headlines |
| `GET /api/health` | Health check |

## Local Development

```bash
# Worker
cd worker
cp .dev.vars.example .dev.vars  # Add your API keys
npm install
npx wrangler dev --test-scheduled

# Dashboard
cd dashboard
npm install
npm run dev
```

## Cost

Runs entirely on Cloudflare's free tier plus ~$0.15/month for Claude Haiku API calls.

## License

MIT
