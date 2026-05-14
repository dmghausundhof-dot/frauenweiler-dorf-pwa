'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Users, Vote, Home, User, Bell, Plus,
  MapPin, Clock, Heart, Check, LogIn, Shield,
  Mail, Pencil, KeyRound, Loader2, Save,
  Handshake, ExternalLink,
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

interface Poll {
  id: string;
  title: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  userVoted?: number;
}

const mockEvents: Event[] = [
  { id: '1', title: "Dorffest Frauenweiler 2026", date: "2026-06-14", time: "14:00", location: "Dorfplatz", category: "Fest", attendees: 87, description: "Unser großes Sommerfest mit Live-Musik, Essen & Trinken für die ganze Familie." },
  { id: '2', title: "Feuerwehrübung & Tag der offenen Tür", date: "2026-05-24", time: "10:00", location: "Feuerwehrhaus", category: "Feuerwehr", attendees: 34, description: "Vorstellung der neuen Drehleiter und Übung für die Jugendfeuerwehr." },
  { id: '3', title: "Ortsverein Sitzung + Grillen", date: "2026-05-20", time: "19:30", location: "Vereinsheim", category: "Verein", attendees: 19, description: "Monatliche Sitzung des Ortsvereins mit anschließendem Grillen." },
];

const mockNews: NewsItem[] = [
  { id: '1', title: "Neue Bank auf dem Dorfplatz", content: "Die neue Sitzbank am Spielplatz ist aufgestellt. Vielen Dank an alle Spender!", category: "Allgemein", important: false, date: "2026-05-12" },
  { id: '2', title: "Kerwe 2026 – Helfer gesucht!", content: "Wir suchen noch Helfer für den Auf- und Abbau der Kerwe. Meldet euch bitte beim Ortsverein.", category: "Verein", important: true, date: "2026-05-10" },
  { id: '3', title: "Straßenfest am 14. Juni", content: "Save the Date! Unser großes Dorffest findet am 14. Juni statt. Mehr Infos folgen.", category: "Fest", important: true, date: "2026-05-08" },
];

const mockPolls: Poll[] = [
  {
    id: '1',
    title: "Welche Farbe soll die neue Bank am Dorfplatz haben?",
    options: [
      { text: "Grün (wie bisher)", votes: 42 },
      { text: "Braun / Holzoptik", votes: 31 },
      { text: "Anthrazit / Modern", votes: 18 },
    ],
    totalVotes: 91,
  },
  {
    id: '2',
    title: "Soll es beim Dorffest ein Kinderprogramm geben?",
    options: [
      { text: "Ja, mit Hüpfburg & Basteln", votes: 67 },
      { text: "Nur ein kleiner Bereich", votes: 22 },
      { text: "Nein, lieber für alle", votes: 11 },
    ],
    totalVotes: 100,
  },
];

