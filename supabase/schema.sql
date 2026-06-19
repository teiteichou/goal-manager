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

create table if not exists public.finance_entries (
  id uuid primary key,
  title text not null,
  amount numeric not null,
  kind text not null check (kind in ('income', 'expense')),
  category text not null default 'other',
  memo text not null default '',
  entry_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_entries
  add column if not exists category text,
  add column if not exists memo text,
  add column if not exists entry_date timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.finance_entries
set
  category = coalesce(category, 'other'),
  memo = coalesce(memo, ''),
  entry_date = coalesce(entry_date, created_at, now()),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.finance_entries
  alter column title set not null,
  alter column amount set not null,
  alter column kind set not null,
  alter column category set not null,
  alter column category set default 'other',
  alter column memo set not null,
  alter column memo set default '',
  alter column entry_date set not null,
  alter column entry_date set default now(),
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'finance_entries_kind_check'
  ) then
    alter table public.finance_entries
      add constraint finance_entries_kind_check check (kind in ('income', 'expense'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'finance_entries_amount_check'
  ) then
    alter table public.finance_entries
      add constraint finance_entries_amount_check check (amount > 0);
  end if;
end $$;

alter table public.finance_entries enable row level security;

grant select, insert, update, delete on table public.finance_entries to anon;
grant select, insert, update, delete on table public.finance_entries to authenticated;

drop policy if exists "Allow anonymous finance reads" on public.finance_entries;
drop policy if exists "Allow anonymous finance inserts" on public.finance_entries;
drop policy if exists "Allow anonymous finance updates" on public.finance_entries;
drop policy if exists "Allow anonymous finance deletes" on public.finance_entries;

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

create policy "Allow anonymous finance deletes"
on public.finance_entries
for delete
to anon
using (true);

create table if not exists public.code_snippets (
  id uuid primary key,
  title text not null default '',
  language text not null default 'javascript',
  code text not null default '',
  notes text not null default '',
  result text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.code_snippets
  add column if not exists title text,
  add column if not exists language text,
  add column if not exists code text,
  add column if not exists notes text,
  add column if not exists result text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.code_snippets
set
  title = coalesce(title, ''),
  language = case
    when language in ('java', 'oracle', 'react', 'javascript') then language
    else 'javascript'
  end,
  code = coalesce(code, ''),
  notes = coalesce(notes, ''),
  result = coalesce(result, ''),
  created_at = coalesce(created_at, updated_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.code_snippets
  alter column title set not null,
  alter column title set default '',
  alter column language set not null,
  alter column language set default 'javascript',
  alter column code set not null,
  alter column code set default '',
  alter column notes set not null,
  alter column notes set default '',
  alter column result set not null,
  alter column result set default '',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'code_snippets_language_check'
  ) then
    alter table public.code_snippets
      add constraint code_snippets_language_check check (language in ('java', 'oracle', 'react', 'javascript'));
  end if;
end $$;

alter table public.code_snippets enable row level security;

grant select, insert, update, delete on table public.code_snippets to anon;
grant select, insert, update, delete on table public.code_snippets to authenticated;

drop policy if exists "Allow anonymous code snippet reads" on public.code_snippets;
drop policy if exists "Allow anonymous code snippet inserts" on public.code_snippets;
drop policy if exists "Allow anonymous code snippet updates" on public.code_snippets;
drop policy if exists "Allow anonymous code snippet deletes" on public.code_snippets;

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

create policy "Allow anonymous code snippet deletes"
on public.code_snippets
for delete
to anon
using (true);
