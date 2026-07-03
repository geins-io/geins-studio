-- Assets Library mock backend (STU-263)
-- Paste this whole file into the Supabase dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run. Throwaway mock — deleted when the real
-- Management API serves /asset (see docs/domains/assets.md).

-- ── Folder (adjacency list; folder = backend category filter) ────────────────
create table if not exists public.folder (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  parent_id   uuid        references public.folder (id) on delete cascade,
  system      boolean     not null default false, -- locked (Uncategorised/Archived)
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists folder_parent_id_idx on public.folder (parent_id);

-- ── Asset ────────────────────────────────────────────────────────────────────
create table if not exists public.asset (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  type        text        not null
              check (type in ('image','svg','doc','pdf','video','audio','other')),
  folder_id   uuid        references public.folder (id) on delete set null,
  size_bytes  bigint      not null default 0,
  mime        text,
  url         text,
  thumb_url   text,
  description text,
  alt_text    jsonb       not null default '{}'::jsonb,   -- { "en": "...", "sv": "..." }
  tags        text[]      not null default '{}',
  channels    text[]      not null default '{}',
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists asset_folder_id_idx on public.asset (folder_id);
create index if not exists asset_type_idx      on public.asset (type);
create index if not exists asset_tags_idx       on public.asset using gin (tags);

-- keep updated_at fresh on every write
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists asset_set_updated_at on public.asset;
create trigger asset_set_updated_at
  before update on public.asset
  for each row execute function public.set_updated_at();

-- ── RLS: deny the public data API, allow only the server (service_role) ──────
-- Enabling RLS with NO policies blocks the anon/publishable key entirely.
-- The secret (service_role) key used by the Nitro routes bypasses RLS.
alter table public.folder enable row level security;
alter table public.asset  enable row level security;

-- ── Storage buckets (public read so <img src> works with no auth) ────────────
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true), ('asset-thumbnails', 'asset-thumbnails', true)
on conflict (id) do nothing;

-- ── Seed ──────────────────────────────────────────────────────────────────────
-- System folders. "All assets" is a UI concept (no filter) — not a row.
insert into public.folder (id, name, system, sort_order) values
  ('00000000-0000-0000-0000-000000000001', 'Uncategorised', true, 100),
  ('00000000-0000-0000-0000-000000000002', 'Archived',      true, 101)
on conflict (id) do nothing;

-- User folder tree: Marketing > {Campaigns, Social}, Product images, Brand
insert into public.folder (id, name, parent_id, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Marketing',      null, 1),
  ('10000000-0000-0000-0000-000000000002', 'Campaigns',      '10000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000003', 'Social',         '10000000-0000-0000-0000-000000000001', 2),
  ('10000000-0000-0000-0000-000000000004', 'Product images', null, 2),
  ('10000000-0000-0000-0000-000000000005', 'Brand',          null, 3)
on conflict (id) do nothing;

-- Assets across every type. Image thumbs use picsum (no real upload needed to
-- see the grid); non-images get null thumb_url (UI renders a type icon).
insert into public.asset (name, type, folder_id, size_bytes, mime, url, thumb_url, alt_text, tags, channels, created_by) values
  ('hero-spring.jpg',      'image', '10000000-0000-0000-0000-000000000002', 2411724, 'image/jpeg', 'https://picsum.photos/seed/hero-spring/1200/800', 'https://picsum.photos/seed/hero-spring/400/300', '{"en":"Spring campaign hero"}', '{campaign,hero}', '{web}', 'Anna Berg'),
  ('banner-sale.png',      'image', '10000000-0000-0000-0000-000000000002',  845210, 'image/png',  'https://picsum.photos/seed/banner-sale/1200/400', 'https://picsum.photos/seed/banner-sale/400/300', '{"en":"Sale banner"}', '{sale,banner}', '{web,mobile}', 'Anna Berg'),
  ('insta-story-01.jpg',   'image', '10000000-0000-0000-0000-000000000003',  512334, 'image/jpeg', 'https://picsum.photos/seed/insta1/1080/1920', 'https://picsum.photos/seed/insta1/400/300', '{}', '{social,story}', '{}', 'Milo Frost'),
  ('tshirt-classic.jpg',   'image', '10000000-0000-0000-0000-000000000004', 1200450, 'image/jpeg', 'https://picsum.photos/seed/tshirt/900/900', 'https://picsum.photos/seed/tshirt/400/300', '{"en":"Classic t-shirt front"}', '{product,apparel}', '{web}', 'Sara Lind'),
  ('shoe-runner.jpg',      'image', '10000000-0000-0000-0000-000000000004',  980221, 'image/jpeg', 'https://picsum.photos/seed/shoe/900/900', 'https://picsum.photos/seed/shoe/400/300', '{"en":"Runner shoe"}', '{product,footwear}', '{web,mobile}', 'Sara Lind'),
  ('logo-primary.svg',     'svg',   '10000000-0000-0000-0000-000000000005',   14820, 'image/svg+xml', null, null, '{"en":"Primary logo"}', '{logo,brand}', '{web,mobile}', 'Design team'),
  ('icon-set.svg',         'svg',   '10000000-0000-0000-0000-000000000005',   30112, 'image/svg+xml', null, null, '{}', '{icons,brand}', '{}', 'Design team'),
  ('brand-guidelines.pdf', 'pdf',   '10000000-0000-0000-0000-000000000005', 4820331, 'application/pdf', null, null, '{}', '{brand,guidelines}', '{}', 'Design team'),
  ('price-list-q2.pdf',    'pdf',   null,                                    233120, 'application/pdf', null, null, '{}', '{pricing}', '{}', 'Erik Sund'),
  ('product-feed.docx',    'doc',   null,                                    122880, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, null, '{}', '{docs}', '{}', 'Erik Sund'),
  ('campaign-brief.docx',  'doc',   '10000000-0000-0000-0000-000000000001',  98765, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, null, '{}', '{campaign,brief}', '{}', 'Anna Berg'),
  ('promo-teaser.mp4',     'video', '10000000-0000-0000-0000-000000000002',18452330, 'video/mp4', null, null, '{"en":"Promo teaser"}', '{campaign,video}', '{web}', 'Milo Frost'),
  ('jingle.mp3',           'audio', '10000000-0000-0000-0000-000000000003',  842110, 'audio/mpeg', null, null, '{}', '{social,audio}', '{}', 'Milo Frost'),
  ('archive-old-hero.jpg', 'image', '00000000-0000-0000-0000-000000000002', 1988220, 'image/jpeg', 'https://picsum.photos/seed/oldhero/1200/800', 'https://picsum.photos/seed/oldhero/400/300', '{}', '{archived}', '{}', 'Anna Berg'),
  ('misc-notes.txt',       'other', null,                                      2048, 'text/plain', null, null, '{}', '{}', '{}', 'Erik Sund')
on conflict do nothing;
