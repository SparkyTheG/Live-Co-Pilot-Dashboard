/*
  # Call Memory Snapshots (hour-long context)
  Stores compact "memory" objects generated periodically during a call.

  Table:
    - public.call_memory_snapshots

  Notes:
    - user_id is the owner (auth.users.id)
    - RLS enforces per-user isolation
*/

create table if not exists public.call_memory_snapshots (
  id bigserial primary key,
  session_id uuid not null references public.call_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null default '',
  connection_id text,
  memory_version int not null default 0,
  chunk_char_count int not null default 0,
  memory_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists call_memory_snapshots_session_id_idx on public.call_memory_snapshots(session_id);
create index if not exists call_memory_snapshots_user_id_idx on public.call_memory_snapshots(user_id);
create index if not exists call_memory_snapshots_created_at_idx on public.call_memory_snapshots(created_at desc);

alter table public.call_memory_snapshots enable row level security;

-- call_memory_snapshots policies
drop policy if exists "call_memory_snapshots_select_own" on public.call_memory_snapshots;
create policy "call_memory_snapshots_select_own"
on public.call_memory_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "call_memory_snapshots_insert_own" on public.call_memory_snapshots;
create policy "call_memory_snapshots_insert_own"
on public.call_memory_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

