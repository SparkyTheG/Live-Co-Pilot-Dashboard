/*
  # AI Speaker Detection Optimization
  
  This migration optimizes the schema for AI-detected speaker roles:
  1. Adds speaker_confidence column to track AI certainty
  2. Adds index for efficient speaker-based queries
  3. Updates constraint to ensure valid AI speaker values
  
  Notes:
  - speaker_role is now AI-detected (closer/prospect/unknown)
  - speaker_confidence stores the AI's confidence (0.0-1.0)
  - conversationHistory is managed server-side, not persisted per-row
*/

-- Add speaker_confidence column for AI detection confidence
alter table public.call_transcript_chunks
  add column if not exists speaker_confidence numeric(3,2) default 0.0;

-- Add comment for documentation
comment on column public.call_transcript_chunks.speaker_role is 'AI-detected speaker: closer, prospect, or unknown';
comment on column public.call_transcript_chunks.speaker_confidence is 'AI confidence in speaker detection (0.0-1.0)';

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

