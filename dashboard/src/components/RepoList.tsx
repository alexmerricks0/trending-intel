import type { CategoryItem } from '../api';

interface RepoListProps {
  categories: Record<string, CategoryItem[]>;
  loading?: boolean;
}

export function RepoList({ categories, loading }: RepoListProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-4 w-32 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-raised rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const allRepos = Object.entries(categories).flatMap(([category, items]) =>
    items.map((item) => ({ ...item, category })),
  );
  allRepos.sort((a, b) => b.significance - a.significance);

  if (allRepos.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-dim mb-4 flex items-center gap-3">
        All Repos ({allRepos.length})
        <span className="flex-1 h-px bg-border" />
      </h2>

      <div className="space-y-2">
        {allRepos.map((item) => (
          <div
            key={item.repo}
            className="bg-surface border border-border rounded-lg px-4 py-3 flex items-start gap-4 hover:border-border-accent transition-colors"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < item.significance ? 'bg-accent' : 'bg-border-accent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://github.com/${item.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-text hover:text-accent transition-colors"
                >
                  {item.repo}
                </a>
                <span className="font-mono text-xs text-text-dim bg-surface-raised px-2 py-0.5 rounded border border-border">
                  {item.category}
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-1 line-clamp-1">
                {item.summary}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
