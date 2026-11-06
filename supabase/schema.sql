-- ============================================================================
-- MIS VECINOS (Córdoba, Argentina) — Complete Production Supabase Schema
-- Project: udewxnhyjuibmloppabi (sa-east-1)
-- Tables: barrios, profiles, posts, post_likes, post_comments, chat_messages
-- ============================================================================

-- 1. Reference Catalog: public.barrios (Córdoba Capital ONLY)
create table if not exists public.barrios (
  id text primary key,
  name text not null,
  zone text not null default 'Córdoba Capital',
  lat double precision not null,
  lng double precision not null
);

grant select on table public.barrios to anon, authenticated;
alter table public.barrios enable row level security;

create policy "Barrios reference catalog is viewable by everyone"
  on public.barrios for select
  to anon, authenticated
  using (true);

insert into public.barrios (id, name, zone, lat, lng) values
  ('nueva-cordoba', 'Nueva Córdoba', 'Zona Centro-Sur', -31.4286, -64.1854),
  ('guemes', 'Güemes', 'Zona Centro-Oeste', -31.4253, -64.1941),
  ('alberdi', 'Alberdi', 'Zona Oeste-Centro', -31.4098, -64.2055),
  ('centro', 'Centro', 'Área Central', -31.4167, -64.1836),
  ('general-paz', 'General Paz', 'Zona Este', -31.4125, -64.1669),
  ('alta-cordoba', 'Alta Córdoba', 'Zona Norte', -31.3914, -64.1850),
  ('cofico', 'Cofico', 'Zona Norte-Centro', -31.3992, -64.1872),
  ('cerro-de-las-rosas', 'Cerro de las Rosas', 'Zona Noroeste', -31.3672, -64.2361),
  ('urca', 'Urca', 'Zona Noroeste', -31.3778, -64.2395),
  ('villa-belgrano', 'Villa Belgrano', 'Zona Noroeste', -31.3539, -64.2611),
  ('san-vicente', 'San Vicente', 'Zona Sudeste', -31.4255, -64.1518),
  ('jardin', 'Jardín', 'Zona Sur', -31.4488, -64.1815),
  ('observatorio', 'Observatorio', 'Zona Suroeste', -31.4265, -64.2022),
  ('alto-alberdi', 'Alto Alberdi', 'Zona Oeste', -31.4112, -64.2248)
on conflict (id) do update set
  name = excluded.name,
  zone = excluded.zone,
  lat = excluded.lat,
  lng = excluded.lng;

-- 2. Neighbor Profiles: public.profiles
create table if not exists public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text unique,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  barrio_id text not null default 'nueva-cordoba' references public.barrios(id) on update cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username_lower on public.profiles (lower(username));
create index if not exists idx_profiles_barrio_id on public.profiles (barrio_id);

grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name, avatar_url, barrio_id)
  values (
    new.id,
    lower(new.email),
    lower(coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    )),
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(nullif(trim(new.raw_user_meta_data->>'barrio_id'), ''), 'nueva-cordoba')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    username = coalesce(excluded.username, public.profiles.username),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    barrio_id = coalesce(excluded.barrio_id, public.profiles.barrio_id),
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Feed Posts: public.posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  barrio_id text not null references public.barrios(id) on update cascade,
  content text not null check (char_length(trim(content)) > 0),
  tag text not null default 'Novedades',
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_barrio_created on public.posts (barrio_id, created_at desc);
create index if not exists idx_posts_user_id on public.posts (user_id);

grant select on table public.posts to anon, authenticated;
grant insert, update, delete on table public.posts to authenticated;
alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Post Likes: public.post_likes
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_likes_post_id_user_id_key unique (post_id, user_id)
);

create index if not exists idx_post_likes_post_id on public.post_likes (post_id);
create index if not exists idx_post_likes_user_id on public.post_likes (user_id);

grant select on table public.post_likes to anon, authenticated;
grant insert, delete on table public.post_likes to authenticated;
alter table public.post_likes enable row level security;

create policy "Post likes are viewable by everyone"
  on public.post_likes for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can like posts"
  on public.post_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authenticated users can unlike posts"
  on public.post_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Post Comments: public.post_comments
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post_created on public.post_comments (post_id, created_at asc);
create index if not exists idx_post_comments_user_id on public.post_comments (user_id);

grant select on table public.post_comments to anon, authenticated;
grant insert, delete on table public.post_comments to authenticated;
alter table public.post_comments enable row level security;

create policy "Post comments are viewable by everyone"
  on public.post_comments for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert comments"
  on public.post_comments for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own comments"
  on public.post_comments for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 6. Barrio Live Chat Messages: public.chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  barrio_id text not null references public.barrios(id) on update cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_barrio_created on public.chat_messages (barrio_id, created_at asc);
create index if not exists idx_chat_messages_user_id on public.chat_messages (user_id);

grant select on table public.chat_messages to anon, authenticated;
grant insert, delete on table public.chat_messages to authenticated;
alter table public.chat_messages enable row level security;

create policy "Chat messages are viewable by everyone"
  on public.chat_messages for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can send chat messages"
  on public.chat_messages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Authors can delete their own chat messages"
  on public.chat_messages for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Enable Realtime on dynamic tables
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;
