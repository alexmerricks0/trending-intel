import type { NotableItem } from '../api';

interface NotablePicksProps {
  notable: NotableItem[];
  loading?: boolean;
}

export function NotablePicks({ notable, loading }: NotablePicksProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-4 w-32 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="h-24 bg-surface-raised rounded animate-pulse" />
      </div>
    );
  }

  if (notable.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-dim mb-4 flex items-center gap-3">
        Notable Picks
        <span className="flex-1 h-px bg-border" />
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notable.map((item) => (
          <div
            key={item.repo}
            className="bg-surface border border-border rounded-xl p-5 hover:border-border-accent transition-colors"
          >
            <a
              href={`https://github.com/${item.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-accent hover:underline"
            >
              {item.repo}
            </a>
            <p className="text-text-secondary text-sm mt-2 leading-relaxed">
              {item.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
