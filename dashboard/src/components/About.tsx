export function About() {
  return (
    <div className="py-8 max-w-2xl">
      <h2 className="font-mono text-xs uppercase tracking-widest text-text-dim mb-6 flex items-center gap-3">
        About
        <span className="flex-1 h-px bg-border" />
      </h2>

      <p className="text-lg text-text leading-relaxed font-light mb-6">
        <strong className="text-white font-medium">Trending Intel</strong> is an
        AI-powered daily briefing on what the open-source world is building.
        Every morning at 06:00 UTC, a Cloudflare Worker fetches the latest
        trending repositories from GitHub, sends them to Claude for analysis,
        and publishes a categorized report.
      </p>

      <h3 className="font-mono text-xs uppercase tracking-widest text-text-dim mb-4 mt-8">
        How it works
      </h3>

      <ol className="space-y-3 mb-8">
        {[
          'Cron trigger fires daily at 06:00 UTC',
          'Worker queries GitHub Search API for new and active repos',
          'Claude Haiku categorizes repos and writes insights',
          'Structured analysis is stored in Cloudflare D1',
          'This dashboard reads from the Worker API',
        ].map((step, i) => (
          <li key={i} className="flex gap-3 text-text-secondary">
            <span className="font-mono text-xs text-accent flex-shrink-0 mt-0.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm">{step}</span>
          </li>
        ))}
      </ol>

      <div className="border-t border-border pt-6 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <dt className="font-mono text-xs uppercase tracking-widest text-text-dim mb-1">Stack</dt>
          <dd className="text-sm text-text-secondary">
            Cloudflare Workers, D1, Pages, React, TypeScript
          </dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-widest text-text-dim mb-1">AI</dt>
          <dd className="text-sm text-text-secondary">Claude Haiku via Anthropic API</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-widest text-text-dim mb-1">Source</dt>
          <dd className="text-sm text-text-secondary">
            <a
              href="https://github.com/alexmerricks0/trending-intel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              GitHub
            </a>
          </dd>
        </div>
      </div>
    </div>
  );
}
