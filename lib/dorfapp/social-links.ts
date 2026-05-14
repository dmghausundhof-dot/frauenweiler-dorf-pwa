/**
 * Social-/Web-Links aus Admin-Freitext (eine URL pro Zeile, Komma oder Leerzeichen möglich).
 */

export function parseSocialLinksInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const normalized = normalizeToHttpUrl(part);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

export function normalizeToHttpUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u.href;
    } catch {
      return null;
    }
  }
  if (/^[a-z0-9][a-z0-9+.-]*:\/\//i.test(t)) return null;
  const withHost = /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(t) ? `https://${t}` : null;
  if (!withHost) return null;
  try {
    return new URL(withHost).href;
  } catch {
    return null;
  }
}

export function labelForSocialUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('instagram.')) return 'Instagram';
  if (u.includes('facebook.') || u.includes('fb.com')) return 'Facebook';
  if (u.includes('threads.')) return 'Threads';
  if (u.includes('twitter.') || u.includes('x.com')) return 'X / Twitter';
  if (u.includes('youtube.') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('wa.me') || u.includes('whatsapp.')) return 'WhatsApp';
  if (u.includes('tiktok.')) return 'TikTok';
  if (u.includes('mastodon.') || u.includes('/@')) return 'Fediverse';
  return 'Link';
}
