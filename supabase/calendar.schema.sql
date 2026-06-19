create table if not exists public.calendar_events (
  id uuid primary key,
  event_date date not null default current_date,
  title text not null default '',
  start_time time not null default '09:00',
  end_time time not null default '10:00',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events
  add column if not exists event_date date,
  add column if not exists title text,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists memo text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.calendar_events
set
  event_date = coalesce(event_date, current_date),
  title = coalesce(title, ''),
  start_time = coalesce(start_time, '09:00'::time),
  end_time = coalesce(end_time, '10:00'::time),
  memo = coalesce(memo, ''),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now());

alter table public.calendar_events
  alter column event_date set not null,
  alter column event_date set default current_date,
  alter column title set not null,
  alter column title set default '',
  alter column start_time set not null,
  alter column start_time set default '09:00',
  alter column end_time set not null,
  alter column end_time set default '10:00',
  alter column memo set not null,
  alter column memo set default '',
  alter column created_at set not null,
  alter column created_at set default now(),
  alter column updated_at set not null,
  alter column updated_at set default now();

alter table public.calendar_events enable row level security;

grant select, insert, update, delete on table public.calendar_events to anon;
grant select, insert, update, delete on table public.calendar_events to authenticated;

drop policy if exists "Allow anonymous calendar event reads" on public.calendar_events;
drop policy if exists "Allow anonymous calendar event inserts" on public.calendar_events;
drop policy if exists "Allow anonymous calendar event updates" on public.calendar_events;
drop policy if exists "Allow anonymous calendar event deletes" on public.calendar_events;

create policy "Allow anonymous calendar event reads"
on public.calendar_events
for select
to anon
using (true);

create policy "Allow anonymous calendar event inserts"
on public.calendar_events
for insert
to anon
with check (true);

create policy "Allow anonymous calendar event updates"
on public.calendar_events
for update
to anon
using (true)
with check (true);

create policy "Allow anonymous calendar event deletes"
on public.calendar_events
for delete
to anon
using (true);
