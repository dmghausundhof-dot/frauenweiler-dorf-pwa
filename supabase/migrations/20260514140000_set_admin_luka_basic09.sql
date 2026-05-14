-- Admin für bekanntes Konto (nach erfolgreicher Registrierung / E-Mail-Bestätigung)
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE lower(email) = lower('Luka.basic09@googlemail.com')
);
