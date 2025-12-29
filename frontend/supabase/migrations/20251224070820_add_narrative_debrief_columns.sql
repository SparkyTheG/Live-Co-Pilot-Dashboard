/*
  # Add Narrative Debrief Columns
  
  1. Changes
    - Add narrative-based columns for call analysis:
      - `what_went_well` (text) - What the closer did well on the call
      - `what_didnt_go_well` (text) - What could have been handled better
      - `why_outcome` (text) - Why the close happened or didn't happen
      - `system_notes` (text) - Notes for system learning
      - `accuracy_check` (text) - Questions to check system accuracy
    
  2. Notes
    - These columns replace the visible "8 pillar" structure
    - The internal pillar data is still stored for analytics
    - This provides a narrative-driven debrief experience
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_debriefs' AND column_name = 'what_went_well'
  ) THEN
    ALTER TABLE call_debriefs ADD COLUMN what_went_well text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_debriefs' AND column_name = 'what_didnt_go_well'
  ) THEN
    ALTER TABLE call_debriefs ADD COLUMN what_didnt_go_well text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_debriefs' AND column_name = 'why_outcome'
  ) THEN
    ALTER TABLE call_debriefs ADD COLUMN why_outcome text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_debriefs' AND column_name = 'system_notes'
  ) THEN
    ALTER TABLE call_debriefs ADD COLUMN system_notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_debriefs' AND column_name = 'accuracy_check'
  ) THEN
    ALTER TABLE call_debriefs ADD COLUMN accuracy_check text DEFAULT '';
  END IF;
END $$;