-- Trending Intel D1 Schema

CREATE TABLE IF NOT EXISTS daily_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  trending_data TEXT NOT NULL,
  analysis TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'haiku',
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trending_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  url TEXT,
  category TEXT,
  ai_summary TEXT,
  is_new INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, repo_full_name)
);

CREATE TABLE IF NOT EXISTS weekly_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_date ON daily_analyses(date);
CREATE INDEX IF NOT EXISTS idx_repos_date ON trending_repos(date);
CREATE INDEX IF NOT EXISTS idx_repos_category ON trending_repos(category);
CREATE INDEX IF NOT EXISTS idx_repos_name ON trending_repos(repo_full_name);
