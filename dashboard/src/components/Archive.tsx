import type { HistoryItem } from '../api';

interface ArchiveProps {
  data: HistoryItem[];
  loading?: boolean;
  error?: Error;
  onDateSelect: (date: string) => void;
}

export function Archive({ data, loading, error, onDateSelect }: ArchiveProps) {
  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-display font-bold text-red-400 mb-2">
          Unable to load archive
        </h2>
        <p className="text-text-secondary">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-dim mb-6 flex items-center gap-3">
        Past Analyses
        <span className="flex-1 h-px bg-border" />
      </h2>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-raised rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data.length === 0 && (
        <p className="text-text-secondary text-center py-12">
          No analyses yet. The first analysis will run at 06:00 UTC.
        </p>
      )}

      {!loading && data.length > 0 && (
        <div className="space-y-3">
          {data.map((item) => {
            const formattedDate = new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={item.date}
                onClick={() => onDateSelect(item.date)}
                className="w-full text-left bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-accent transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-accent">{formattedDate}</span>
                  <div className="flex items-center gap-3 font-mono text-xs text-text-dim">
                    <span>{item.repoCount} repos</span>
                    <span>{item.categoryCount} categories</span>
                  </div>
                </div>
                <p className="text-text text-sm group-hover:text-white transition-colors">
                  {item.headline}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
