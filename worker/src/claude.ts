/**
 * Claude API client
 * Raw fetch to Anthropic Messages API (no SDK for smaller bundle)
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

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data: AnthropicResponse = await response.json();
  const text = data.content[0].text;
  const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

  // Parse JSON, handling potential markdown wrapping
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const analysis: AnalysisResult = JSON.parse(jsonText);

  return { analysis, tokensUsed };
}
