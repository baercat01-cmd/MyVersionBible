-- Marks drawn over the scripture text (highlight / underline / box / strike),
-- stored alongside notes so they sync through the same path.
alter table public.mvb_notes
  add column if not exists style text,
  add column if not exists words jsonb;

-- 'mark' joins the existing note kinds.
alter table public.mvb_notes drop constraint if exists mvb_notes_kind_check;
alter table public.mvb_notes
  add constraint mvb_notes_kind_check
  check (kind in ('verse', 'study', 'journal', 'mark'));

alter table public.mvb_notes drop constraint if exists mvb_notes_style_check;
alter table public.mvb_notes
  add constraint mvb_notes_style_check
  check (style is null or style in ('highlight', 'underline', 'box', 'strike'));
