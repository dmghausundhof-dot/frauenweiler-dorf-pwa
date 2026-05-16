-- Optionale Enddaten fuer mehrtaegige Veranstaltungen wie die Kerwe.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date DATE;

COMMENT ON COLUMN public.events.end_date IS 'Optionales Enddatum fuer mehrtaegige Veranstaltungen.';
