import { useState } from 'react';
import { subscribe } from '../api';

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const data = await subscribe(email);
      if (data.status === 'subscribed') {
        setStatus('success');
        setMessage("You're in! Weekly digest every Monday.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error === 'Already subscribed' ? 'You\'re already subscribed!' : data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className={`bg-accent-soft border border-accent/20 rounded-lg px-4 py-3 ${compact ? '' : 'mt-4'}`}>
        <p className="font-mono text-xs text-accent">{message}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <span className="font-mono text-xs text-text-dim">Newsletter</span>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
          placeholder="your@email.com"
          required
          className="bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-text placeholder-text-dim focus:border-accent focus:outline-none transition-colors w-48"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-accent-soft border border-accent/20 rounded-lg px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
        {status === 'error' && (
          <span className="font-mono text-xs text-red-400">{message}</span>
        )}
      </form>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
          placeholder="your@email.com"
          required
          className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-xs text-text placeholder-text-dim focus:border-accent focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-accent-soft border border-accent/20 rounded-lg px-4 py-2 font-mono text-xs text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </form>
      {status === 'error' && (
        <p className="font-mono text-xs text-red-400 mt-2">{message}</p>
      )}
    </div>
  );
}
