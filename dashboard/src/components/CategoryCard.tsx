import type { CategoryItem } from '../api';

interface CategoryCardProps {
  category: string;
  items: CategoryItem[];
  loading?: boolean;
}

export function CategoryCard({ category, items, loading }: CategoryCardProps) {
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 animate-pulse">
        <div className="h-4 w-20 bg-surface-raised rounded mb-4" />
        <div className="h-6 w-8 bg-surface-raised rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-surface-raised rounded" />
          <div className="h-3 w-3/4 bg-surface-raised rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-border-accent transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-xs uppercase tracking-wider text-text-dim">
          {category}
        </h3>
      </div>

      <p className="font-display text-2xl font-bold text-accent mb-3">
        {items.length}
      </p>

      <ul className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item.repo} className="text-sm">
            <a
              href={`https://github.com/${item.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-text hover:text-accent transition-colors"
            >
              {item.repo}
            </a>
            <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">
              {item.summary}
            </p>
          </li>
        ))}
        {items.length > 3 && (
          <li className="text-xs text-text-dim font-mono">
            +{items.length - 3} more
          </li>
        )}
      </ul>
    </div>
  );
}
