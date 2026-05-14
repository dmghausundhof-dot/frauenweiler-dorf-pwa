import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 1;

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const resendFrom = Deno.env.get('RESEND_FROM') ?? 'DorfApp <onboarding@resend.dev>';
  const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') ?? Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Supabase-Umgebung unvollständig.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!siteUrl) {
    return new Response(
      JSON.stringify({
        error:
          'PUBLIC_SITE_URL (oder SITE_URL) ist nicht gesetzt. Bitte in den Edge-Function-Secrets die öffentliche App-URL eintragen (z. B. https://deine-app.vercel.app).',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (!resendKey) {
    return new Response(
      JSON.stringify({
        error:
          'RESEND_API_KEY fehlt. Bitte in Supabase unter Edge Functions → Secrets einen Resend-API-Key und RESEND_FROM hinterlegen.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Nicht angemeldet.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user?.email) {
    return new Response(JSON.stringify({ error: 'Ungültige Sitzung.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await admin
    .from('account_delete_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('used_at', null);

  const { error: insErr } = await admin.from('account_delete_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  if (insErr) {
    console.error('insert token', insErr);
    return new Response(JSON.stringify({ error: 'Token konnte nicht angelegt werden.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const confirmUrl = `${siteUrl}/konto-loeschen?token=${encodeURIComponent(token)}`;

  const emailText =
    `Hallo,\n\n` +
    `du hast in der DorfApp Frauenweiler die Löschung deines Kontos angefordert.\n\n` +
    `Öffne diesen Link (gültig ca. ${EXPIRY_HOURS} Stunde(n)), um auf der Website fortzufahren:\n\n` +
    `${confirmUrl}\n\n` +
    `Wenn du das nicht warst, ignoriere diese E-Mail.\n\n` +
    `— DorfApp Frauenweiler`;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [user.email],
      subject: 'Kontolöschung bestätigen – DorfApp Frauenweiler',
      text: emailText,
    }),
  });

  if (!resendRes.ok) {
    const t = await resendRes.text();
    console.error('Resend error', resendRes.status, t);
    return new Response(JSON.stringify({ error: 'E-Mail-Versand fehlgeschlagen.', detail: t }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, expiresInHours: EXPIRY_HOURS }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
