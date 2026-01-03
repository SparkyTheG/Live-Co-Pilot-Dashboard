/*
  # Add Email + Speaker fields for auditability
  - Allows you to see which email updated settings, and attribute sessions/chunks to email
  - Adds speaker_role to transcript chunks
  - Adds transcript_text snapshot to sessions for easy paragraph reading
*/

-- user_settings: store email for audit/debug (denormalized)
alter table public.user_settings
  add column if not exists user_email text,
  add column if not exists updated_by_email text;

-- call_sessions: store email + rolling transcript snapshot
alter table public.call_sessions
  add column if not exists user_email text,
  add column if not exists transcript_text text not null default '',
  add column if not exists transcript_char_count int not null default 0;

-- call_transcript_chunks: store email + speaker role
alter table public.call_transcript_chunks
  add column if not exists user_email text,
  add column if not exists speaker_role text not null default 'unknown';

-- Optional: basic validation of speaker_role values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'call_transcript_chunks_speaker_role_check'
  ) then
    alter table public.call_transcript_chunks
      add constraint call_transcript_chunks_speaker_role_check
      check (speaker_role in ('closer','prospect','unknown'));
  end if;
end $$;

