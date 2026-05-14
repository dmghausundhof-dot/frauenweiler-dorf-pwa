import { supabase } from '@/lib/supabase';

export type Tab =
  | 'home'
  | 'news'
  | 'events'
  | 'polls'
  | 'contribute'
  | 'help'
  | 'profile';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  description: string;
  image_url?: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  important: boolean;
  date: string;
  /** URLs zu Social-Media oder Web (Instagram, Facebook, …) */
  socialLinks: string[];
}

export interface Contribution {
  id: string;
  eventId: string;
  type: 'mitbringen' | 'helfen';
  description: string;
  needed: number;
  signedUp: number;
}

export interface HelpRequest {
  id: string;
  userId: string;
  kind: 'need' | 'offer';
  title: string;
  description: string;
  category: string;
  status: 'open' | 'done' | 'cancelled';
  createdAt: string;
}

function socialLinksFromRow(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && /^https?:\/\//i.test(x));
}

export async function loadVillageDataFromSupabase(): Promise<{
  events: Event[];
  news: NewsItem[];
  contributions: Contribution[];
  help: HelpRequest[];
} | null> {
  const [evRes, nwRes, hpRes, ctRes, sgRes] = await Promise.all([
    supabase.from('events').select('*').order('date', { ascending: true }),
    supabase.from('news').select('*').order('created_at', { ascending: false }),
    supabase.from('help_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(80),
    supabase.from('event_contributions').select('id, event_id, type, description, needed'),
    supabase.from('contribution_signups').select('contribution_id'),
  ]);

  if (evRes.error || nwRes.error) {
    console.warn('loadVillageDataFromSupabase', evRes.error, nwRes.error);
  }

  const events: Event[] =
    evRes.data?.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      date: row.date as string,
      time: (row.time as string) || '',
      location: (row.location as string) || 'Frauenweiler',
      category: (row.category as string) || 'Allgemein',
      attendees: 0,
      description: (row.description as string) || '',
      image_url: row.image_url as string | null | undefined,
    })) ?? [];

  const news: NewsItem[] =
    nwRes.data?.map((row) => ({
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      category: (row.category as string) || 'Allgemein',
      important: !!(row.important as boolean),
      date: ((row.created_at as string) || '').split('T')[0] || '',
      socialLinks: socialLinksFromRow((row as { social_links?: unknown }).social_links),
    })) ?? [];

  const countBy = new Map<string, number>();
  sgRes.data?.forEach((s: { contribution_id: string }) => {
    const k = s.contribution_id;
    countBy.set(k, (countBy.get(k) || 0) + 1);
  });

  const contributions: Contribution[] =
    ctRes.data?.map((row) => ({
      id: row.id as string,
      eventId: row.event_id as string,
      type: row.type as 'mitbringen' | 'helfen',
      description: row.description as string,
      needed: (row.needed as number) || 1,
      signedUp: countBy.get(row.id as string) || 0,
    })) ?? [];

  const help: HelpRequest[] =
    hpRes.data?.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      kind: row.kind as 'need' | 'offer',
      title: row.title as string,
      description: row.description as string,
      category: (row.category as string) || 'Sonstiges',
      status: row.status as 'open' | 'done' | 'cancelled',
      createdAt: (row.created_at as string) || '',
    })) ?? [];

  return { events, news, contributions, help };
}
