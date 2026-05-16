'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Users, Vote, Home, User, Bell, Plus,
  MapPin, Clock, Heart, Check, LogIn, Shield,
  Mail, Pencil, KeyRound, Loader2, Save,
  Handshake, ExternalLink, Menu, Instagram, Facebook, Youtube, X, Share2, Trash2,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  type Tab,
  type Event,
  type NewsItem,
  type Contribution,
  type HelpRequest,
  loadVillageDataFromSupabase,
} from '@/lib/dorfapp/village-data';
import { parseSocialLinksInput, labelForSocialUrl } from '@/lib/dorfapp/social-links';
import { ACCOUNT_DELETE_PHRASE } from '@/lib/dorfapp/account-delete';

interface Poll {
  id: string;
  title: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  userVoted?: number;
}

const KERWE_FACEBOOK_URL =
  'https://www.facebook.com/Frauenweiler/posts/-kerwe-frauenweiler-2026-wir-brauchen-euch-die-vorbereitungen-laufen-und-dieses-/1380725684084507/';
const KERWE_CONTACT_EMAIL = 'info@frauenweiler.org';
const KERWE_DONATION_IBAN = 'DE65 6725 0020 0010 4903 59';
const KERWE_DONATION_BANK = 'Sparkasse Heidelberg';

const kerweSupportReasons = [
  'Musik und Programm möglich machen',
  'Genehmigungen finanzieren',
  'Sicherheit und Ordnerdienst organisieren',
] as const;

const kerweSponsorBenefits = [
  'Werbung für unterstützende Unternehmen',
  'Spendenbescheinigung auf Wunsch',
  'Ein besonderes Heimatfest für Frauenweiler und die Region',
] as const;

const mockEvents: Event[] = [
  {
    id: 'kerwe-2026',
    title: 'Kerwe Frauenweiler 2026',
    date: '2026-07-25',
    endDate: '2026-07-27',
    time: '14:00',
    location: 'Frauenweiler',
    category: 'Kerwe',
    attendees: 87,
    description:
      'Die Kerwe vom 25.-27. Juli 2026 soll ein besonderes Fest für Frauenweiler und die Region werden. Wegen des anschließenden Baubeginns an der Grundschule könnte sie vorerst die letzte Kerwe in dieser Form sein.',
  },
  { id: '2', title: "Feuerwehrübung & Tag der offenen Tür", date: "2026-05-24", time: "10:00", location: "Feuerwehrhaus", category: "Feuerwehr", attendees: 34, description: "Vorstellung der neuen Drehleiter und Übung für die Jugendfeuerwehr." },
  { id: '3', title: "Ortsverein Sitzung + Grillen", date: "2026-05-20", time: "19:30", location: "Vereinsheim", category: "Verein", attendees: 19, description: "Monatliche Sitzung des Ortsvereins mit anschließendem Grillen." },
];

const mockNews: NewsItem[] = [
  {
    id: 'kerwe-sponsoring-2026',
    title: 'Kerwe 2026: Sponsoren und Unterstützer gesucht',
    content:
      'Für Musik, Genehmigungen und Sicherheit braucht die Kerwe Unterstützung aus der Region. Firmen und Privatpersonen können spenden oder sponsern; Werbung für Unternehmen und eine Spendenbescheinigung sind möglich. Kontakt: info@frauenweiler.org.',
    category: 'Kerwe',
    important: true,
    date: '2026-05-05',
    socialLinks: [KERWE_FACEBOOK_URL],
  },
  {
    id: '2',
    title: "Kerwe 2026 – Helfer gesucht!",
    content: "Für die Kerwe vom 25.-27. Juli 2026 suchen wir Helferinnen und Helfer für Aufbau, Abbau, Sicherheit und Programm. Meldet euch bitte beim Ortsverein.",
    category: "Kerwe",
    important: true,
    date: "2026-05-10",
    socialLinks: [KERWE_FACEBOOK_URL],
  },
];

function SocialLinkIcon({ url }: { url: string }) {
  const u = url.toLowerCase();
  if (u.includes('instagram.')) return <Instagram className="w-4 h-4 shrink-0" aria-hidden />;
  if (u.includes('facebook.') || u.includes('fb.com')) return <Facebook className="w-4 h-4 shrink-0" aria-hidden />;
  if (u.includes('youtube.') || u.includes('youtu.be')) return <Youtube className="w-4 h-4 shrink-0" aria-hidden />;
  if (u.includes('twitter.') || u.includes('x.com')) return <X className="w-4 h-4 shrink-0" aria-hidden />;
  return <Share2 className="w-4 h-4 shrink-0" aria-hidden />;
}

function NewsSocialChips({
  links,
  stopLinkPropagation,
  className = 'mt-3 flex flex-wrap gap-2',
}: {
  links: string[];
  stopLinkPropagation?: boolean;
  className?: string;
}) {
  if (!links.length) return null;
  const stop = stopLinkPropagation
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
      }
    : undefined;
  return (
    <div className={className}>
      {links.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stop}
          className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-full border border-[#166534]/25 bg-[#f0fdf4] px-3 py-2 text-xs font-semibold text-[#14532d] active:bg-[#dcfce7]"
        >
          <SocialLinkIcon url={url} />
          <span className="truncate">{labelForSocialUrl(url)}</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" aria-hidden />
        </a>
      ))}
    </div>
  );
}

function formatEventDateRange(event: Event, pattern = 'EEEE, d. MMMM yyyy') {
  const start = format(new Date(event.date), pattern, { locale: de });
  if (!event.endDate || event.endDate === event.date) return start;

  const end = format(new Date(event.endDate), pattern, { locale: de });
  return `${start} bis ${end}`;
}

function isKerweEvent(event?: Event | null) {
  return !!event && /kerwe/i.test(`${event.title} ${event.category}`);
}

