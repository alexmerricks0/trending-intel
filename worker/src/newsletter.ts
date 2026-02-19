/**
 * Newsletter — subscribe/unsubscribe handlers + weekly email sender
 */

import type { Env } from './index';
import type { AnalysisResult } from './claude';

// ============================================================================
// Subscribe / Unsubscribe Handlers
// ============================================================================

export async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }

  const token = crypto.randomUUID();

  try {
    await env.DB.prepare(
      `INSERT INTO subscribers (email, token) VALUES (?, ?)`,
    ).bind(email, token).run();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return jsonResponse({ error: 'Already subscribed' }, 409);
    }
    throw error;
  }

  return jsonResponse({ status: 'subscribed' });
}

export async function handleUnsubscribe(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get('token');
  if (!token) {
    return htmlResponse(env, 'Invalid Link', 'This unsubscribe link is invalid.');
  }

  const result = await env.DB.prepare(
    `UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now')
     WHERE token = ? AND status = 'active'`,
  ).bind(token).run();

  if (result.meta.changes > 0) {
    return htmlResponse(
      env,
      'Unsubscribed',
      `You've been removed from the ${env.SITE_NAME} weekly newsletter. Changed your mind? Visit <a href="${env.SITE_URL}" style="color: #c9a227;">${env.SITE_URL}</a> to resubscribe.`,
    );
  }

  return htmlResponse(
    env,
    'Already Unsubscribed',
    'This email has already been unsubscribed or the link is invalid.',
  );
}

// ============================================================================
// Weekly Newsletter Sender
// ============================================================================

