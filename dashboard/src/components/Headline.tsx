interface HeadlineProps {
  headline?: string;
  date?: string;
  pattern?: string;
  loading?: boolean;
}

export function Headline({ headline, date, pattern, loading }: HeadlineProps) {
  if (loading) {
    return (
      <div className="mb-8 py-8">
        <div className="h-4 w-32 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="h-8 w-3/4 bg-surface-raised rounded animate-pulse mb-3" />
        <div className="h-5 w-1/2 bg-surface-raised rounded animate-pulse" />
      </div>
    );
  }

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="mb-8 py-8">
      <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
        {formattedDate}
      </p>
      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
        {headline}
      </h1>
      {pattern && (
        <p className="text-text-secondary text-lg leading-relaxed max-w-2xl">
          {pattern}
        </p>
      )}
    </div>
  );
}
