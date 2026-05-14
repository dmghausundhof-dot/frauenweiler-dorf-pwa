'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Vote, Gift, Home, User, Bell, Plus, 
  MapPin, Clock, Heart, Check, LogIn, LogOut, Shield 
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Types
type Tab = 'home' | 'news' | 'events' | 'polls' | 'contribute' | 'profile';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  attendees: number;
  description: string;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string;
  important: boolean;
  date: string;
}

interface Poll {
  id: number;
  title: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  userVoted?: number;
}

interface Contribution {
  id: number;
  eventId: number;
  type: 'mitbringen' | 'helfen';
  description: string;
  needed: number;
  signedUp: number;
}

// Mock Data for Frauenweiler (realistic)
const mockEvents: Event[] = [
  { id: 1, title: "Dorffest Frauenweiler 2026", date: "2026-06-14", time: "14:00", location: "Dorfplatz", category: "Fest", attendees: 87, description: "Unser großes Sommerfest mit Live-Musik, Essen & Trinken für die ganze Familie." },
  { id: 2, title: "Feuerwehrübung & Tag der offenen Tür", date: "2026-05-24", time: "10:00", location: "Feuerwehrhaus", category: "Feuerwehr", attendees: 34, description: "Vorstellung der neuen Drehleiter und Übung für die Jugendfeuerwehr." },
  { id: 3, title: "Ortsverein Sitzung + Grillen", date: "2026-05-20", time: "19:30", location: "Vereinsheim", category: "Verein", attendees: 19, description: "Monatliche Sitzung des Ortsvereins mit anschließendem Grillen." },
];

const mockNews: NewsItem[] = [
  { id: 1, title: "Neue Bank auf dem Dorfplatz", content: "Die neue Sitzbank am Spielplatz ist aufgestellt. Vielen Dank an alle Spender!", category: "Allgemein", important: false, date: "2026-05-12" },
  { id: 2, title: "Kerwe 2026 – Helfer gesucht!", content: "Wir suchen noch Helfer für den Auf- und Abbau der Kerwe. Meldet euch bitte beim Ortsverein.", category: "Verein", important: true, date: "2026-05-10" },
  { id: 3, title: "Straßenfest am 14. Juni", content: "Save the Date! Unser großes Dorffest findet am 14. Juni statt. Mehr Infos folgen.", category: "Fest", important: true, date: "2026-05-08" },
];

const mockPolls: Poll[] = [
  { 
    id: 1, 
    title: "Welche Farbe soll die neue Bank am Dorfplatz haben?", 
    options: [
      { text: "Grün (wie bisher)", votes: 42 },
      { text: "Braun / Holzoptik", votes: 31 },
      { text: "Anthrazit / Modern", votes: 18 }
    ], 
    totalVotes: 91 
  },
  { 
    id: 2, 
    title: "Soll es beim Dorffest ein Kinderprogramm geben?", 
    options: [
      { text: "Ja, mit Hüpfburg & Basteln", votes: 67 },
      { text: "Nur ein kleiner Bereich", votes: 22 },
      { text: "Nein, lieber für alle", votes: 11 }
    ], 
    totalVotes: 100 
  },
];

