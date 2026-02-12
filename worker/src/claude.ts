/**
 * AI analysis client
 * Raw fetch to OpenRouter API (OpenAI-compatible format)
 */

import type { GitHubRepo } from './github';

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

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function analyzeTrending(
  repos: GitHubRepo[],
  apiKey: string,
): Promise<{ analysis: AnalysisResult; tokensUsed: number }> {
  const repoSummary = repos
    .map(
      (r) =>
        `- ${r.full_name} (${r.language || 'unknown'}, ${r.stargazers_count} stars, ${r.forks_count} forks): ${r.description || 'No description'}`,
    )
    .join('\n');

  const systemPrompt = `You are an expert software industry analyst. Analyze today's GitHub trending repositories and produce a structured JSON report. Be concise, insightful, and opinionated. Focus on what matters to professional developers.`;

  const userPrompt = `Here are today's trending GitHub repositories:

${repoSummary}

Analyze these repos and output ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "headline": "One sentence capturing today's biggest theme",
  "categories": {
    "AI/ML": [{ "repo": "owner/name", "summary": "One-line insight", "significance": 1-5 }],
    "Web": [...],
    "DevTools": [...],
    "Infrastructure": [...],
    "Security": [...],
    "Data": [...],
    "Other": [...]
  },
  "notable": [
    { "repo": "owner/name", "why": "2-sentence explanation of why this matters" }
  ],
  "pattern": "Any emerging theme across today's repos"
}

Rules:
- Every repo must appear in exactly one category
- Include 2-3 notable picks maximum
- significance is 1-5 (5 = most significant)
- Empty categories should be omitted
- Be direct and opinionated in summaries`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://trending.lfxai.dev',
      'X-Title': 'Trending Intel',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data: OpenRouterResponse = await response.json();
  const text = data.choices[0].message.content;
  const tokensUsed = data.usage.total_tokens;

  // Parse JSON, handling potential markdown wrapping
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const analysis: AnalysisResult = JSON.parse(jsonText);

  return { analysis, tokensUsed };
}
