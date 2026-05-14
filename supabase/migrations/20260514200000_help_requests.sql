-- Nachbarschaftshilfe: Gesuch oder Angebot ("Frauenweiler hilft")
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('need', 'offer')),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'Sonstiges',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS help_requests_open_created
  ON public.help_requests (status, created_at DESC);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_requests_select_all"
  ON public.help_requests FOR SELECT USING (true);

CREATE POLICY "help_requests_insert_own"
  ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "help_requests_update_owner_or_admin"
  ON public.help_requests FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

COMMENT ON TABLE public.help_requests IS 'Frauenweiler hilft – Gesuche und Hilfsangebote';
