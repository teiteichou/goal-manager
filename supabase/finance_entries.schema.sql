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

