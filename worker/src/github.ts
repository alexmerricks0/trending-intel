/**
 * GitHub Search API client
 * Fetches trending repositories using two complementary queries
 */

export interface GitHubRepo {
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  created_at: string;
  pushed_at: string;
  topics: string[];
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export async function fetchTrendingRepos(token: string): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'trending-intel-worker',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Query 1: New repos gaining traction (created in last 7 days, sorted by stars)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const url1 = `https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>${sevenDaysAgo} stars:>10`)}&sort=stars&order=desc&per_page=30`;

  // Query 2: Active popular repos (pushed recently, already popular)
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);
  const url2 = `https://api.github.com/search/repositories?q=${encodeURIComponent(`pushed:>${yesterday} stars:>500`)}&sort=stars&order=desc&per_page=30`;

  const [response1, response2] = await Promise.all([
    fetch(url1, { headers }),
    fetch(url2, { headers }),
  ]);

  if (!response1.ok || !response2.ok) {
    const err1 = response1.ok ? '' : `Query1: ${response1.status}`;
    const err2 = response2.ok ? '' : `Query2: ${response2.status}`;
    throw new Error(`GitHub API error: ${err1} ${err2}`.trim());
  }

  const data1: GitHubSearchResponse = await response1.json();
  const data2: GitHubSearchResponse = await response2.json();

  // Deduplicate by full_name, preferring query1 (newer repos)
  const seen = new Set<string>();
  const combined: GitHubRepo[] = [];

  for (const repo of [...data1.items, ...data2.items]) {
    if (!seen.has(repo.full_name)) {
      seen.add(repo.full_name);
      combined.push(repo);
    }
  }

  return combined;
}
