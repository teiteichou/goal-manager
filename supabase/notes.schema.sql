create table if not exists public.idea_notes (
  id uuid primary key,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.idea_notes
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.idea_notes
set
  title = coalesce(title, ''),
  body = coalesce(body, ''),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.idea_notes
  alter column title set not null,
  alter column title set default '',
  alter column body set not null,
  alter column body set default '',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

create table if not exists public.study_notes (
  id uuid primary key,
  theme_id text not null default 'tool',
  title text not null default '',
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_notes
  add column if not exists theme_id text,
  add column if not exists title text,
  add column if not exists answers jsonb,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.study_notes
set
  theme_id = coalesce(theme_id, 'tool'),
  title = coalesce(title, ''),
  answers = coalesce(answers, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.study_notes
  alter column theme_id set not null,
  alter column theme_id set default 'tool',
  alter column title set not null,
  alter column title set default '',
  alter column answers set not null,
  alter column answers set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

create table if not exists public.paste_notes (
  id uuid primary key,
  title text not null default '',
  body_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paste_notes
  add column if not exists title text,
  add column if not exists body_html text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.paste_notes
set
  title = coalesce(title, ''),
  body_html = coalesce(body_html, ''),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.paste_notes
  alter column title set not null,
  alter column title set default '',
  alter column body_html set not null,
  alter column body_html set default '',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

alter table public.idea_notes enable row level security;
alter table public.study_notes enable row level security;
alter table public.paste_notes enable row level security;

grant select, insert, update, delete on table public.idea_notes to anon;
grant select, insert, update, delete on table public.idea_notes to authenticated;
grant select, insert, update, delete on table public.study_notes to anon;
grant select, insert, update, delete on table public.study_notes to authenticated;
grant select, insert, update, delete on table public.paste_notes to anon;
grant select, insert, update, delete on table public.paste_notes to authenticated;

drop policy if exists "Allow anonymous idea note reads" on public.idea_notes;
drop policy if exists "Allow anonymous idea note inserts" on public.idea_notes;
drop policy if exists "Allow anonymous idea note updates" on public.idea_notes;
drop policy if exists "Allow anonymous idea note deletes" on public.idea_notes;
drop policy if exists "Allow anonymous study note reads" on public.study_notes;
drop policy if exists "Allow anonymous study note inserts" on public.study_notes;
drop policy if exists "Allow anonymous study note updates" on public.study_notes;
drop policy if exists "Allow anonymous study note deletes" on public.study_notes;
drop policy if exists "Allow anonymous paste note reads" on public.paste_notes;
drop policy if exists "Allow anonymous paste note inserts" on public.paste_notes;
drop policy if exists "Allow anonymous paste note updates" on public.paste_notes;
drop policy if exists "Allow anonymous paste note deletes" on public.paste_notes;

create policy "Allow anonymous idea note reads"
on public.idea_notes
for select
to anon
using (true);

create policy "Allow anonymous idea note inserts"
on public.idea_notes
for insert
to anon
with check (true);

create policy "Allow anonymous idea note updates"
on public.idea_notes
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous idea note deletes"
on public.idea_notes
for delete
to anon
using (true);

create policy "Allow anonymous study note reads"
on public.study_notes
for select
to anon
using (true);

create policy "Allow anonymous study note inserts"
on public.study_notes
for insert
to anon
with check (true);

create policy "Allow anonymous study note updates"
on public.study_notes
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous study note deletes"
on public.study_notes
for delete
to anon
using (true);

create policy "Allow anonymous paste note reads"
on public.paste_notes
for select
to anon
using (true);

create policy "Allow anonymous paste note inserts"
on public.paste_notes
for insert
to anon
with check (true);

create policy "Allow anonymous paste note updates"
on public.paste_notes
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous paste note deletes"
on public.paste_notes
for delete
to anon
using (true);