const mockContributions: Contribution[] = [
  { id: 1, eventId: 1, type: 'mitbringen', description: "Kuchen / Torte für 8 Personen", needed: 6, signedUp: 4 },
  { id: 2, eventId: 1, type: 'mitbringen', description: "Salat oder Nudelsalat", needed: 4, signedUp: 2 },
  { id: 3, eventId: 1, type: 'helfen', description: "Grill bedienen (14–17 Uhr)", needed: 3, signedUp: 3 },
  { id: 4, eventId: 1, type: 'helfen', description: "Aufbau am Freitagabend", needed: 8, signedUp: 5 },
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

  const [selectedEventForContrib, setSelectedEventForContrib] = useState<number | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Admin form states
  const [newNews, setNewNews] = useState({ title: '', content: '', category: 'Allgemein', important: false });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', category: 'Fest' });
  const [newContribution, setNewContribution] = useState({ eventId: '', type: 'mitbringen' as 'mitbringen' | 'helfen', description: '', needed: 1 });
  const [selectedEventForNewContrib, setSelectedEventForNewContrib] = useState('');

  const useSupabase = isSupabaseConfigured();

  // ============================================
  // SUPABASE AUTH + REALTIME
  // ============================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserId(session.user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, is_admin')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserName(profile.name || session.user.email?.split('@')[0] || 'Bewohner');
          setIsAdmin(!!profile.is_admin);
        } else {
          setUserName(session.user.email?.split('@')[0] || 'Bewohner');
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setIsAdmin(false);
        setUserName('Gast');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
  const openContributeForEvent = (eventId: number) => {
    setSelectedEventForContrib(eventId);
    setActiveTab('contribute');
    if (!isLoggedIn) {
      promptLogin('Termin ist ausgewählt – zum Eintragen bei Mitbring- oder Helfer-Aufgaben bitte anmelden.');
    }
  };

  // --- Actions ---
  const handleRSVP = (eventId: number) => {
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

  const handleVote = (pollId: number, optionIndex: number) => {
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

  const handleSignUpContribution = (contribId: number) => {
    if (!isLoggedIn) {
      promptLogin('Zum Eintragen bei Mitbring- oder Helfer-Aufgaben ist ein Konto nötig.');
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
        id: Date.now(),
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
        id: Date.now(),
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
        id: Date.now(),
        eventId: parseInt(newContribution.eventId),
        type: newContribution.type,
        description: newContribution.description,
        needed: newContribution.needed,
        signedUp: 0
      }]);
    }

    toast.success('Mitbring-/Helfer-Aufgabe erfolgreich angelegt!');
    setNewContribution({ eventId: '', type: 'mitbringen', description: '', needed: 1 });
    setShowAdminModal(false);
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
                <MapPin className="w-4 h-4" /> Frauenweiler • Wiesloch
              </div>
              <h1 className="text-4xl font-semibold tracking-tighter">Hallo zusammen! 👋</h1>
              <p className="text-[#64748b] mt-2">Willkommen in deiner DorfApp</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Termine", icon: Calendar, tab: 'events' as Tab },
                { label: "Umfragen", icon: Vote, tab: 'polls' as Tab },
                { label: "News", icon: Bell, tab: 'news' as Tab },
                { label: "Mitmachen", icon: Heart, tab: 'contribute' as Tab },
              ].map((action, i) => (
                <button 
                  key={i}
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
                  <span className="font-semibold">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Upcoming Event Highlight */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-semibold text-lg">Nächster Termin</h2>
                <button onClick={() => setActiveTab('events')} className="text-sm text-[#166534] font-medium">Alle ansehen →</button>
              </div>
              <div className="dorf-card p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="event-badge mb-2">FEST</div>
                    <h3 className="font-semibold text-xl">Dorffest 2026</h3>
                    <div className="flex items-center gap-2 text-sm text-[#64748b] mt-1">
                      <Clock className="w-4 h-4" /> 14. Juni • 14:00 Uhr
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <MapPin className="w-4 h-4" /> Dorfplatz
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-semibold text-[#166534]">{events[0].attendees}</div>
                    <div className="text-xs text-[#64748b]">kommen mit</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleRSVP(1)} 
                  className={`dorf-button w-full mt-5 justify-center ${!isLoggedIn ? 'ring-2 ring-amber-200' : ''}`}
                >
                  <Check className="w-4 h-4" /> {!isLoggedIn ? 'Anmelden zum Zusagen' : 'Ich komme mit!'}
                </button>
                {!isLoggedIn && (
                  <p className="text-xs text-center text-[#64748b] mt-2 px-1">
                    Die Teilnahme am Termin wird erst nach Anmeldung gezählt.
                  </p>
                )}
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
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-[#166534] rounded-full mx-auto flex items-center justify-center text-white text-3xl font-semibold mb-4">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h2 className="text-2xl font-semibold">{userName}</h2>
                  <p className="text-[#64748b]">Mitglied • Frauenweiler</p>
                </div>

                <div className="dorf-card p-6 space-y-4">
                  <div className="flex justify-between py-1">
                    <span>Angemeldet seit</span>
                    <span className="font-mono text-sm">März 2025</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span>Teilnahmen</span>
                    <span className="font-semibold">7</span>
                  </div>
                  <div className="flex justify-between py-1 border-t">
                    <span>Helferstunden</span>
                    <span className="font-semibold">14 Std</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-6">
                    <button 
                      type="button"
                      onClick={() => setShowAdminModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#166534] text-white rounded-2xl font-medium hover:bg-[#14532d]"
                    >
                      <Shield className="w-4 h-4" /> Admin-Bereich öffnen
                    </button>
                    <div className="mt-3 p-4 bg-[#fefce8] border border-yellow-200 rounded-2xl text-sm">
                      <strong>Admin-Modus aktiv</strong><br />
                      Du kannst News, Termine und Mitbring-/Helfer-Aufgaben anlegen.
                    </div>
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleLogout}
                  className="mt-8 w-full py-4 text-red-600 font-medium border border-red-200 rounded-2xl hover:bg-red-50"
                >
                  Abmelden
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation (PWA Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="max-w-2xl mx-auto grid grid-cols-6 text-center text-xs">
          {[
            { id: 'home', label: 'Start', icon: Home },
            { id: 'news', label: 'News', icon: Bell },
            { id: 'events', label: 'Termine', icon: Calendar },
            { id: 'polls', label: 'Abstimmen', icon: Vote },
            { id: 'contribute', label: 'Mitmachen', icon: Heart },
            { id: 'profile', label: 'Profil', icon: User },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`nav-item py-3 ${isActive ? 'active' : 'text-[#64748b]'}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