export async function sendWeeklyNewsletter(env: Env): Promise<void> {
  const subs = await env.DB.prepare(
    `SELECT email, token FROM subscribers WHERE status = 'active'`,
  ).all<{ email: string; token: string }>();

  if (!subs.results?.length) {
    console.log('No active subscribers, skipping newsletter');
    return;
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const content = await env.DB.prepare(
    `SELECT date, analysis FROM daily_analyses WHERE date >= ? ORDER BY date DESC`,
  ).bind(weekAgo).all<{ date: string; analysis: string }>();

  if (!content.results?.length) {
    console.log('No content for the past week, skipping newsletter');
    return;
  }

  const days = content.results.map((row) => ({
    date: row.date,
    data: JSON.parse(row.analysis) as AnalysisResult,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const subject = `${env.SITE_NAME} — Week of ${today}`;
  const baseHtml = buildWeeklyEmail(days, env);
  const workerHost = 'https://trending-intel-worker.alexmerricks.workers.dev';

  let sent = 0;
  for (const sub of subs.results) {
    const unsubscribeUrl = `${workerHost}/api/unsubscribe?token=${sub.token}`;
    const html = baseHtml.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

    try {
      await sendViaResend(env, sub.email, subject, html, unsubscribeUrl);
      sent++;
    } catch (error) {
      console.error(`Failed to send to ${sub.email}:`, error);
    }
  }

  console.log(`Newsletter sent to ${sent}/${subs.results.length} subscribers`);
}

async function sendViaResend(
  env: Env,
  to: string,
  subject: string,
  html: string,
  unsubscribeUrl: string,
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${env.SITE_NAME} <${env.SENDER_EMAIL}>`,
      to: [to],
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend ${response.status}: ${err}`);
  }
}

// ============================================================================
// Email Template
// ============================================================================

function buildWeeklyEmail(
  days: Array<{ date: string; data: AnalysisResult }>,
  env: Env,
): string {
  const daySections = days.map((day) => {
    const categories = Object.entries(day.data.categories).map(([category, items]) => `
      <tr><td style="padding: 4px 0 12px;">
        <p style="font-family: monospace; font-size: 10px; color: #c9a227; letter-spacing: 1px; margin: 0 0 6px;">${esc(category.toUpperCase())} (${items.length})</p>
        ${items.map((item) => `
          <p style="margin: 0 0 4px;">
            <a href="https://github.com/${esc(item.repo)}" style="color: #d4d4d4; text-decoration: none; font-size: 13px; font-weight: 500;">${esc(item.repo)}</a>
            <span style="color: #525252; font-size: 12px;"> ${'●'.repeat(item.significance)}${'○'.repeat(5 - item.significance)}</span>
          </p>
          <p style="color: #737373; font-size: 12px; margin: 0 0 8px; line-height: 1.4;">${esc(item.summary)}</p>
        `).join('')}
      </td></tr>
    `).join('');

    const notable = day.data.notable.length > 0 ? day.data.notable.map((item) => `
      <tr><td style="padding: 2px 0;">
        <a href="https://github.com/${esc(item.repo)}" style="color: #c9a227; text-decoration: none; font-size: 13px;">${esc(item.repo)}</a>
        <span style="color: #737373; font-size: 12px;"> — ${esc(item.why)}</span>
      </td></tr>
    `).join('') : '';

    return `
      <tr><td style="padding: 24px 32px 8px;">
        <p style="font-family: monospace; font-size: 11px; color: #c9a227; letter-spacing: 2px; margin: 0;">${formatDate(day.date)}</p>
      </td></tr>
      <tr><td style="padding: 4px 32px 16px;">
        <h2 style="font-size: 18px; color: #d4d4d4; margin: 0; font-weight: 600; line-height: 1.3;">${esc(day.data.headline)}</h2>
        ${day.data.pattern ? `<p style="color: #737373; font-size: 13px; margin: 8px 0 0; font-style: italic;">${esc(day.data.pattern)}</p>` : ''}
      </td></tr>
      <tr><td style="padding: 0 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">${categories}</table>
      </td></tr>
      ${notable ? `
        <tr><td style="padding: 8px 32px 0;">
          <p style="font-family: monospace; font-size: 10px; color: #525252; letter-spacing: 1px; margin: 0 0 8px;">NOTABLE PICKS</p>
          <table width="100%" cellpadding="0" cellspacing="0">${notable}</table>
        </td></tr>
      ` : ''}
      <tr><td style="padding: 16px 32px 0;"><hr style="border: none; border-top: 1px solid #1e1e1e;" /></td></tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr><td align="center" style="padding: 32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #101010; border: 1px solid #1e1e1e; border-radius: 8px;">
        <tr><td style="padding: 32px 32px 16px; text-align: center;">
          <p style="font-family: monospace; font-size: 13px; color: #c9a227; letter-spacing: 3px; margin: 0;">${env.SITE_NAME.toUpperCase()}</p>
          <p style="font-size: 13px; color: #525252; margin: 8px 0 0;">Weekly Digest</p>
        </td></tr>
        <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #1e1e1e;" /></td></tr>
        ${daySections}
        <tr><td style="padding: 24px 32px; text-align: center;">
          <p style="font-size: 12px; color: #525252; margin: 0 0 8px;">
            <a href="${env.SITE_URL}" style="color: #737373; text-decoration: none;">${env.SITE_URL}</a>
          </p>
          <p style="font-size: 11px; color: #525252; margin: 0;">
            <a href="{{UNSUBSCRIBE_URL}}" style="color: #525252; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ============================================================================
// Helpers
// ============================================================================

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function htmlResponse(env: Env, title: string, message: string): Response {
  return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — ${env.SITE_NAME}</title></head>
<body style="background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
  <div style="text-align: center; max-width: 400px;">
    <p style="font-family: monospace; font-size: 11px; color: #c9a227; letter-spacing: 3px; margin: 0 0 24px;">${env.SITE_NAME.toUpperCase()}</p>
    <h1 style="color: #d4d4d4; font-size: 20px; margin: 0 0 12px;">${esc(title)}</h1>
    <p style="color: #737373; font-size: 14px; line-height: 1.6;">${message}</p>
  </div>
</body></html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
