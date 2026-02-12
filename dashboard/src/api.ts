const API_BASE = (() => {
  const url = import.meta.env.VITE_API_URL;
  if (url) return url;
  if (import.meta.env.DEV) return 'http://localhost:8787';
  console.error('VITE_API_URL must be set in production builds');
  return '';
})();

export interface CategoryItem {
  repo: string;
  summary: string;
  significance: number;
}

export interface NotableItem {
  repo: string;
  why: string;
}

export interface AnalysisResult {
  headline: string;
  categories: Record<string, CategoryItem[]>;
  notable: NotableItem[];
  pattern: string;
}

export interface DailyAnalysis {
  date: string;
  analysis: AnalysisResult;
  tokensUsed: number;
  createdAt: string;
}

export interface HistoryItem {
  date: string;
  headline: string;
  pattern: string;
  categoryCount: number;
  repoCount: number;
}

export async function fetchToday(): Promise<DailyAnalysis> {
  const res = await fetch(`${API_BASE}/api/today`);
  if (!res.ok) throw new Error("Failed to fetch today's analysis");
  return res.json();
}

export async function fetchByDate(date: string): Promise<DailyAnalysis> {
  const res = await fetch(`${API_BASE}/api/date/${date}`);
  if (!res.ok) throw new Error(`Failed to fetch analysis for ${date}`);
  return res.json();
}

export async function fetchHistory(days = 30): Promise<{ data: HistoryItem[] }> {
  const res = await fetch(`${API_BASE}/api/history?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}
