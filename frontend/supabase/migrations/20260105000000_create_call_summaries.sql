/*
  # Call Summaries Table
  Stores AI-generated conversation summaries (progressive during call, final when call ends)
  
  Notes:
  - One summary per session (upserted)
  - summary_json contains the full AI analysis
  - is_final indicates if this is the final summary (true) or progressive (false)
  - Removed foreign key constraints to avoid dependency issues
*/

create table if not exists public.call_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  user_id uuid not null,
  user_email text not null,
  prospect_type text not null default '',
  summary_json jsonb not null,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists call_summaries_session_id_idx on public.call_summaries(session_id);
create index if not exists call_summaries_user_id_idx on public.call_summaries(user_id);
create index if not exists call_summaries_user_email_idx on public.call_summaries(user_email);
create index if not exists call_summaries_is_final_idx on public.call_summaries(is_final);
create index if not exists call_summaries_updated_at_idx on public.call_summaries(updated_at desc);

alter table public.call_summaries enable row level security;

-- RLS Policies
drop policy if exists "call_summaries_select_own" on public.call_summaries;
create policy "call_summaries_select_own"
on public.call_summaries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "call_summaries_insert_own" on public.call_summaries;
create policy "call_summaries_insert_own"
on public.call_summaries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "call_summaries_update_own" on public.call_summaries;
create policy "call_summaries_update_own"
on public.call_summaries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
