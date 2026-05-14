-- Einmalige Token für E-Mail-Bestätigung vor Kontolöschung (nur via Service Role / Edge Functions)
CREATE TABLE IF NOT EXISTS public.account_delete_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_delete_tokens_lookup
  ON public.account_delete_tokens (token)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS account_delete_tokens_user_pending
  ON public.account_delete_tokens (user_id)
  WHERE used_at IS NULL;

ALTER TABLE public.account_delete_tokens ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.account_delete_tokens IS 'OTP-Links zur Bestätigung der Kontolöschung; Zugriff nur Service Role (Edge Functions)';
