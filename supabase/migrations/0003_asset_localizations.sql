-- Asset localizations (STU-299)
-- Paste into the Supabase dashboard → SQL Editor → Run. Idempotent.
--
-- Aligns asset localized text with the product `localizations` standard:
--   alt_text     { "en": "Logo" }                (locale → string)
--   localizations{ "en": { "altText": "Logo" } } (locale → fields)
-- The top-level `altText` is derived from localizations server-side (mapper).

alter table public.asset
  add column if not exists localizations jsonb not null default '{}'::jsonb;

-- One-time backfill + drop, guarded so the whole script stays re-runnable.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'asset'
      and column_name = 'alt_text'
  ) then
    update public.asset
    set localizations = coalesce(
      (
        select jsonb_object_agg(key, jsonb_build_object('altText', value))
        from jsonb_each_text(alt_text)
        where value is not null and value <> ''
      ),
      '{}'::jsonb
    )
    where alt_text is not null and alt_text <> '{}'::jsonb;

    alter table public.asset drop column alt_text;
  end if;
end $$;
