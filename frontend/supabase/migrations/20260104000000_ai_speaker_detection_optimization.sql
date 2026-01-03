/*
  # AI Speaker Detection - Simplified Schema
  
  Changes:
  1. Removes speaker_confidence column (not needed, slows down AI)
  2. Adds indexes for speaker-based queries
  3. Updates constraint for AI detection values
  
  The transcript_text on call_sessions will be formatted as:
  
  CLOSER: how many months behind are you on payments
  
  PROSPECT: i think about maybe 3 months
  
  CLOSER: what happened that caused you to fall behind
*/

-- Drop speaker_confidence column if it exists (we don't need it)
alter table public.call_transcript_chunks
  drop column if exists speaker_confidence;

-- Add comment for documentation
comment on column public.call_transcript_chunks.speaker_role is 'AI-detected speaker: closer, prospect, or unknown';

-- Drop old constraint if exists (might have old values)
alter table public.call_transcript_chunks
  drop constraint if exists call_transcript_chunks_speaker_role_check;

-- Add updated constraint with valid values for AI detection
alter table public.call_transcript_chunks
  add constraint call_transcript_chunks_speaker_role_check
  check (speaker_role in ('closer', 'prospect', 'unknown'));

-- Create index for efficient queries by speaker role (useful for analytics)
create index if not exists call_transcript_chunks_speaker_role_idx 
  on public.call_transcript_chunks(speaker_role);

-- Create composite index for session + speaker queries
create index if not exists call_transcript_chunks_session_speaker_idx 
  on public.call_transcript_chunks(session_id, speaker_role);

