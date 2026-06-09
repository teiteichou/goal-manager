create table if not exists public.goals (
  id uuid primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;

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

create table if not exists public.notes (
  id uuid primary key,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

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
