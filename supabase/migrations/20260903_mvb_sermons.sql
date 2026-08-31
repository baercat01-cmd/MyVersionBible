-- Sermon notes taken as a listener. They ride on the existing notes table —
-- the structure lives in `sections` (speaker, series, place, preached, big
-- idea, outline, words, quotes, application, questions) — so only the kind
-- constraint has to widen.
alter table public.mvb_notes drop constraint if exists mvb_notes_kind_check;
alter table public.mvb_notes
  add constraint mvb_notes_kind_check
  check (kind in ('verse', 'study', 'journal', 'mark', 'sermon'));