function KerweSupportPanel({
  compact = false,
  onContribute,
}: {
  compact?: boolean;
  onContribute?: () => void;
}) {
  return (
    <section
      className={`rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-[#f0fdf4] shadow-sm ${
        compact ? 'p-4' : 'p-5'
      }`}
      aria-labelledby="kerwe-support-title"
    >
      <div className="flex flex-col gap-4">
        <div>
          <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
            Kerwe 2026
          </div>
          <h2 id="kerwe-support-title" className={`${compact ? 'mt-2 text-lg' : 'mt-3 text-2xl'} font-semibold text-zinc-950`}>
            Unterstützung für Musik, Sicherheit und Genehmigungen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            Die Kerwe vom 25.-27. Juli 2026 soll ein unvergessliches Fest werden. Weil danach der Baubeginn an
            der Grundschule startet, könnte sie vorerst die letzte Kerwe in dieser Form sein.
          </p>
        </div>

        <div className={`grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Dafür werden Spenden gebraucht</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-[#475569]">
              {kerweSupportReasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" aria-hidden />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Für Sponsoren inklusive</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-[#475569]">
              {kerweSponsorBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" aria-hidden />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-[#166534]/15 bg-white/85 p-4 text-sm text-[#475569]">
          <div className="font-semibold text-zinc-900">Spendenkonto</div>
          <div className="mt-1 font-mono text-[#14532d]">{KERWE_DONATION_IBAN}</div>
          <div className="text-xs text-[#64748b]">{KERWE_DONATION_BANK}</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`mailto:${KERWE_CONTACT_EMAIL}?subject=Kerwe%20Frauenweiler%202026`}
            className="dorf-button flex-1 justify-center"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Kontakt aufnehmen
          </a>
          {onContribute && (
            <button
              type="button"
              onClick={onContribute}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#166534] px-4 py-3 text-sm font-semibold text-[#166534]"
            >
              <Heart className="h-4 w-4" aria-hidden />
              Mithelfen
            </button>
          )}
          <a
            href={KERWE_FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
          >
            <Facebook className="h-4 w-4" aria-hidden />
            Facebook-Beitrag
          </a>
        </div>
      </div>
    </section>
  );
}

const mockPolls: Poll[] = [
  {
    id: '1',
    title: "Wie möchtest du die Kerwe 2026 unterstützen?",
    options: [
      { text: "Beim Aufbau oder Abbau helfen", votes: 42 },
      { text: "Sponsoren ansprechen", votes: 31 },
      { text: "Essen / Fingerfood mitbringen", votes: 18 },
    ],
    totalVotes: 91,
  },
  {
    id: '2',
    title: "Was ist euch für die Kerwe 2026 besonders wichtig?",
    options: [
      { text: "Live-Musik und Programm", votes: 67 },
      { text: "Kinder- und Familienangebote", votes: 22 },
      { text: "Essen, Trinken und Treffpunkt", votes: 11 },
    ],
    totalVotes: 100,
  },
];

const mockContributions: Contribution[] = [
  { id: '1', eventId: 'kerwe-2026', type: 'helfen', description: "Sponsoren und Spender in der Region ansprechen", needed: 6, signedUp: 2 },
  { id: '2', eventId: 'kerwe-2026', type: 'helfen', description: "Aufbau vor dem Kerwe-Wochenende", needed: 10, signedUp: 5 },
  { id: '3', eventId: 'kerwe-2026', type: 'helfen', description: "Abbau am Montag nach der Kerwe", needed: 10, signedUp: 3 },
  { id: '4', eventId: 'kerwe-2026', type: 'helfen', description: "Ordnerdienst / Sicherheit unterstützen", needed: 8, signedUp: 2 },
  { id: '5', eventId: 'kerwe-2026', type: 'mitbringen', description: "Kuchen oder Fingerfood fürs Festwochenende", needed: 8, signedUp: 4 },
];

const mockHelpRequests: HelpRequest[] = [
  {
    id: 'demo-1',
    userId: '00000000-0000-0000-0000-000000000000',
    kind: 'need',
    title: 'Fahrdienst zur Arztpraxis',
    description: 'Kurzfristig gesucht: Mitfahrt am Donnerstag vormittag.',
    category: 'Fahrdienst',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    userId: '00000000-0000-0000-0000-000000000000',
    kind: 'offer',
    title: 'Einkaufshilfe für Nachbar:innen',
    description: 'Ich gehe regelmäßig zum REWE – kann kleine Einkäufe mitnehmen.',
    category: 'Einkauf',
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

export default function FrauenweilerDorfApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Gast');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'news' | 'event' | 'contribution'>('news');

  const [events, setEvents] = useState(mockEvents);
  const [news, setNews] = useState(mockNews);
  const [polls, setPolls] = useState(mockPolls);
  const [contributions, setContributions] = useState(mockContributions);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [helpFilter, setHelpFilter] = useState<'all' | 'need' | 'offer'>('all');
  const [showNewHelpModal, setShowNewHelpModal] = useState(false);
  const [newHelp, setNewHelp] = useState({
    kind: 'need' as 'need' | 'offer',
    title: '',
    description: '',
    category: 'Sonstiges',
  });
  const [savingHelp, setSavingHelp] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [selectedEventForContrib, setSelectedEventForContrib] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [activityCounts, setActivityCounts] = useState<{ contributions: number; pollVotes: number } | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPhrase, setDeleteAccountPhrase] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountEmailConfirm, setDeleteAccountEmailConfirm] = useState('');
  const [deleteAccountAuthHint, setDeleteAccountAuthHint] = useState<'password' | 'email_confirm' | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [sendingDeleteLink, setSendingDeleteLink] = useState(false);

  // Admin form states
  const [newNews, setNewNews] = useState({ title: '', content: '', category: 'Allgemein', important: false, socialLinksRaw: '' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', endDate: '', time: '', location: '', category: 'Fest' });
  const [newContribution, setNewContribution] = useState({ eventId: '', type: 'mitbringen' as 'mitbringen' | 'helfen', description: '', needed: 1 });
  const [selectedEventForNewContrib, setSelectedEventForNewContrib] = useState('');

  const useSupabase = isSupabaseConfigured();

  const refreshVillageData = useCallback(async () => {
    if (!useSupabase) return;
    setDataLoading(true);
    try {
      const pack = await loadVillageDataFromSupabase();
      if (!pack) return;
      if (pack.events.length > 0) setEvents(pack.events);
      if (pack.news.length > 0) setNews(pack.news);
      setContributions(pack.contributions);
      setHelpRequests(pack.help);
    } finally {
      setDataLoading(false);
    }
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      setHelpRequests(mockHelpRequests);
      return;
    }
    void refreshVillageData();
  }, [useSupabase, refreshVillageData]);

  const applySessionUser = React.useCallback(async (sessionUser: { id: string; email?: string | null }) => {
    setUserId(sessionUser.id);
    setUserEmail(sessionUser.email ?? null);
    if (!useSupabase) {
      setUserName(sessionUser.email?.split('@')[0] || 'Bewohner');
      setIsAdmin(false);
      setProfileCreatedAt(null);
      setAvatarUrl(null);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_admin, created_at, avatar_url')
      .eq('id', sessionUser.id)
      .single();

    if (profile) {
      setUserName(profile.name || sessionUser.email?.split('@')[0] || 'Bewohner');
      setIsAdmin(!!profile.is_admin);
      setProfileCreatedAt(profile.created_at ?? null);
      setAvatarUrl(profile.avatar_url ?? null);
    } else {
      setUserName(sessionUser.email?.split('@')[0] || 'Bewohner');
      setIsAdmin(false);
      setProfileCreatedAt(null);
      setAvatarUrl(null);
    }
  }, [useSupabase]);

  const clearSessionUser = React.useCallback(() => {
    setIsLoggedIn(false);
    setUserId(null);
    setUserEmail(null);
    setIsAdmin(false);
    setUserName('Gast');
    setProfileCreatedAt(null);
    setAvatarUrl(null);
    setActivityCounts(null);
    setEditingName(false);
    setDisplayNameDraft('');
  }, []);

  useEffect(() => {
    if (!isAdmin) setShowAdminModal(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!showDeleteAccountModal || !useSupabase) {
      setDeleteAccountAuthHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error || !user?.email) {
        setDeleteAccountAuthHint('password');
        return;
      }
      const hasEmailIdentity = (user.identities ?? []).some((i) => i.provider === 'email');
      setDeleteAccountAuthHint(hasEmailIdentity ? 'password' : 'email_confirm');
    })();
    return () => {
      cancelled = true;
    };
  }, [showDeleteAccountModal, useSupabase]);

  // ============================================
  // SUPABASE AUTH + REALTIME
  // ============================================
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!navDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [navDrawerOpen]);

  useEffect(() => {
    if (!useSupabase || !userId) {
      setActivityCounts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [signups, votes] = await Promise.all([
        supabase.from('contribution_signups').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('poll_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      if (!cancelled) {
        setActivityCounts({
          contributions: signups.count ?? 0,
          pollVotes: votes.count ?? 0,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, useSupabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        await applySessionUser(session.user);
      } else {
        clearSessionUser();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        void applySessionUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [applySessionUser, clearSessionUser]);

  // Realtime for live poll updates
  useEffect(() => {
    if (!useSupabase) return;

    const channel = supabase
      .channel('live-polls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => {
        toast.info('Umfrage wurde aktualisiert', { description: 'Neue Stimme eingegangen' });
        // TODO: Refetch polls for live update
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [useSupabase]);

  /** Öffnet den Login-Dialog und zeigt einen Hinweis (Umfragen, Mitmachen, …). */
  const promptLogin = (description: string) => {
    toast.info('Bitte anmelden', { description });
    setShowLogin(true);
  };

  /** Von Terminen: Mitmachen-Tab mit gewähltem Event; Gast bekommt sofort Login-Hinweis. */
  const openContributeForEvent = (eventId: string) => {
    setSelectedEventForContrib(eventId);
    setActiveTab('contribute');
    if (!isLoggedIn) {
      promptLogin('Termin ist ausgewählt – zum Eintragen bei Mitbring- oder Helfer-Aufgaben bitte anmelden.');
    }
  };

  // --- Actions ---
  const handleRSVP = (eventId: string) => {
    if (!isLoggedIn) {
      promptLogin('Mit einem Konto kannst du deine Teilnahme am Termin festhalten.');
      return;
    }
    setEvents(prev => prev.map(ev => 
      ev.id === eventId ? { ...ev, attendees: ev.attendees + 1 } : ev
    ));
    toast.success('Super! Du bist dabei 🎉', { 
      description: 'Du wurdest als Teilnehmer eingetragen.' 
    });
  };

  const handleVote = (pollId: string, optionIndex: number) => {
    if (!isLoggedIn) {
      promptLogin('Nur angemeldete Bewohnerinnen und Bewohner können abstimmen.');
      return;
    }
    setPolls(prev => prev.map(poll => {
      if (poll.id !== pollId) return poll;
      
      const newOptions = [...poll.options];
      newOptions[optionIndex].votes += 1;
      
      return {
        ...poll,
        options: newOptions,
        totalVotes: poll.totalVotes + 1,
        userVoted: optionIndex
      };
    }));
    
    toast.success('Danke für deine Stimme!', { 
      description: 'Deine Stimme wurde gezählt.' 
    });
  };

  const handleSignUpContribution = async (contribId: string) => {
    if (!isLoggedIn) {
      promptLogin('Zum Eintragen bei Mitbring- oder Helfer-Aufgaben ist ein Konto nötig.');
      return;
    }
    if (useSupabase && userId) {
      const { error } = await supabase.from('contribution_signups').insert({
        contribution_id: contribId,
        user_id: userId,
        user_name: userName,
      });
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          toast.message('Bereits eingetragen', { description: 'Du bist für diese Aufgabe schon vorgemerkt.' });
        } else {
          toast.error('Eintragen fehlgeschlagen', { description: error.message });
        }
        return;
      }
      toast.success('Vielen Dank!', { description: 'Du wurdest eingetragen.' });
      await refreshVillageData();
      return;
    }
    setContributions(prev => prev.map(c => {
      if (c.id === contribId && c.signedUp < c.needed) {
        return { ...c, signedUp: c.signedUp + 1 };
      }
      return c;
    }));
    toast.success('Vielen Dank!', { 
      description: 'Du wurdest eingetragen. Wir freuen uns auf deine Hilfe!' 
    });
  };

  const submitNewHelp = async () => {
    if (!isLoggedIn || !userId) {
      promptLogin('Zum Veröffentlichen eines Gesuchs oder Angebots bitte anmelden.');
      return;
    }
    if (!newHelp.title.trim() || !newHelp.description.trim()) {
      toast.error('Bitte Titel und Beschreibung ausfüllen');
      return;
    }
    setSavingHelp(true);
    try {
      if (useSupabase) {
        const { error } = await supabase.from('help_requests').insert({
          user_id: userId,
          kind: newHelp.kind,
          title: newHelp.title.trim(),
          description: newHelp.description.trim(),
          category: newHelp.category,
        });
        if (error) throw error;
        toast.success('Eintrag veröffentlicht');
        setShowNewHelpModal(false);
        setNewHelp({ kind: 'need', title: '', description: '', category: 'Sonstiges' });
        await refreshVillageData();
      } else {
        const local: HelpRequest = {
          id: `local-${Date.now()}`,
          userId,
          kind: newHelp.kind,
          title: newHelp.title.trim(),
          description: newHelp.description.trim(),
          category: newHelp.category,
          status: 'open',
          createdAt: new Date().toISOString(),
        };
        setHelpRequests((prev) => [local, ...prev]);
        toast.success('Eintrag hinzugefügt', { description: 'Nur lokal im Demo-Modus.' });
        setShowNewHelpModal(false);
        setNewHelp({ kind: 'need', title: '', description: '', category: 'Sonstiges' });
      }
    } catch (e: unknown) {
      toast.error('Speichern fehlgeschlagen', {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSavingHelp(false);
    }
  };

  const setHelpStatus = async (id: string, status: 'done' | 'cancelled') => {
    if (useSupabase) {
      const { error } = await supabase
        .from('help_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error('Aktualisierung fehlgeschlagen', { description: error.message });
        return;
      }
      await refreshVillageData();
    } else {
      setHelpRequests((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)));
    }
    toast.success(status === 'done' ? 'Als erledigt markiert' : 'Eintrag zurückgezogen');
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Bitte E-Mail und Passwort eingeben');
      return;
    }

    setIsLoadingAuth(true);

    try {
      if (isRegisterMode) {
        // Register new user
        const { error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
          options: {
            data: { name: loginName || loginEmail.split('@')[0] }
          }
        });
        
        if (error) throw error;
        toast.success('Registrierung erfolgreich!', { 
          description: 'Bitte bestätige deine E-Mail-Adresse.' 
        });
        setShowLogin(false);
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword
        });
        
        if (error) throw error;
        toast.success('Erfolgreich angemeldet!');
        setShowLogin(false);
      }
    } catch (error: any) {
      toast.error('Fehler bei der Anmeldung', { description: error.message });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('home');
    toast.info('Du wurdest abgemeldet.');
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountPhrase !== ACCOUNT_DELETE_PHRASE) {
      toast.error('Bestätigung fehlt', { description: `Bitte exakt eingeben: ${ACCOUNT_DELETE_PHRASE}` });
      return;
    }
    if (!useSupabase) {
      toast.message('Demo-Modus', { description: 'Kontolöschung ist nur mit echtem Supabase-Betrieb möglich.' });
      return;
    }
    if (!deleteAccountAuthHint) {
      toast.error('Bitte kurz warten', { description: 'Sicherheitsprüfung wird geladen.' });
      return;
    }

    setDeletingAccount(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      const user = authData?.user;
      if (authErr || !user?.email) {
        toast.error('Sitzung ungültig', { description: 'Bitte melde dich erneut an.' });
        return;
      }

      const hasEmailIdentity = (user.identities ?? []).some((i) => i.provider === 'email');

      if (hasEmailIdentity) {
        const pwd = deleteAccountPassword.trim();
        if (!pwd) {
          toast.error('Passwort fehlt', { description: 'Bitte dein aktuelles Passwort eingeben.' });
          return;
        }
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: pwd,
        });
        if (signErr) {
          toast.error('Passwort stimmt nicht', { description: signErr.message });
          return;
        }
      } else {
        const typed = deleteAccountEmailConfirm.trim().toLowerCase();
        if (typed !== user.email.trim().toLowerCase()) {
          toast.error('E-Mail stimmt nicht', {
            description: 'Bitte deine vollständige Anmelde-E-Mail exakt wie im Konto hinterlegt eingeben.',
          });
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Keine gültige Sitzung', { description: 'Bitte melde dich erneut an.' });
        return;
      }
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setShowDeleteAccountModal(false);
      setDeleteAccountPhrase('');
      setDeleteAccountPassword('');
      setDeleteAccountEmailConfirm('');
      setDeleteAccountAuthHint(null);
      await supabase.auth.signOut();
      setActiveTab('home');
      toast.success('Dein Konto wurde gelöscht.', {
        description: 'Du bist abgemeldet. Bei Rückfragen wende dich an die Betreuung der DorfApp.',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Konto konnte nicht gelöscht werden', { description: msg });
    } finally {
      setDeletingAccount(false);
    }
  };

  const requestDeleteLinkByEmail = async () => {
    if (!useSupabase) {
      toast.message('Demo-Modus', { description: 'E-Mail-Link ist nur mit Supabase verfügbar.' });
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error('Nicht angemeldet');
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!baseUrl || !anonKey) {
      toast.error('Konfiguration unvollständig');
      return;
    }
    setSendingDeleteLink(true);
    try {
      const res = await fetch(`${baseUrl}/functions/v1/request-account-deletion`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      toast.success('E-Mail ist unterwegs', {
        description: 'Öffne den Link in der Nachricht (gültig ca. 1 Stunde). Prüfe ggf. den Spam-Ordner.',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Link konnte nicht gesendet werden', { description: msg });
    } finally {
      setSendingDeleteLink(false);
    }
  };

  const saveDisplayName = async () => {
    const next = displayNameDraft.trim();
    if (!next) {
      toast.error('Bitte einen Namen eingeben');
      return;
    }
    if (!userId) return;
    if (!useSupabase) {
      setUserName(next);
      setEditingName(false);
      toast.success('Name aktualisiert', { description: 'Nur lokal im Demo-Modus.' });
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase.from('profiles').update({ name: next }).eq('id', userId);
      if (error) throw error;
      setUserName(next);
      setEditingName(false);
      toast.success('Anzeigename gespeichert');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Speichern fehlgeschlagen', { description: msg });
    } finally {
      setSavingName(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!userEmail) {
      toast.error('Keine E-Mail-Adresse für dieses Konto');
      return;
    }
    if (!useSupabase) {
      toast.message('Demo-Modus', { description: 'Passwort-Reset ist nur mit konfiguriertem Supabase möglich.' });
      return;
    }
    setSendingReset(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: origin ? `${origin}/` : undefined,
      });
      if (error) throw error;
      toast.success('E-Mail zum Zurücksetzen wurde verschickt', {
        description: 'Bitte Posteingang und Spam-Ordner prüfen.',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Reset fehlgeschlagen', { description: msg });
    } finally {
      setSendingReset(false);
    }
  };

  // ============================================
  // ADMIN FUNCTIONS (create News, Event, Contribution)
  // ============================================
  const createNews = async () => {
    if (!newNews.title || !newNews.content) {
      toast.error('Titel und Inhalt sind erforderlich');
      return;
    }

    const socialLinks = parseSocialLinksInput(newNews.socialLinksRaw);

    if (useSupabase) {
      const { error } = await supabase.from('news').insert({
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        important: newNews.important,
        social_links: socialLinks,
      });
      if (error) {
        toast.error('Fehler beim Erstellen der News', { description: error.message });
        return;
      }
    } else {
      // Demo mode
      setNews(prev => [{
        id: String(Date.now()),
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        important: newNews.important,
        date: new Date().toISOString().split('T')[0],
        socialLinks,
      }, ...prev]);
    }

    toast.success('News erfolgreich erstellt!');
    setNewNews({ title: '', content: '', category: 'Allgemein', important: false, socialLinksRaw: '' });
    setShowAdminModal(false);
    if (useSupabase) await refreshVillageData();
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Titel und Datum sind erforderlich');
      return;
    }

    const imageUrl = '';

    if (useSupabase) {
      const { error } = await supabase.from('events').insert({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        end_date: newEvent.endDate || null,
        time: newEvent.time,
        location: newEvent.location,
        category: newEvent.category,
        image_url: imageUrl || null,
      });
      if (error) {
        toast.error('Fehler beim Erstellen des Termins', { description: error.message });
        return;
      }
    } else {
      setEvents(prev => [...prev, {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: newEvent.title,
        date: newEvent.date,
        endDate: newEvent.endDate || null,
        time: newEvent.time || '00:00',
        location: newEvent.location || 'Frauenweiler',
        category: newEvent.category,
        attendees: 0,
        description: newEvent.description
      }]);
    }

    toast.success('Termin erfolgreich erstellt!');
    setNewEvent({ title: '', description: '', date: '', endDate: '', time: '', location: '', category: 'Fest' });
    setShowAdminModal(false);
    if (useSupabase) await refreshVillageData();
  };

  const createContributionTask = async () => {
    if (!newContribution.description || !newContribution.eventId) {
      toast.error('Bitte Beschreibung und Event auswählen');
      return;
    }

    if (useSupabase) {
      const { error } = await supabase.from('event_contributions').insert({
        event_id: newContribution.eventId,
        type: newContribution.type,
        description: newContribution.description,
        needed: newContribution.needed,
      });
      if (error) {
        toast.error('Fehler beim Anlegen der Aufgabe', { description: error.message });
        return;
      }
    } else {
      // Demo: add to local contributions
      setContributions(prev => [...prev, {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        eventId: newContribution.eventId,
        type: newContribution.type,
        description: newContribution.description,
        needed: newContribution.needed,
        signedUp: 0
      }]);
    }

    toast.success('Mitbring-/Helfer-Aufgabe erfolgreich angelegt!');
    setNewContribution({ eventId: '', type: 'mitbringen', description: '', needed: 1 });
    setShowAdminModal(false);
    if (useSupabase) await refreshVillageData();
  };

  // Image upload helper (for future use with Supabase Storage)
  const uploadEventImage = async (file: File): Promise<string | null> => {
    if (!useSupabase) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('event-images')
      .upload(fileName, file);

    if (error) {
      toast.error('Bild-Upload fehlgeschlagen');
      return null;
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Filter contributions for selected event
  const currentContributions = selectedEventForContrib 
    ? contributions.filter(c => c.eventId === selectedEventForContrib)
    : [];

  const selectedEvent = events.find(e => e.id === selectedEventForContrib);

  const nextEventHighlight = useMemo(() => {
    if (!events.length) return null;
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    const today = new Date().toISOString().split('T')[0];
    return sorted.find((e) => e.date >= today) ?? sorted[sorted.length - 1];
  }, [events]);

  const homeNewsTeaser = useMemo(() => news.slice(0, 3), [news]);
  const kerweEvent = useMemo(() => events.find((event) => isKerweEvent(event)), [events]);

  const filteredHelp = useMemo(() => {
    let rows = helpRequests.filter((h) => h.status === 'open');
    if (helpFilter === 'need') rows = rows.filter((h) => h.kind === 'need');
    if (helpFilter === 'offer') rows = rows.filter((h) => h.kind === 'offer');
    return rows;
  }, [helpRequests, helpFilter]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-28">
      {/* Header — ohne Menü-Duplikat (Menü nur in der unteren Leiste) */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur safe-area-pt">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setNavDrawerOpen(false);
            }}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl py-1 text-left active:bg-zinc-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#166534]">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">Frauenweiler</div>
              <div className="-mt-0.5 text-xs text-[#166534]">DorfApp</div>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            {isLoggedIn && isAdmin && (
              <button
                type="button"
                aria-label="Verwaltung öffnen"
                title="Verwaltung"
                onClick={() => {
                  setAdminTab('news');
                  setShowAdminModal(true);
                }}
                className="tap-target flex shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 active:bg-amber-100"
              >
                <Shield className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profile');
                  setNavDrawerOpen(false);
                }}
                className="tap-target-sm flex max-w-[9rem] items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 active:bg-zinc-200"
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{userName.split(' ')[0]}</span>
              </button>
            ) : (
              <button type="button" onClick={() => setShowLogin(true)} className="dorf-button tap-target-sm px-4 py-2.5 text-sm">
                Anmelden
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Seitenmenü (Hamburger) — alle Bereiche ohne Tab-Leiste */}
      {navDrawerOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Menü schließen"
            onClick={() => setNavDrawerOpen(false)}
          />
          <nav
            id="dorfapp-nav-drawer"
            className="safe-area-pt safe-area-pb absolute right-0 top-0 flex h-full w-[min(100%,19.5rem)] flex-col border-l border-zinc-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-sm font-semibold text-zinc-800">Navigation</span>
              <button
                type="button"
                className="tap-target-sm flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Schließen"
                onClick={() => setNavDrawerOpen(false)}
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {(
                [
                  { id: 'home' as const, label: 'Start', icon: Home },
                  { id: 'news' as const, label: 'News', icon: Bell },
                  { id: 'events' as const, label: 'Termine', icon: Calendar },
                  { id: 'polls' as const, label: 'Umfragen', icon: Vote },
                  { id: 'contribute' as const, label: 'Mitmachen', icon: Heart },
                  { id: 'help' as const, label: 'Frauenweiler hilft', icon: Handshake },
                  { id: 'profile' as const, label: 'Profil', icon: User },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setNavDrawerOpen(false);
                      if (!isLoggedIn && item.id === 'contribute') {
                        setSelectedEventForContrib(null);
                        promptLogin('Wähle ein Event und melde dich an, um dich für Mitmach-Aktionen einzutragen.');
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-medium transition-colors ${
                      isActive ? 'bg-[#dcfce7] text-[#14532d]' : 'text-zinc-700 active:bg-zinc-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 opacity-90" />
                    {item.label}
                  </button>
                );
              })}
              <div className="mx-2 my-3 border-t border-zinc-200" role="presentation" />
              <Link
                href="/geschichte"
                onClick={() => setNavDrawerOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-medium text-zinc-700 active:bg-zinc-100"
              >
                <BookOpen className="h-5 w-5 shrink-0 opacity-90 text-[#166534]" aria-hidden />
                Geschichte
              </Link>
              {isLoggedIn && isAdmin && (
                <>
                  <div className="mx-2 my-3 border-t border-zinc-200" role="presentation" />
                  <button
                    type="button"
                    onClick={() => {
                      setAdminTab('news');
                      setShowAdminModal(true);
                      setNavDrawerOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-left text-base font-semibold text-amber-950 active:bg-amber-100"
                  >
                    <Shield className="h-5 w-5 shrink-0 text-amber-800" />
                    Verwaltung
                  </button>
                  <p className="mt-1 px-4 text-xs leading-snug text-amber-900/80">
                    Nur für Ortschafts-Admins: News, Termine und Mitmach-Aufgaben.
                  </p>
                </>
              )}
            </div>
            <div className="border-t border-zinc-100 p-3">
              <a
                href="http://frauenweiler.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#166534]/30 bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#14532d]"
                onClick={() => setNavDrawerOpen(false)}
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Vereins-Website
              </a>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#166534] px-4 py-1 rounded-full text-sm font-medium mb-3">
                <MapPin className="w-4 h-4" /> Frauenweiler bei Wiesloch
              </div>
              <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl">DorfApp Frauenweiler</h1>
              <p className="text-[#64748b] mt-2 max-w-md mx-auto text-sm leading-relaxed">
                Termine, Nachbarschaftshilfe, Umfragen und Mitmachen – ergänzend zum{' '}
                <a
                  href="http://frauenweiler.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#166534] font-medium underline underline-offset-2"
                >
                  Stadtteilverein Frauenweiler e.V.
                </a>{' '}
                und der Vereins-Website.
              </p>
            </div>

            {dataLoading && (
              <div className="flex justify-center py-1">
                <Loader2 className="w-6 h-6 animate-spin text-[#166534]" aria-hidden />
              </div>
            )}

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                Schnellzugriff
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    { label: 'Termine', icon: Calendar, tab: 'events' as Tab },
                    { label: 'News', icon: Bell, tab: 'news' as Tab },
                    { label: 'Umfragen', icon: Vote, tab: 'polls' as Tab },
                    { label: 'Mitmachen', icon: Heart, tab: 'contribute' as Tab },
                    { label: 'Hilfe', icon: Handshake, tab: 'help' as Tab },
                  ] as const
                ).map((action) => (
                  <button
                    key={action.tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(action.tab);
                      if (!isLoggedIn && action.tab === 'contribute') {
                        setSelectedEventForContrib(null);
                        promptLogin('Wähle ein Event und melde dich an, um dich für Mitmach-Aktionen einzutragen.');
                      }
                    }}
                    className="dorf-card p-5 flex flex-col items-center justify-center gap-3 active:scale-[0.985] transition-all"
                  >
                    <action.icon className="w-8 h-8 text-[#166534]" />
                    <span className="font-semibold text-sm text-center">{action.label}</span>
                  </button>
                ))}
                <Link
                  href="/geschichte"
                  className="dorf-card p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#166534]/25 bg-[#f0fdf4]/40 active:scale-[0.985] transition-all hover:bg-[#f0fdf4]"
                >
                  <BookOpen className="w-8 h-8 text-[#166534]" aria-hidden />
                  <span className="font-semibold text-sm text-center text-[#14532d]">Geschichte</span>
                </Link>
                {isLoggedIn && isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminTab('news');
                      setShowAdminModal(true);
                    }}
                    className="dorf-card flex flex-col items-center justify-center gap-3 border-2 border-amber-200 bg-amber-50/90 p-5 active:scale-[0.985] transition-all"
                  >
                    <Shield className="h-8 w-8 text-amber-800" />
                    <span className="text-center text-sm font-semibold text-amber-950">Verwaltung</span>
                  </button>
                )}
                <a
                  href="http://frauenweiler.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dorf-card p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#166534]/30 hover:bg-[#f0fdf4] transition-colors"
                >
                  <ExternalLink className="w-8 h-8 text-[#166534]" />
                  <span className="font-semibold text-sm text-center text-[#166534]">Vereins-Website</span>
                </a>
              </div>
            </div>

            {kerweEvent && (
              <KerweSupportPanel
                onContribute={() => {
                  setSelectedEventForContrib(kerweEvent.id);
                  setActiveTab('contribute');
                }}
              />
            )}

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                Dorf & Projekte (extern)
              </h2>
              <p className="text-xs text-[#64748b] mb-3 px-1">
                Kerwe, FW hilft, Hofflohmarkt, Geschichte und mehr – auf der Website des Stadtteilvereins.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/geschichte"
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white border border-[#166534]/35 text-[#14532d] hover:bg-[#f0fdf4]"
                >
                  <BookOpen className="w-3 h-3 shrink-0" aria-hidden />
                  Geschichte (App)
                </Link>
                {[
                  { label: 'Kerwe-Aufruf', href: KERWE_FACEBOOK_URL },
                  { label: 'FW hilft', href: 'http://frauenweiler.org/' },
                  { label: 'Projekte', href: 'http://frauenweiler.org/' },
                  { label: 'Kontakt', href: `mailto:${KERWE_CONTACT_EMAIL}` },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                    rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white border border-zinc-200 text-[#166534] hover:bg-[#f0fdf4]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {nextEventHighlight && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-semibold text-lg">Nächster Termin</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="text-sm text-[#166534] font-medium"
                  >
                    Alle ansehen →
                  </button>
                </div>
                <div className="dorf-card p-5 overflow-hidden">
                  {nextEventHighlight.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={nextEventHighlight.image_url}
                      alt=""
                      className="w-full h-36 object-cover rounded-xl mb-4 -mt-1"
                    />
                  )}
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="event-badge mb-2">{nextEventHighlight.category}</div>
                      <h3 className="font-semibold text-xl">{nextEventHighlight.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#64748b] mt-1">
                        <Clock className="w-4 h-4 shrink-0" />
                        {formatEventDateRange(nextEventHighlight)} ·{' '}
                        {nextEventHighlight.time || '?'} Uhr
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#64748b]">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {nextEventHighlight.location}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-semibold text-[#166534]">{nextEventHighlight.attendees}</div>
                      <div className="text-xs text-[#64748b]">dabei</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#475569] mt-3 line-clamp-3">{nextEventHighlight.description}</p>
                  <button
                    type="button"
                    onClick={() => handleRSVP(nextEventHighlight.id)}
                    className={`dorf-button w-full mt-5 justify-center ${!isLoggedIn ? 'ring-2 ring-amber-200' : ''}`}
                  >
                    <Check className="w-4 h-4" /> {!isLoggedIn ? 'Anmelden zum Zusagen' : 'Ich komme mit!'}
                  </button>
                  {!isLoggedIn && (
                    <p className="text-xs text-center text-[#64748b] mt-2 px-1">
                      Die Teilnahme wird erst nach Anmeldung gezählt.
                    </p>
                  )}
                </div>
              </div>
            )}

            {homeNewsTeaser.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="font-semibold text-lg">Aktuelles</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('news')}
                    className="text-sm text-[#166534] font-medium"
                  >
                    Alle News →
                  </button>
                </div>
                <div className="space-y-3">
                  {homeNewsTeaser.map((item) => (
                    <div
                      key={item.id}
                      className="dorf-card w-full overflow-hidden text-left transition-colors hover:border-[#166534]/40"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveTab('news')}
                        className="w-full p-4 text-left active:bg-zinc-50/80"
                      >
                        {item.important && (
                          <div className="text-xs font-bold text-amber-600 mb-1">WICHTIG</div>
                        )}
                        <div className="font-semibold text-[#0f172a]">{item.title}</div>
                        <p className="text-sm text-[#64748b] mt-1 line-clamp-2">{item.content}</p>
                        <div className="text-xs text-[#94a3b8] mt-2">
                          {item.date} · {item.category}
                        </div>
                      </button>
                      {item.socialLinks.length > 0 && (
                        <div className="border-t border-zinc-100 px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                          <NewsSocialChips links={item.socialLinks} stopLinkPropagation className="flex flex-wrap gap-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[#166534]/25 bg-gradient-to-br from-[#f0fdf4] to-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-[#14532d] flex items-center gap-2">
                    <Handshake className="w-5 h-5" />
                    Frauenweiler hilft
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1 max-w-prose">
                    Kurzfristige Hilfe suchen oder anbieten – ergänzend zum Projekt{' '}
                    <a
                      href="http://frauenweiler.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#166534] underline"
                    >
                      FW hilft
                    </a>{' '}
                    auf der Vereins-Website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('help')}
                  className="dorf-button shrink-0 justify-center px-6"
                >
                  Zur Hilfe-Liste
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold sm:text-2xl">Aktuelle Nachrichten</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('news');
                    setShowAdminModal(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#14532d] sm:self-auto"
                >
                  <Plus className="h-4 w-4" /> News erstellen
                </button>
              )}
            </div>
            <div className="space-y-4">
              {news.map((item) => (
                <article key={item.id} className="dorf-card p-5">
                  {item.important && <div className="text-xs font-bold text-amber-600 mb-1">WICHTIG</div>}
                  <h3 className="text-lg font-semibold sm:text-xl">{item.title}</h3>
                  <p className="text-[#64748b] mt-1 text-sm leading-relaxed">{item.content}</p>
                  <NewsSocialChips links={item.socialLinks} />
                  <div className="text-xs text-[#94a3b8] mt-3">
                    {item.date} • {item.category}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Termine & Veranstaltungen</h2>
              {isAdmin && (
                <button 
                  onClick={() => { setShowAdminModal(true); setAdminTab('event'); }}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-[#166534] text-white hover:bg-[#14532d]"
                >
                  <Plus className="w-4 h-4" /> Neuen Termin
                </button>
              )}
            </div>

            {!isLoggedIn && (
              <div className="mb-6 p-4 rounded-2xl border border-[#166534]/30 bg-[#f0fdf4] text-sm text-[#14532d]">
                <strong className="block mb-1">Termine für alle sichtbar</strong>
                Als Gast kannst du alle Termine und Details lesen. Für „Ich komme mit“ und „Mitbringen / Helfen“ bitte anmelden.
              </div>
            )}

            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="dorf-card p-5">
                  <div className="flex justify-between">
                    <div>
                      <div className="event-badge mb-2">{event.category}</div>
                      <h3 className="font-semibold text-xl">{event.title}</h3>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-mono text-[#166534]">{formatEventDateRange(event, 'dd.MM.')}</div>
                      <div>{event.time} Uhr</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#64748b] my-3">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-4 h-4" />{event.attendees} dabei</div>
                  </div>

                  <p className="text-sm text-[#475569]">{event.description}</p>

                  {isKerweEvent(event) && (
                    <div className="mt-4">
                      <KerweSupportPanel compact onContribute={() => openContributeForEvent(event.id)} />
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button 
                      type="button"
                      onClick={() => handleRSVP(event.id)}
                      className={`flex-1 dorf-button justify-center text-sm py-3 ${!isLoggedIn ? 'ring-2 ring-amber-200' : ''}`}
                    >
                      {!isLoggedIn ? 'Anmelden zum Zusagen' : 'Ich komme mit'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => openContributeForEvent(event.id)}
                      className="flex-1 border border-[#166534] text-[#166534] rounded-2xl py-3 text-sm font-semibold"
                    >
                      Mitbringen / Helfen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === 'polls' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Aktuelle Umfragen</h2>
            {!isLoggedIn && (
              <div className="mb-6 p-4 rounded-2xl border border-[#166534]/30 bg-[#f0fdf4] text-sm text-[#14532d]">
                <strong className="block mb-1">Nur für angemeldete Nutzer</strong>
                Ergebnisse kannst du als Gast mitlesen. Zum Abstimmen bitte oben auf „Anmelden“ tippen oder ein Konto anlegen.
              </div>
            )}
            <div className="space-y-6">
              {polls.map(poll => (
                <div key={poll.id} className="dorf-card p-6">
                  <h3 className="font-semibold text-lg mb-4">{poll.title}</h3>
                  
                  <div className="space-y-3">
                    {poll.options.map((option, index) => {
                      const percentage = Math.round((option.votes / poll.totalVotes) * 100);
                      const voted = poll.userVoted === index;
                      const voteLocked = !!poll.userVoted;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => !voteLocked && handleVote(poll.id, index)}
                          disabled={voteLocked}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${
                            voted ? 'border-[#166534] bg-[#f0fdf4]' : voteLocked ? 'opacity-60 cursor-not-allowed' : isLoggedIn ? 'hover:border-[#166534]/50' : 'hover:border-amber-400/60 border-dashed'
                          }`}
                        >
                          <div className="flex justify-between text-sm mb-1.5">
                            <span>{option.text}</span>
                            <span className="font-mono text-[#166534]">{percentage}%</span>
                          </div>
                          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className="h-2.5 bg-[#166534] transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-[#94a3b8] mt-1">{option.votes} Stimmen</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-center text-[#94a3b8] mt-4">Insgesamt {poll.totalVotes} Stimmen</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTRIBUTE / MITBRINGEN & HELFEN */}
        {activeTab === 'contribute' && (
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">Mitmachen &amp; Helfen</h2>
                <p className="mt-1 text-sm text-[#64748b]">Wähle ein Event und trage dich ein</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('contribution');
                    setNewContribution((prev) => ({
                      ...prev,
                      eventId: selectedEventForContrib ?? '',
                    }));
                    setShowAdminModal(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#14532d] sm:self-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Mitmach-Aufgabe anlegen
                </button>
              )}
            </div>
            {!isLoggedIn && (
              <div className="mb-6 p-4 rounded-2xl border border-amber-200 bg-[#fffbeb] text-sm text-amber-950">
                <strong className="block mb-1">Eintragen nur mit Konto</strong>
                Du kannst Aufgaben und Termine einsehen. Zum Mitmachen bitte anmelden – so bleibt die Zuordnung nachvollziehbar.
              </div>
            )}

            {!selectedEventForContrib ? (
              <div className="space-y-3">
                {events.map(ev => (
                  <button 
                    key={ev.id}
                    onClick={() => setSelectedEventForContrib(ev.id)}
                    className="dorf-card w-full p-5 text-left flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-sm text-[#64748b]">{formatEventDateRange(ev, 'dd. MMMM')}</div>
                    </div>
                    <div className="text-[#166534]">→</div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedEventForContrib(null)} className="text-sm mb-4 text-[#166534]">← Zurück zu allen Events</button>
                
                <div className="dorf-card p-5 mb-6">
                  <h3 className="font-semibold">{selectedEvent?.title}</h3>
                  <p className="text-sm text-[#64748b]">
                    {selectedEvent ? formatEventDateRange(selectedEvent, 'dd. MMMM yyyy') : ''} • {selectedEvent?.location}
                  </p>
                </div>

                {isKerweEvent(selectedEvent) && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
                    <strong className="block text-zinc-950">Kerwe-Unterstützung gesucht</strong>
                    Neben Aufbau und Abbau hilft besonders Sponsoring: Firmen und Privatpersonen können die Kerwe per
                    Spende unterstützen oder Sponsor werden. Kontakt: {' '}
                    <a href={`mailto:${KERWE_CONTACT_EMAIL}`} className="font-semibold underline">
                      {KERWE_CONTACT_EMAIL}
                    </a>
                    .
                  </div>
                )}

                <h4 className="font-medium mb-3 px-1">Mitbringen & Helfen</h4>
                
                {currentContributions.length > 0 ? (
                  currentContributions.map(contrib => {
                    const isFull = contrib.signedUp >= contrib.needed;
                    return (
                      <div key={contrib.id} className="dorf-card p-5 mb-3">
                        <div className="flex justify-between">
                          <div>
                            <span className={`text-xs px-3 py-0.5 rounded-full ${contrib.type === 'mitbringen' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                              {contrib.type === 'mitbringen' ? 'MITBRINGEN' : 'HELFEN'}
                            </span>
                            <div className="mt-2 font-medium">{contrib.description}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div>{contrib.signedUp} / {contrib.needed}</div>
                            <div className="text-[#94a3b8]">benötigt</div>
                          </div>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => handleSignUpContribution(contrib.id)}
                          disabled={isFull}
                          className={`mt-4 w-full py-3 rounded-2xl text-sm font-semibold transition-all ${isFull ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed' : !isLoggedIn ? 'dorf-button ring-2 ring-amber-200' : 'dorf-button'}`}
                        >
                          {isFull ? 'Voll – Danke!' : !isLoggedIn ? 'Anmelden zum Mitmachen' : 'Ich helfe / bringe mit'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-[#64748b]">Für dieses Event sind noch keine Aufgaben angelegt.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* HILFE / FRAUENWEILER HILFT */}
        {activeTab === 'help' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Frauenweiler hilft</h2>
                <p className="text-[#64748b] text-sm mt-1 max-w-prose">
                  Gesuch oder Hilfsangebot – sichtbar für alle im Dorf. Mehr Hintergrund zum Vereinsprojekt{' '}
                  <a
                    href="http://frauenweiler.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#166534] underline"
                  >
                    FW hilft
                  </a>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    promptLogin('Zum Erstellen eines Eintrags bitte anmelden.');
                    return;
                  }
                  setShowNewHelpModal(true);
                }}
                className="dorf-button shrink-0 justify-center text-sm px-4 py-2.5"
              >
                <Plus className="w-4 h-4" /> Neuer Eintrag
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(['all', 'need', 'offer'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHelpFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    helpFilter === f
                      ? 'bg-[#166534] text-white'
                      : 'bg-zinc-100 text-[#64748b] hover:bg-zinc-200'
                  }`}
                >
                  {f === 'all' ? 'Alle' : f === 'need' ? 'Gesuche' : 'Angebote'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredHelp.length === 0 ? (
                <p className="text-center text-[#64748b] py-12">
                  Noch keine offenen Einträge. {isLoggedIn ? 'Lege den ersten an!' : 'Melde dich an, um zu helfen.'}
                </p>
              ) : (
                filteredHelp.map((h) => {
                  const isMine = isLoggedIn && userId === h.userId;
                  return (
                    <div key={h.id} className="dorf-card p-5">
                      <div className="flex justify-between items-start gap-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            h.kind === 'need' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {h.kind === 'need' ? 'GESUCHT' : 'ANGEBOT'}
                        </span>
                        <span className="text-xs text-[#94a3b8] text-right">
                          {mounted
                            ? format(new Date(h.createdAt), 'd. MMM · HH:mm', { locale: de })
                            : ''}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mt-2">{h.title}</h3>
                      <p className="text-sm text-[#64748b] mt-1 whitespace-pre-wrap">{h.description}</p>
                      <div className="text-xs text-[#94a3b8] mt-2">Kategorie: {h.category}</div>
                      {isMine && (
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => void setHelpStatus(h.id, 'done')}
                            className="text-sm px-4 py-2 rounded-xl bg-[#166534] text-white font-medium"
                          >
                            Erledigt
                          </button>
                          <button
                            type="button"
                            onClick={() => void setHelpStatus(h.id, 'cancelled')}
                            className="text-sm px-4 py-2 rounded-xl border border-zinc-200 text-[#64748b]"
                          >
                            Zurückziehen
                          </button>
                        </div>
                      )}
                      {isAdmin && !isMine && (
                        <button
                          type="button"
                          onClick={() => void setHelpStatus(h.id, 'done')}
                          className="mt-4 text-sm text-[#166534] font-medium"
                        >
                          Als Admin schließen
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto">
            {!isLoggedIn ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-zinc-200 rounded-full mx-auto flex items-center justify-center text-[#166534] mb-4">
                    <LogIn className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl font-semibold">Gast-Modus</h2>
                  <p className="text-[#64748b] mt-2 text-sm px-2">
                    Du siehst News und Termine ohne Konto. Zum Zusagen bei Terminen, für Abstimmungen und Mitmach-Einträge ist eine Anmeldung nötig.
                  </p>
                </div>

                <div className="dorf-card p-6 text-sm text-[#475569] space-y-3">
                  <p className="font-medium text-[#0f172a]">Mit Konto kannst du u. a.:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>„Ich komme mit“ bei Terminen bestätigen</li>
                    <li>an Dorf-Umfragen teilnehmen</li>
                    <li>dich bei Mitbring- und Helfer-Aktionen eintragen</li>
                    <li>Gesuche & Hilfsangebote unter „Hilfe“ (Frauenweiler hilft)</li>
                    <li>persönliche Bereiche nutzen, sobald sie freigeschaltet sind</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="mt-8 w-full dorf-button justify-center py-4 text-base"
                >
                  <LogIn className="w-4 h-4" /> Anmelden oder registrieren
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- dynamische Supabase-URL
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#166534] rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-md">
                        {(userName.split(/\s+/).filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()) || '?'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{userName}</h2>
                  <p className="text-sm text-[#64748b] mt-1">
                    {isAdmin ? 'Administrator · DorfApp' : 'Mitglied · DorfApp Frauenweiler'}
                  </p>
                  {isAdmin && (
                    <p className="mx-auto mt-3 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs leading-relaxed text-amber-950">
                      Verwaltung nur für dich sichtbar: <strong>Menü</strong> → „Verwaltung“, die Kachel auf der{' '}
                      <strong>Start</strong>seite oder das <strong>Schild</strong> oben in der Leiste.
                    </p>
                  )}
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                    Persönliche Daten
                  </h3>
                  <div className="dorf-card p-5 space-y-4">
                    <div>
                      <div className="text-xs text-[#94a3b8] mb-1">E-Mail</div>
                      <div className="flex items-start gap-2 text-sm text-[#0f172a]">
                        <Mail className="w-4 h-4 text-[#64748b] shrink-0 mt-0.5" />
                        <span className="break-all">{userEmail ?? '—'}</span>
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-2">
                        Die Anmeldung läuft über diese Adresse. Änderungen nur über den Supabase-Auth-Flow (Passwort zurücksetzen).
                      </p>
                    </div>

                    <div className="border-t border-zinc-100 pt-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs text-[#94a3b8]">Anzeigename</span>
                        {!editingName && (
                          <button
                            type="button"
                            onClick={() => {
                              setDisplayNameDraft(userName);
                              setEditingName(true);
                            }}
                            className="text-xs font-medium text-[#166534] inline-flex items-center gap-1 hover:underline"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                          </button>
                        )}
                      </div>
                      {editingName ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            value={displayNameDraft}
                            onChange={(e) => setDisplayNameDraft(e.target.value)}
                            className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm"
                            placeholder="Vor- und Nachname"
                            maxLength={120}
                          />
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => void saveDisplayName()}
                              disabled={savingName}
                              className="dorf-button text-sm py-2.5 px-4 justify-center disabled:opacity-60"
                            >
                              {savingName ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingName(false)}
                              className="text-sm px-4 py-2.5 rounded-xl border border-zinc-200 text-[#64748b] hover:bg-zinc-50"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium text-[#0f172a]">{userName}</p>
                      )}
                    </div>

                    <div className="border-t border-zinc-100 pt-4 flex justify-between gap-4 text-sm">
                      <span className="text-[#64748b] shrink-0">Profil seit</span>
                      <span className="font-mono text-right text-[#0f172a]">
                        {mounted && profileCreatedAt
                          ? format(new Date(profileCreatedAt), 'd. MMMM yyyy', { locale: de })
                          : '—'}
                      </span>
                    </div>

                    {!useSupabase && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        Demo-Modus: Sobald Supabase in <span className="font-mono">.env.local</span> konfiguriert ist, erscheinen echte Profildaten und Aktivität.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                    Aktivität
                  </h3>
                  <div className="dorf-card p-5 space-y-3 text-sm">
                    {useSupabase && userId && activityCounts === null ? (
                      <div className="flex justify-center py-6 text-[#64748b]">
                        <Loader2 className="w-6 h-6 animate-spin text-[#166534]" aria-hidden />
                      </div>
                    ) : useSupabase && activityCounts ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#64748b]">Mitmach-Einträge</span>
                          <span className="font-semibold tabular-nums">{activityCounts.contributions}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-zinc-100 pt-3">
                          <span className="text-[#64748b]">Umfragen (abgestimmt)</span>
                          <span className="font-semibold tabular-nums">{activityCounts.pollVotes}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[#64748b] text-sm leading-relaxed">
                        {useSupabase
                          ? 'Noch keine Aktivität in der Datenbank – oder Daten werden geladen.'
                          : 'Mit konfiguriertem Supabase werden Mitmach-Einträge und abgegebene Stimmen aus deinem Konto gezählt.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                    Konto &amp; Sicherheit
                  </h3>
                  <div className="dorf-card p-5 space-y-3">
                    <button
                      type="button"
                      onClick={() => void sendPasswordReset()}
                      disabled={sendingReset || !userEmail}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-200 text-sm font-medium text-[#0f172a] hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {sendingReset ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4 text-[#166534]" />
                      )}
                      Passwort zurücksetzen (E-Mail)
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="w-full py-3.5 text-red-600 font-medium border border-red-200 rounded-2xl hover:bg-red-50 text-sm"
                    >
                      Abmelden
                    </button>

                    {useSupabase ? (
                      <div className="border-t border-zinc-200 pt-4">
                        <p className="text-xs font-medium text-[#64748b] mb-2">Konto endgültig löschen</p>
                        <p className="text-xs text-[#64748b] leading-relaxed mb-3">
                          Dein Zugang, Profil, Abstimmungen und Mitmach-Einträge werden entfernt. Öffentliche Inhalte
                          (z. B. Termine), die du erstellt hast, können anonym weiter sichtbar sein.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteAccountPhrase('');
                            setDeleteAccountPassword('');
                            setDeleteAccountEmailConfirm('');
                            setDeleteAccountAuthHint(null);
                            setShowDeleteAccountModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-300 bg-white text-sm font-semibold text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" aria-hidden />
                          Konto löschen …
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[#94a3b8] border-t border-zinc-100 pt-3">
                        Kontolöschung ist im Demo-Modus nicht verfügbar.
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#64748b] leading-relaxed space-y-2 px-1 mb-6 border border-zinc-100 rounded-2xl p-4 bg-zinc-50/80">
                  <p className="font-medium text-[#475569]">Datenschutz &amp; Auskunft</p>
                  <p>
                    Du kannst dein Konto selbst unter „Konto &amp; Sicherheit“ löschen (wenn Supabase und Server-Key
                    konfiguriert sind). Weitere Auskunfts- oder Löschwünsche nach DSGVO kannst du an die Betreuung der
                    DorfApp bzw. den Ortschaftsrat richten.
                  </p>
                </div>

              </>
            )}
          </div>
        )}
      </main>

      {/* Schnellzugriff unten: Daumenreichweite, Rest über Menü */}
      <nav
        className="safe-area-pb fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm"
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-1 px-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold ${
              activeTab === 'home' ? 'bg-[#dcfce7] text-[#14532d]' : 'text-zinc-600 active:bg-zinc-100'
            }`}
          >
            <Home className="h-6 w-6" />
            Start
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold ${
              activeTab === 'events' ? 'bg-[#dcfce7] text-[#14532d]' : 'text-zinc-600 active:bg-zinc-100'
            }`}
          >
            <Calendar className="h-6 w-6" />
            Termine
          </button>
          <button
            type="button"
            onClick={() => setNavDrawerOpen(true)}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold ${
              navDrawerOpen ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-600 active:bg-zinc-100'
            }`}
            aria-expanded={navDrawerOpen}
            aria-label="Menü öffnen"
          >
            <Menu className="h-6 w-6" />
            Menü
          </button>
        </div>
      </nav>

      {/* Konto endgültig löschen */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-8 sm:w-[440px] sm:rounded-3xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 id="delete-account-title" className="text-xl font-semibold text-red-900">
                Konto wirklich löschen?
              </h3>
              <button
                type="button"
                className="text-2xl leading-none text-[#64748b]"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPhrase('');
                  setDeleteAccountPassword('');
                  setDeleteAccountEmailConfirm('');
                  setDeleteAccountAuthHint(null);
                }}
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">
              Dieser Schritt kann nicht rückgängig gemacht werden. Du verlierst den Zugang zur DorfApp mit dieser
              E-Mail-Adresse. Stimmen bei Umfragen und deine Mitmach-Einträge werden mit dem Konto entfernt.
            </p>
            <p className="mt-3 text-xs text-[#64748b]">
              Zur Bestätigung bitte exakt (Großbuchstaben, Leerzeichen):{' '}
              <span className="font-mono font-semibold text-[#0f172a]">{ACCOUNT_DELETE_PHRASE}</span>
            </p>
            <input
              type="text"
              autoComplete="off"
              value={deleteAccountPhrase}
              onChange={(e) => setDeleteAccountPhrase(e.target.value)}
              placeholder={ACCOUNT_DELETE_PHRASE}
              className="mt-2 w-full rounded-2xl border border-zinc-200 px-4 py-3 font-mono text-sm"
            />

            {!deleteAccountAuthHint ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#64748b]">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#166534]" aria-hidden />
                Sicherheitsprüfung …
              </div>
            ) : deleteAccountAuthHint === 'password' ? (
              <div className="mt-4">
                <label htmlFor="delete-account-pw" className="mb-1 block text-xs font-medium text-[#64748b]">
                  Aktuelles Passwort erneut eingeben
                </label>
                <input
                  id="delete-account-pw"
                  type="password"
                  autoComplete="current-password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  placeholder="Passwort"
                />
                <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
                  So stellen wir sicher, dass wirklich du am Gerät bist. Es wird kurz erneut angemeldet, danach wird
                  das Konto entfernt. Meldest du dich nur per Magic Link ohne Passwort? Dann bitte zuerst unter
                  „Passwort zurücksetzen“ ein Passwort setzen.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label htmlFor="delete-account-email" className="mb-1 block text-xs font-medium text-[#64748b]">
                  Anmelde-E-Mail zur Bestätigung (ohne Passwort-Anmeldung, z. B. Google)
                </label>
                <input
                  id="delete-account-email"
                  type="email"
                  autoComplete="email"
                  value={deleteAccountEmailConfirm}
                  onChange={(e) => setDeleteAccountEmailConfirm(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm"
                  placeholder={userEmail ?? 'deine@email.de'}
                />
                <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
                  Du hast kein Passwort für diese App? Dann bestätige die Löschung durch erneutes Eintippen deiner
                  hinterlegten E-Mail-Adresse. (Wenn du lieber ein Passwort setzen möchtest: Profil → Passwort
                  zurücksetzen.)
                </p>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4">
              <p className="text-xs font-semibold text-[#475569]">Alternativ: E-Mail mit Bestätigungs-Link</p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748b]">
                Du erhältst eine E-Mail mit einem einmaligen Link zur Seite „Konto löschen“. Dafür müssen die Supabase
                Edge Functions deployt sein und u. a. <span className="font-mono">RESEND_API_KEY</span>,{' '}
                <span className="font-mono">RESEND_FROM</span> und <span className="font-mono">PUBLIC_SITE_URL</span>{' '}
                als Function-Secrets gesetzt sein.
              </p>
              <button
                type="button"
                disabled={sendingDeleteLink || deletingAccount}
                onClick={() => void requestDeleteLinkByEmail()}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#166534]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#14532d] hover:bg-[#f0fdf4] disabled:opacity-50"
              >
                {sendingDeleteLink ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                )}
                Bestätigungs-Link an E-Mail senden
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={
                  deletingAccount ||
                  deleteAccountPhrase !== ACCOUNT_DELETE_PHRASE ||
                  !deleteAccountAuthHint ||
                  (deleteAccountAuthHint === 'password' && !deleteAccountPassword.trim()) ||
                  (deleteAccountAuthHint === 'email_confirm' &&
                    deleteAccountEmailConfirm.trim().toLowerCase() !== (userEmail ?? '').trim().toLowerCase())
                }
                onClick={() => void handleDeleteAccount()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 sm:flex-1"
              >
                {deletingAccount ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" />}
                Endgültig löschen
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPhrase('');
                  setDeleteAccountPassword('');
                  setDeleteAccountEmailConfirm('');
                  setDeleteAccountAuthHint(null);
                }}
                className="min-h-12 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-[#475569] hover:bg-zinc-50 sm:flex-1"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Neuer Hilfe-Eintrag */}
      {showNewHelpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white w-full sm:w-[440px] rounded-t-3xl sm:rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Handshake className="w-6 h-6 text-[#166534]" /> Neuer Eintrag
              </h3>
              <button type="button" onClick={() => setShowNewHelpModal(false)} className="text-2xl text-[#64748b]">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewHelp((n) => ({ ...n, kind: 'need' }))}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
                    newHelp.kind === 'need' ? 'bg-[#166534] text-white border-[#166534]' : 'border-zinc-200'
                  }`}
                >
                  Gesuch
                </button>
                <button
                  type="button"
                  onClick={() => setNewHelp((n) => ({ ...n, kind: 'offer' }))}
                  className={`flex-1 py-3 rounded-2xl text-sm font-semibold border ${
                    newHelp.kind === 'offer' ? 'bg-[#166534] text-white border-[#166534]' : 'border-zinc-200'
                  }`}
                >
                  Angebot
                </button>
              </div>
              <select
                value={newHelp.category}
                onChange={(e) => setNewHelp((n) => ({ ...n, category: e.target.value }))}
                className="w-full border rounded-2xl px-4 py-3 text-sm"
              >
                {['Sonstiges', 'Fahrdienst', 'Einkauf', 'Garten', 'Technik', 'Kinder', 'Tier'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Kurztitel"
                value={newHelp.title}
                onChange={(e) => setNewHelp((n) => ({ ...n, title: e.target.value }))}
                className="w-full border rounded-2xl px-4 py-3"
                maxLength={120}
              />
              <textarea
                placeholder="Beschreibung – wann, wo, was genau?"
                value={newHelp.description}
                onChange={(e) => setNewHelp((n) => ({ ...n, description: e.target.value }))}
                rows={5}
                className="w-full border rounded-2xl px-4 py-3 resize-y text-sm"
                maxLength={2000}
              />
              <p className="text-xs text-[#94a3b8]">
                Keine sensiblen Daten (Bank, Krankheit im Detail) öffentlich posten. Kontakt am besten über die App / Nachricht.
              </p>
              <button
                type="button"
                disabled={savingHelp}
                onClick={() => void submitNewHelp()}
                className="dorf-button w-full justify-center py-4 disabled:opacity-60"
              >
                {savingHelp ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Veröffentlichen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login / Register Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {isRegisterMode ? 'Registrieren' : 'Anmelden'}
              </h3>
              <button onClick={() => setShowLogin(false)} className="text-[#64748b]">✕</button>
            </div>
            
            <div className="space-y-4">
              {isRegisterMode && (
                <input 
                  type="text" 
                  placeholder="Dein Vor- und Nachname" 
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full border rounded-2xl px-5 py-4" 
                />
              )}
              <input 
                type="email" 
                placeholder="E-Mail-Adresse" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full border rounded-2xl px-5 py-4" 
              />
              <input 
                type="password" 
                placeholder="Passwort" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full border rounded-2xl px-5 py-4" 
              />

              <button 
                onClick={handleLogin}
                disabled={isLoadingAuth}
                className="dorf-button w-full justify-center py-4 text-lg disabled:opacity-70"
              >
                {isLoadingAuth ? 'Bitte warten...' : (isRegisterMode ? 'Registrieren & Anmelden' : 'Anmelden')}
              </button>

              <button 
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="w-full text-sm text-[#166534] py-2"
              >
                {isRegisterMode ? 'Bereits registriert? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
              </button>

              <button onClick={() => setShowLogin(false)} className="w-full py-3 text-sm text-[#64748b]">
                Abbrechen
              </button>
            </div>

            {!useSupabase && (
              <p className="text-xs text-center text-amber-600 mt-4">
                Demo-Modus aktiv. Für echte Auth Supabase-URL & Key in .env.local eintragen.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ADMIN MODAL - Create News, Events, Mitbring/Helfer Tasks */}
      {showAdminModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[100]">
          <div className="bg-white w-full sm:w-[520px] rounded-t-3xl sm:rounded-3xl p-8 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#166534]" /> Admin-Bereich
              </h3>
              <button onClick={() => setShowAdminModal(false)} className="text-2xl text-[#64748b]">×</button>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              {(['news', 'event', 'contribution'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                    adminTab === tab 
                      ? 'border-[#166534] text-[#166534]' 
                      : 'border-transparent text-[#64748b] hover:text-black'
                  }`}
                >
                  {tab === 'news' && 'News erstellen'}
                  {tab === 'event' && 'Termin erstellen'}
                  {tab === 'contribution' && 'Mitbringen / Helfen'}
                </button>
              ))}
            </div>

            {/* NEWS FORM */}
            {adminTab === 'news' && (
              <div className="space-y-4">
                <input 
                  placeholder="Titel der News" 
                  value={newNews.title}
                  onChange={e => setNewNews({...newNews, title: e.target.value})}
                  className="w-full border rounded-2xl px-5 py-3" 
                />
                <textarea 
                  placeholder="Inhalt / Nachricht..." 
                  value={newNews.content}
                  onChange={e => setNewNews({...newNews, content: e.target.value})}
                  rows={4}
                  className="w-full border rounded-2xl px-5 py-3 resize-y" 
                />
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#64748b]">
                    Social / Web (optional, eine vollständige URL pro Zeile)
                  </label>
                  <textarea
                    placeholder={`https://www.instagram.com/p/…\nhttps://www.facebook.com/…`}
                    value={newNews.socialLinksRaw}
                    onChange={(e) => setNewNews({ ...newNews, socialLinksRaw: e.target.value })}
                    rows={3}
                    className="w-full resize-y rounded-2xl border px-5 py-3 text-sm"
                  />
                  <p className="mt-1 text-xs text-[#94a3b8]">
                    Einfach Post-Links von Instagram, Facebook, YouTube usw. einfügen – es werden nur gültige http(s)-URLs übernommen.
                  </p>
                </div>
                <div className="flex gap-3">
                  <select 
                    value={newNews.category} 
                    onChange={e => setNewNews({...newNews, category: e.target.value})}
                    className="flex-1 border rounded-2xl px-4 py-3"
                  >
                    <option>Allgemein</option>
                    <option>Kerwe</option>
                    <option>Verein</option>
                    <option>Feuerwehr</option>
                    <option>Fest</option>
                  </select>
                  <label className="flex items-center gap-2 px-4 border rounded-2xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newNews.important}
                      onChange={e => setNewNews({...newNews, important: e.target.checked})}
                    />
                    Wichtig
                  </label>
                </div>
                <button onClick={createNews} className="dorf-button w-full py-4 mt-2">News veröffentlichen</button>
              </div>
            )}

            {/* EVENT FORM */}
            {adminTab === 'event' && (
              <div className="space-y-4">
                <input placeholder="Titel des Termins" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border rounded-2xl px-5 py-3" />
                <textarea placeholder="Beschreibung..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} className="w-full border rounded-2xl px-5 py-3" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" aria-label="Startdatum" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="border rounded-2xl px-5 py-3" />
                  <input type="date" aria-label="Enddatum optional" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} className="border rounded-2xl px-5 py-3" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="border rounded-2xl px-5 py-3" />
                </div>
                <input placeholder="Ort (z.B. Dorfplatz)" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full border rounded-2xl px-5 py-3" />
                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="w-full border rounded-2xl px-5 py-3">
                  <option>Kerwe</option>
                  <option>Fest</option>
                  <option>Feuerwehr</option>
                  <option>Verein</option>
                  <option>Allgemein</option>
                </select>
                <button onClick={createEvent} className="dorf-button w-full py-4 mt-2">Termin anlegen</button>
              </div>
            )}

            {/* CONTRIBUTION (Mitbringen / Helfen) FORM */}
            {adminTab === 'contribution' && (
              <div className="space-y-4">
                <select 
                  value={newContribution.eventId} 
                  onChange={e => setNewContribution({...newContribution, eventId: e.target.value})}
                  className="w-full border rounded-2xl px-5 py-3"
                >
                  <option value="">Event auswählen...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setNewContribution({...newContribution, type: 'mitbringen'})}
                    className={`flex-1 py-3 rounded-2xl border ${newContribution.type === 'mitbringen' ? 'bg-[#166534] text-white border-[#166534]' : 'bg-white'}`}
                  >
                    Mitbringen
                  </button>
                  <button 
                    onClick={() => setNewContribution({...newContribution, type: 'helfen'})}
                    className={`flex-1 py-3 rounded-2xl border ${newContribution.type === 'helfen' ? 'bg-[#166534] text-white border-[#166534]' : 'bg-white'}`}
                  >
                    Helfen
                  </button>
                </div>

                <input 
                  placeholder="Beschreibung (z.B. Kuchen für 8 Personen)" 
                  value={newContribution.description}
                  onChange={e => setNewContribution({...newContribution, description: e.target.value})}
                  className="w-full border rounded-2xl px-5 py-3" 
                />
                <div>
                  <label className="text-sm text-[#64748b] block mb-1">Benötigte Personen / Mengen</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newContribution.needed}
                    onChange={e => setNewContribution({...newContribution, needed: parseInt(e.target.value) || 1})}
                    className="w-full border rounded-2xl px-5 py-3" 
                  />
                </div>

                <button onClick={createContributionTask} className="dorf-button w-full py-4 mt-2">
                  Aufgabe anlegen
                </button>
              </div>
            )}

            <p className="text-xs text-center text-[#94a3b8] mt-6">
              Änderungen werden {useSupabase ? 'direkt in Supabase' : 'nur lokal (Demo)'} gespeichert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
