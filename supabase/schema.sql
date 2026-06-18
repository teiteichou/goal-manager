create table if not exists public.goals (
  id uuid primary key,
  title text not null default '',
  category text not null default 'day',
  due_date timestamptz not null default now(),
  notes text not null default '',
  reward text not null default '',
  reminder_preset_minutes integer not null default 10,
  status text not null default 'active',
  progress integer not null default 0,
  reviews jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals
  add column if not exists title text,
  add column if not exists category text,
  add column if not exists due_date timestamptz,
  add column if not exists notes text,
  add column if not exists reward text,
  add column if not exists reminder_preset_minutes integer,
  add column if not exists status text,
  add column if not exists progress integer,
  add column if not exists reviews jsonb,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'goals'
      and column_name = 'payload'
  ) then
    execute $migration$
      update public.goals
      set
        title = coalesce(title, payload->>'title', ''),
        category = coalesce(category, payload->>'category', 'day'),
        due_date = coalesce(due_date, nullif(payload->>'dueDate', '')::timestamptz, now()),
        notes = coalesce(notes, payload->>'notes', ''),
        reward = coalesce(reward, payload->>'reward', ''),
        reminder_preset_minutes = coalesce(reminder_preset_minutes, nullif(payload->>'reminderPreset', '')::integer, 10),
        status = coalesce(status, payload->>'status', 'active'),
        progress = coalesce(progress, nullif(payload->>'progress', '')::integer, 0),
        reviews = coalesce(reviews, payload->'reviews', '[]'::jsonb),
        created_at = coalesce(created_at, nullif(payload->>'createdAt', '')::timestamptz, now()),
        updated_at = coalesce(updated_at, now())
    $migration$;
  end if;
end $$;

alter table public.goals
  alter column title set not null,
  alter column title set default '',
  alter column category set not null,
  alter column category set default 'day',
  alter column due_date set not null,
  alter column due_date set default now(),
  alter column notes set not null,
  alter column notes set default '',
  alter column reward set not null,
  alter column reward set default '',
  alter column reminder_preset_minutes set not null,
  alter column reminder_preset_minutes set default 10,
  alter column status set not null,
  alter column status set default 'active',
  alter column progress set not null,
  alter column progress set default 0,
  alter column reviews set not null,
  alter column reviews set default '[]'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

alter table public.goals
  drop column if exists payload;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'goals_category_check'
  ) then
    alter table public.goals
      add constraint goals_category_check check (category in ('long', 'middle', 'day', 'hour', 'minute'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'goals_status_check'
  ) then
    alter table public.goals
      add constraint goals_status_check check (status in ('active', 'done', 'missed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'goals_progress_check'
  ) then
    alter table public.goals
      add constraint goals_progress_check check (progress >= 0 and progress <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'goals_reminder_preset_minutes_check'
  ) then
    alter table public.goals
      add constraint goals_reminder_preset_minutes_check check (reminder_preset_minutes >= 0);
  end if;
end $$;

alter table public.goals enable row level security;

grant select, insert, update, delete on table public.goals to anon;
grant select, insert, update, delete on table public.goals to authenticated;

drop policy if exists "Allow anonymous goal reads" on public.goals;
drop policy if exists "Allow anonymous goal inserts" on public.goals;
drop policy if exists "Allow anonymous goal updates" on public.goals;
drop policy if exists "Allow anonymous goal deletes" on public.goals;

create policy "Allow anonymous goal reads"
on public.goals
for select
to anon
using (true);

create policy "Allow anonymous goal inserts"
on public.goals
for insert
to anon
with check (true);

create policy "Allow anonymous goal updates"
on public.goals
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous goal deletes"
on public.goals
for delete
to anon
using (true);

create table if not exists public.notes (
  id uuid primary key,
  kind text not null default 'idea' check (kind in ('idea', 'study')),
  theme_id text,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "Allow anonymous note reads" on public.notes;
drop policy if exists "Allow anonymous note inserts" on public.notes;
drop policy if exists "Allow anonymous note updates" on public.notes;

create policy "Allow anonymous note reads"
on public.notes
for select
to anon
using (true);

create policy "Allow anonymous note inserts"
on public.notes
for insert
to anon
with check (true);

create policy "Allow anonymous note updates"
on public.notes
for update
to anon
using (true)
with check (true);

create table if not exists public.finance_entries (
  id uuid primary key,
  title text not null,
  amount numeric not null,
  kind text not null check (kind in ('income', 'expense')),
  memo text not null default '',
  entry_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_entries enable row level security;

drop policy if exists "Allow anonymous finance reads" on public.finance_entries;
drop policy if exists "Allow anonymous finance inserts" on public.finance_entries;
drop policy if exists "Allow anonymous finance updates" on public.finance_entries;

create policy "Allow anonymous finance reads"
on public.finance_entries
for select
to anon
using (true);

create policy "Allow anonymous finance inserts"
on public.finance_entries
for insert
to anon
with check (true);

create policy "Allow anonymous finance updates"
on public.finance_entries
for update
to anon
using (true)
with check (true);

create table if not exists public.code_snippets (
  id uuid primary key,
  title text not null,
  language text not null,
  code text not null default '',
  notes text not null default '',
  result text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.code_snippets enable row level security;

drop policy if exists "Allow anonymous code snippet reads" on public.code_snippets;
drop policy if exists "Allow anonymous code snippet inserts" on public.code_snippets;
drop policy if exists "Allow anonymous code snippet updates" on public.code_snippets;

create policy "Allow anonymous code snippet reads"
on public.code_snippets
for select
to anon
using (true);

create policy "Allow anonymous code snippet inserts"
on public.code_snippets
for insert
to anon
with check (true);

create policy "Allow anonymous code snippet updates"
on public.code_snippets
for update
to anon
using (true)
with check (true);