const mockContributions: Contribution[] = [
  { id: '1', eventId: '1', type: 'mitbringen', description: "Kuchen / Torte für 8 Personen", needed: 6, signedUp: 4 },
  { id: '2', eventId: '1', type: 'mitbringen', description: "Salat oder Nudelsalat", needed: 4, signedUp: 2 },
  { id: '3', eventId: '1', type: 'helfen', description: "Grill bedienen (14–17 Uhr)", needed: 3, signedUp: 3 },
  { id: '4', eventId: '1', type: 'helfen', description: "Aufbau am Freitagabend", needed: 8, signedUp: 5 },
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

  // Admin form states
  const [newNews, setNewNews] = useState({ title: '', content: '', category: 'Allgemein', important: false });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', category: 'Fest' });
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

  // ============================================
  // SUPABASE AUTH + REALTIME
  // ============================================
  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (useSupabase) {
      const { error } = await supabase.from('news').insert({
        title: newNews.title,
        content: newNews.content,
        category: newNews.category,
        important: newNews.important,
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
        date: new Date().toISOString().split('T')[0]
      }, ...prev]);
    }

    toast.success('News erfolgreich erstellt!');
    setNewNews({ title: '', content: '', category: 'Allgemein', important: false });
    setShowAdminModal(false);
    if (useSupabase) await refreshVillageData();
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Titel und Datum sind erforderlich');
      return;
    }

    let imageUrl = '';

    if (useSupabase) {
      const { error } = await supabase.from('events').insert({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
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
        time: newEvent.time || '00:00',
        location: newEvent.location || 'Frauenweiler',
        category: newEvent.category,
        attendees: 0,
        description: newEvent.description
      }]);
    }

    toast.success('Termin erfolgreich erstellt!');
    setNewEvent({ title: '', description: '', date: '', time: '', location: '', category: 'Fest' });
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

  const filteredHelp = useMemo(() => {
    let rows = helpRequests.filter((h) => h.status === 'open');
    if (helpFilter === 'need') rows = rows.filter((h) => h.kind === 'need');
    if (helpFilter === 'offer') rows = rows.filter((h) => h.kind === 'offer');
    return rows;
  }, [helpRequests, helpFilter]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#166534] rounded-2xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-xl tracking-tight">Frauenweiler</div>
              <div className="text-xs text-[#166534] -mt-1">DorfApp</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button 
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200"
              >
                <User className="w-4 h-4" /> {userName.split(' ')[0]}
              </button>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="dorf-button text-sm px-5 py-2"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#166534] px-4 py-1 rounded-full text-sm font-medium mb-3">
                <MapPin className="w-4 h-4" /> Frauenweiler bei Wiesloch
              </div>
              <h1 className="text-4xl font-semibold tracking-tighter">DorfApp Frauenweiler</h1>
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

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                Dorf & Projekte (extern)
              </h2>
              <p className="text-xs text-[#64748b] mb-3 px-1">
                Kerwe, FW hilft, Hofflohmarkt, Geschichte und mehr – auf der Website des Stadtteilvereins.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Kerwe & Feste', 'FW hilft', 'Projekte', 'Kontakt'].map((label) => (
                  <a
                    key={label}
                    href="http://frauenweiler.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-white border border-zinc-200 text-[#166534] hover:bg-[#f0fdf4]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {label}
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
                        {format(new Date(nextEventHighlight.date), 'EEEE, d. MMMM yyyy', { locale: de })} ·{' '}
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
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab('news')}
                      className="dorf-card w-full p-4 text-left hover:border-[#166534]/40 transition-colors"
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
            <h2 className="text-2xl font-semibold mb-6">Aktuelle Nachrichten</h2>
            <div className="space-y-4">
              {news.map(item => (
                <div key={item.id} className="dorf-card p-5">
                  {item.important && <div className="text-xs font-bold text-amber-600 mb-1">WICHTIG</div>}
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-[#64748b] mt-1 text-sm">{item.content}</p>
                  <div className="text-xs text-[#94a3b8] mt-3">{item.date} • {item.category}</div>
                </div>
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
                      <div className="font-mono text-[#166534]">{format(new Date(event.date), 'dd.MM.', { locale: de })}</div>
                      <div>{event.time} Uhr</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#64748b] my-3">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.location}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-4 h-4" />{event.attendees} dabei</div>
                  </div>

                  <p className="text-sm text-[#475569]">{event.description}</p>

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
            <h2 className="text-2xl font-semibold mb-2">Mitmachen & Helfen</h2>
            <p className="text-[#64748b] mb-4">Wähle ein Event und trage dich ein</p>
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
                      <div className="text-sm text-[#64748b]">{format(new Date(ev.date), 'dd. MMMM', { locale: de })}</div>
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
                  <p className="text-sm text-[#64748b]">{selectedEvent?.date} • {selectedEvent?.location}</p>
                </div>

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
                  </div>
                </div>

                <div className="text-xs text-[#64748b] leading-relaxed space-y-2 px-1 mb-6 border border-zinc-100 rounded-2xl p-4 bg-zinc-50/80">
                  <p className="font-medium text-[#475569]">Datenschutz &amp; Kontoende</p>
                  <p>
                    Eine vollständige Selbstbedienung zum Löschen des Kontos ist in dieser App noch nicht eingebaut.
                    Wende dich für Auskunft oder Löschwünsche bitte an die Betreuung der DorfApp bzw. den Ortschaftsrat.
                  </p>
                </div>

                {isAdmin && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-2 px-1">
                      Verwaltung
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAdminModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#166534] text-white rounded-2xl font-medium hover:bg-[#14532d] text-sm"
                    >
                      <Shield className="w-4 h-4" /> Admin-Bereich öffnen
                    </button>
                    <div className="mt-3 p-4 bg-[#fefce8] border border-yellow-200 rounded-2xl text-sm text-[#713f12]">
                      <strong>Admin-Modus aktiv</strong>
                      <br />
                      Du kannst News, Termine und Mitbring-/Helfer-Aufgaben anlegen.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation (PWA Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-pb">
        <div className="max-w-2xl mx-auto flex overflow-x-auto gap-0.5 px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: 'home', label: 'Start', icon: Home },
              { id: 'news', label: 'News', icon: Bell },
              { id: 'events', label: 'Termine', icon: Calendar },
              { id: 'polls', label: 'Abstimmen', icon: Vote },
              { id: 'contribute', label: 'Mitmachen', icon: Heart },
              { id: 'help', label: 'Hilfe', icon: Handshake },
              { id: 'profile', label: 'Profil', icon: User },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  if (!isLoggedIn && item.id === 'contribute') {
                    setSelectedEventForContrib(null);
                    promptLogin('Wähle ein Event und melde dich an, um dich für Mitmach-Aktionen einzutragen.');
                  }
                }}
                className={`nav-item min-w-[3.65rem] shrink-0 py-2.5 px-0.5 ${isActive ? 'active' : 'text-[#64748b]'}`}
              >
                <Icon className="w-5 h-5 mx-auto" />
                <span className="text-[10px] leading-tight mt-0.5 block">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
                <div className="flex gap-3">
                  <select 
                    value={newNews.category} 
                    onChange={e => setNewNews({...newNews, category: e.target.value})}
                    className="flex-1 border rounded-2xl px-4 py-3"
                  >
                    <option>Allgemein</option>
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
                  <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="border rounded-2xl px-5 py-3" />
                  <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="border rounded-2xl px-5 py-3" />
                </div>
                <input placeholder="Ort (z.B. Dorfplatz)" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full border rounded-2xl px-5 py-3" />
                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="w-full border rounded-2xl px-5 py-3">
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
