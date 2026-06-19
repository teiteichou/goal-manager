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
