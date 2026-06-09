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
