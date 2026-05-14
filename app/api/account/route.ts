import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Eigenes Auth-Konto löschen (nur der Inhaber des gültigen Access-Tokens).
 * Benötigt SUPABASE_SERVICE_ROLE_KEY (nur Server, nie im Client).
 */
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        error:
          'Kontolöschung ist nicht konfiguriert. Bitte SUPABASE_SERVICE_ROLE_KEY in den Server-Umgebungsvariablen setzen (Vercel / Hosting, nicht im Browser).',
      },
      { status: 503 },
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await admin.auth.getUser(token);

  if (userErr || !user) {
    return NextResponse.json(
      { error: 'Ungültige oder abgelaufene Sitzung. Bitte erneut anmelden und noch einmal versuchen.' },
      { status: 401 },
    );
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);

  if (delErr) {
    console.error('[api/account] deleteUser', delErr);
    return NextResponse.json(
      {
        error:
          delErr.message ||
          'Löschen fehlgeschlagen. Ggf. blockieren noch Datenbank-Referenzen – bitte Support informieren.',
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
