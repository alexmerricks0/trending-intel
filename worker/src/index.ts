/**
 * Trending Intel Worker
 * Cron-triggered GitHub trending analysis with Claude AI
 * Serves API for the public dashboard
 */

import { fetchTrendingRepos } from './github';
import { analyzeTrending, type AnalysisResult } from './claude';

export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  GITHUB_TOKEN: string;
  ALLOWED_ORIGINS: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (allowedOrigins.includes(origin) || env.ENVIRONMENT === 'development') {
      corsHeaders['Access-Control-Allow-Origin'] = origin || '*';
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    let response: Response;

    try {
      switch (true) {
        case url.pathname === '/api/health':
          response = jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
          break;

        case url.pathname === '/api/today':
          response = await getToday(env);
          break;

        case url.pathname.startsWith('/api/date/'):
          response = await getByDate(url, env);
          break;

        case url.pathname === '/api/history':
          response = await getHistory(url, env);
          break;

        case url.pathname === '/api/trigger' && env.ENVIRONMENT === 'development':
          await runAnalysis(env);
          response = jsonResponse({ status: 'triggered' });
          break;

        default:
          response = jsonResponse({ error: 'Not Found' }, 404);
      }
    } catch (error) {
      console.error('API Error:', error);
      response = jsonResponse({ error: 'Internal Server Error' }, 500);
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log('Cron triggered at', controller.scheduledTime);
    ctx.waitUntil(runAnalysis(env));
  },
};

// ============================================================================
// Core Analysis Pipeline
// ============================================================================

async function runAnalysis(env: Env): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  // Idempotency check
  const existing = await env.DB.prepare(
    'SELECT id FROM daily_analyses WHERE date = ?',
  ).bind(today).first();

  if (existing) {
    console.log(`Analysis for ${today} already exists, skipping`);
    return;
  }

  // Step 1: Fetch trending repos
  console.log('Fetching trending repos...');
  const repos = await fetchTrendingRepos(env.GITHUB_TOKEN);
  console.log(`Fetched ${repos.length} repos`);

  // Step 2: Analyze with Claude
  console.log('Analyzing with Claude...');
  const { analysis, tokensUsed } = await analyzeTrending(repos, env.ANTHROPIC_API_KEY);
  console.log(`Analysis complete, ${tokensUsed} tokens used`);

  // Step 3: Store analysis
  await env.DB.prepare(
    `INSERT INTO daily_analyses (date, trending_data, analysis, model, tokens_used)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(today, JSON.stringify(repos), JSON.stringify(analysis), 'haiku', tokensUsed)
    .run();

  // Step 4: Store individual repos
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  for (const category of Object.keys(analysis.categories)) {
    for (const item of analysis.categories[category]) {
      const repo = repos.find((r) => r.full_name === item.repo);
      if (!repo) continue;

      await env.DB.prepare(
        `INSERT OR IGNORE INTO trending_repos
           (date, repo_full_name, description, language, stars, forks, url, category, ai_summary, is_new)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          today,
          repo.full_name,
          repo.description || '',
          repo.language || '',
          repo.stargazers_count,
          repo.forks_count,
          repo.html_url,
          category,
          item.summary,
          repo.created_at > sevenDaysAgo ? 1 : 0,
        )
        .run();
    }
  }

  console.log(`Analysis for ${today} stored successfully`);
}

// ============================================================================
// API Route Handlers
// ============================================================================

async function getToday(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `SELECT date, analysis, tokens_used, created_at
     FROM daily_analyses ORDER BY date DESC LIMIT 1`,
  ).first<{ date: string; analysis: string; tokens_used: number; created_at: string }>();

  if (!result) {
    return jsonResponse({ error: 'No analysis available yet' }, 404);
  }

  return jsonResponse({
    date: result.date,
    analysis: JSON.parse(result.analysis),
    tokensUsed: result.tokens_used,
    createdAt: result.created_at,
  });
}

async function getByDate(url: URL, env: Env): Promise<Response> {
  const dateStr = url.pathname.replace('/api/date/', '');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return jsonResponse({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400);
  }

  const result = await env.DB.prepare(
    `SELECT date, analysis, tokens_used, created_at
     FROM daily_analyses WHERE date = ?`,
  ).bind(dateStr).first<{ date: string; analysis: string; tokens_used: number; created_at: string }>();

  if (!result) {
    return jsonResponse({ error: `No analysis for ${dateStr}` }, 404);
  }

  return jsonResponse({
    date: result.date,
    analysis: JSON.parse(result.analysis),
    tokensUsed: result.tokens_used,
    createdAt: result.created_at,
  });
}

async function getHistory(url: URL, env: Env): Promise<Response> {
  const daysParam = url.searchParams.get('days');
  const days = parseIntParam(daysParam, 30, 1, 365);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const results = await env.DB.prepare(
    `SELECT date, analysis, created_at
     FROM daily_analyses WHERE date >= ? ORDER BY date DESC`,
  ).bind(startDate).all<{ date: string; analysis: string; created_at: string }>();

  const data = (results.results || []).map((row) => {
    const analysis = JSON.parse(row.analysis) as AnalysisResult;
    return {
      date: row.date,
      headline: analysis.headline,
      pattern: analysis.pattern,
      categoryCount: Object.keys(analysis.categories).length,
      repoCount: Object.values(analysis.categories).flat().length,
    };
  });

  return jsonResponse({ data });
}

// ============================================================================
// Utilities
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseIntParam(value: string | null, defaultValue: number, min: number, max: number): number {
  if (value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
}
