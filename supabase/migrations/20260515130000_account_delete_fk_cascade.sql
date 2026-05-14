-- Referenzen auf auth.users: damit auth.admin.deleteUser() ohne FK-Fehler durchläuft
-- (Profil & Nutzerdaten mit Nutzer entfernen bzw. Ersteller-Felder leeren)

-- profiles: Zeile mit Nutzer-ID entfernen, wenn Auth-User gelöscht wird
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Abstimmungen & Mitmach-Einträge des Nutzers
ALTER TABLE public.poll_votes
  DROP CONSTRAINT IF EXISTS poll_votes_user_id_fkey;

ALTER TABLE public.poll_votes
  ADD CONSTRAINT poll_votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.contribution_signups
  DROP CONSTRAINT IF EXISTS contribution_signups_user_id_fkey;

ALTER TABLE public.contribution_signups
  ADD CONSTRAINT contribution_signups_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Inhalte bleiben erhalten, Ersteller-Referenz wird null
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_created_by_fkey;

ALTER TABLE public.events
  ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.news
  DROP CONSTRAINT IF EXISTS news_created_by_fkey;

ALTER TABLE public.news
  ADD CONSTRAINT news_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.polls
  DROP CONSTRAINT IF EXISTS polls_created_by_fkey;

ALTER TABLE public.polls
  ADD CONSTRAINT polls_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;
