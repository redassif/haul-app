-- migrations/001_fit_intelligence.sql
-- Schema additions for fit intelligence MVP.
-- Run in Supabase SQL editor. All changes are additive and idempotent.

-- 1. Creator body + sizing, attached to each haul.
--    Stored on hauls (not a separate creators table) so existing
--    hauls query — .select("*, haul_items(*)") — picks them up
--    with no code change beyond tagging during upload.
alter table public.hauls
  add column if not exists creator_height_cm int
    check (creator_height_cm between 120 and 220),
  add column if not exists creator_usual_size text
    check (creator_usual_size in ('XXS','XS','S','M','L','XL','XXL')),
  add column if not exists creator_build text
    check (creator_build in ('slim','mid','curvy'));

-- 2. Per-item fit tagging.
--    category drives whether length projection applies.
--    fit_style and length_on_creator are the creator's own read of
--    the garment. Later these can be verified from video pose data.
alter table public.haul_items
  add column if not exists category text
    check (category in ('top','bottom','dress','outerwear','shoes','accessory')),
  add column if not exists fit_style text
    check (fit_style in ('slim','regular','relaxed','oversized')),
  add column if not exists length_on_creator text
    check (length_on_creator in ('crop','waist','hip','mid_thigh','knee','midi','maxi'));

-- 3. User profile table. Measurements optional; height+size+build is the
--    minimum for useful projection.
create table if not exists public.user_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  height_cm   int  check (height_cm between 120 and 220),
  usual_size  text check (usual_size in ('XXS','XS','S','M','L','XL','XXL')),
  build       text check (build in ('slim','mid','curvy')),
  bust_cm     int  check (bust_cm  between 60 and 160),
  waist_cm    int  check (waist_cm between 50 and 150),
  hip_cm      int  check (hip_cm   between 60 and 170),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 4. Row-level security — a user only ever touches their own profile.
alter table public.user_profiles enable row level security;

drop policy if exists "read own profile"   on public.user_profiles;
drop policy if exists "insert own profile" on public.user_profiles;
drop policy if exists "update own profile" on public.user_profiles;

create policy "read own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

create policy "insert own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy "update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

-- 5. Auto-update updated_at on writes.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists user_profiles_touch on public.user_profiles;
create trigger user_profiles_touch
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();
