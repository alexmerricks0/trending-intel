export function Footer() {
  return (
    <footer className="border-t border-border max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
      <p className="font-mono text-xs text-text-dim tracking-wider">
        &copy; {new Date().getFullYear()} LFX AI LLC
      </p>
      <div className="flex gap-4">
        <a
          href="https://github.com/alexmerricks0/trending-intel"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-dim hover:text-text-secondary transition-colors"
        >
          Source
        </a>
        <a
          href="https://lfxai.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-dim hover:text-text-secondary transition-colors"
        >
          lfxai.dev
        </a>
      </div>
    </footer>
  );
}
