/*
  # Call Sessions + Live Transcript Chunks
  Stores live call sessions and incremental transcript chunks as the call progresses.

  Tables:
    - public.call_sessions
    - public.call_transcript_chunks

  Notes:
    - user_id is the owner (auth.users.id)
    - RLS enforces per-user isolation
*/

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_type text not null default '',
  connection_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists call_sessions_user_id_idx on public.call_sessions(user_id);
create index if not exists call_sessions_updated_at_idx on public.call_sessions(updated_at desc);

create table if not exists public.call_transcript_chunks (
  id bigserial primary key,
  session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  chunk_text text not null,
  chunk_char_count int not null default 0,
  client_ts_ms bigint
);

create index if not exists call_transcript_chunks_session_id_idx on public.call_transcript_chunks(session_id);
create index if not exists call_transcript_chunks_user_id_idx on public.call_transcript_chunks(user_id);
create index if not exists call_transcript_chunks_created_at_idx on public.call_transcript_chunks(created_at desc);

alter table public.call_sessions enable row level security;
alter table public.call_transcript_chunks enable row level security;

-- call_sessions policies
drop policy if exists "call_sessions_select_own" on public.call_sessions;
create policy "call_sessions_select_own"
on public.call_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "call_sessions_insert_own" on public.call_sessions;
create policy "call_sessions_insert_own"
on public.call_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "call_sessions_update_own" on public.call_sessions;
create policy "call_sessions_update_own"
on public.call_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- call_transcript_chunks policies
drop policy if exists "call_transcript_chunks_select_own" on public.call_transcript_chunks;
create policy "call_transcript_chunks_select_own"
on public.call_transcript_chunks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "call_transcript_chunks_insert_own" on public.call_transcript_chunks;
create policy "call_transcript_chunks_insert_own"
on public.call_transcript_chunks
for insert
to authenticated
with check (auth.uid() = user_id);

