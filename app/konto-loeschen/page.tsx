'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2, Home } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ACCOUNT_DELETE_PHRASE } from '@/lib/dorfapp/account-delete';

function KontoLoeschenForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = (searchParams.get('token') ?? '').trim();
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) {
      toast.error('Kein gültiger Link', { description: 'Es fehlt der Parameter token in der URL.' });
      return;
    }
    if (phrase !== ACCOUNT_DELETE_PHRASE) {
      toast.error('Bestätigung fehlt', { description: `Bitte exakt eingeben: ${ACCOUNT_DELETE_PHRASE}` });
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error('Supabase ist nicht konfiguriert.');
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      toast.error('Konfiguration unvollständig.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${url}/functions/v1/complete-account-deletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anon}`,
          apikey: anon,
        },
        body: JSON.stringify({ token, phrase }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      toast.success('Dein Konto wurde gelöscht.', {
        description: 'Du kannst die DorfApp weiter als Gast nutzen oder ein neues Konto anlegen.',
      });
      await supabase.auth.signOut().catch(() => {});
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('Löschen fehlgeschlagen', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-800">
          <Trash2 className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Konto löschen</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Du hast den Bestätigungslink aus der E-Mail geöffnet. Zum Abschluss bitte noch die Phrase eingeben.
        </p>
      </div>

      {!token ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Dieser Link ist unvollständig. Bitte den kompletten Link aus der E-Mail verwenden oder in der DorfApp unter
          Profil einen neuen Link anfordern.
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="konto-del-phrase" className="mb-1 block text-xs font-medium text-zinc-500">
              Bestätigung (exakt, Großbuchstaben)
            </label>
            <input
              id="konto-del-phrase"
              type="text"
              autoComplete="off"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={ACCOUNT_DELETE_PHRASE}
              className="w-full rounded-2xl border border-zinc-200 px-4 py-3 font-mono text-sm"
            />
          </div>
          <button
            type="button"
            disabled={loading || phrase !== ACCOUNT_DELETE_PHRASE}
            onClick={() => void submit()}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" />}
            Konto endgültig löschen
          </button>
        </div>
      )}

      <p className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#166534] hover:underline"
        >
          <Home className="h-4 w-4" aria-hidden />
          Zurück zur DorfApp
        </Link>
      </p>
    </div>
  );
}

export default function KontoLoeschenPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#166534]" aria-hidden />
        </div>
      }
    >
      <KontoLoeschenForm />
    </Suspense>
  );
}
