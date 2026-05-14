import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { ACCOUNT_DELETE_PHRASE } from '../_shared/delete-phrase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { token?: string; phrase?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ungültiger JSON-Body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const phrase = typeof body.phrase === 'string' ? body.phrase.trim() : '';

  if (!token || phrase !== ACCOUNT_DELETE_PHRASE) {
    return new Response(
      JSON.stringify({
        error: 'Ungültige Daten. Bitte Token aus dem Link verwenden und die Bestätigung exakt eingeben.',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server-Konfiguration unvollständig.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();

  const { data: row, error: selErr } = await admin
    .from('account_delete_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle();

  if (selErr || !row) {
    return new Response(JSON.stringify({ error: 'Unbekannter oder ungültiger Link.' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (row.used_at) {
    return new Response(JSON.stringify({ error: 'Dieser Link wurde bereits verwendet.' }), {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (row.expires_at < now) {
    return new Response(JSON.stringify({ error: 'Dieser Link ist abgelaufen. Bitte fordere einen neuen an.' }), {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = row.user_id as string;

  const { error: delErr } = await admin.auth.admin.deleteUser(userId);

  if (delErr) {
    console.error('deleteUser', delErr);
    return new Response(JSON.stringify({ error: delErr.message || 'Löschen fehlgeschlagen.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
