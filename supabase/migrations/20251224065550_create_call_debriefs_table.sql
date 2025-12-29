/*
  # Create Call Debriefs Table

  1. New Tables
    - `call_debriefs`
      - `id` (uuid, primary key)
      - `closer_id` (text, identifier for the closer)
      - `prospect_type` (text, the type of prospect)
      - `call_date` (timestamptz, when the call happened)
      
      ## 4-Pillar Live Data (from co-pilot)
      - `lubometer` (integer, 0-100 scale)
      - `urgency` (integer, 0-10 scale)
      - `trust` (integer, 0-10 scale)
      - `authority` (integer, 0-10 scale)
      - `structure` (integer, 0-10 scale)
      
      ## 8-Pillar Debrief Data (added in post-call analysis)
      - `perceived_spread` (integer, 0-10 scale) - P1: Meaningful tension to resolve
      - `urgency_pillar` (integer, 0-10 scale) - P2: Real cost to waiting (can duplicate urgency dial)
      - `decisiveness` (integer, 0-10 scale) - P3: Can choose and follow through
      - `available_money` (integer, 0-10 scale) - P4: Resources structurally accessible
      - `responsibility` (integer, 0-10 scale) - P5: Will own outcomes over time
      - `price_sensitivity` (integer, 0-10 scale) - P6: Money creates emotional friction
      - `trust_pillar` (integer, 0-10 scale) - P7: Trust stable enough for exposure (can duplicate trust dial)
      - `risk_tolerance` (integer, 0-10 scale) - P8: Can live with uncertainty
      
      ## Analysis
      - `truth_index_score` (integer, 0-100 calculated coherence score)
      - `collapse_conditions` (jsonb, array of detected incoherences)
      - `hard_no_go_triggered` (boolean, whether any no-go conditions were met)
      - `notes` (text, closer's notes on the call)
      - `outcome` (text, 'closed', 'no-sale-good', 'brutal')
      - `recording_url` (text, optional link to recording)
      
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `call_debriefs` table
    - Add policies for authenticated users to manage their call debriefs
*/

CREATE TABLE IF NOT EXISTS call_debriefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id text NOT NULL DEFAULT '',
  prospect_type text NOT NULL DEFAULT '',
  call_date timestamptz DEFAULT now(),
  
  -- 4-Pillar Live Data
  lubometer integer DEFAULT 50,
  urgency integer DEFAULT 5,
  trust integer DEFAULT 5,
  authority integer DEFAULT 5,
  structure integer DEFAULT 5,
  
  -- 8-Pillar Debrief Data
  perceived_spread integer DEFAULT 5,
  urgency_pillar integer DEFAULT 5,
  decisiveness integer DEFAULT 5,
  available_money integer DEFAULT 5,
  responsibility integer DEFAULT 5,
  price_sensitivity integer DEFAULT 5,
  trust_pillar integer DEFAULT 5,
  risk_tolerance integer DEFAULT 5,
  
  -- Analysis
  truth_index_score integer DEFAULT 50,
  collapse_conditions jsonb DEFAULT '[]'::jsonb,
  hard_no_go_triggered boolean DEFAULT false,
  notes text DEFAULT '',
  outcome text DEFAULT 'pending',
  recording_url text DEFAULT '',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE call_debriefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all call debriefs"
  ON call_debriefs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert call debriefs"
  ON call_debriefs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update call debriefs"
  ON call_debriefs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete call debriefs"
  ON call_debriefs
  FOR DELETE
  TO authenticated
  USING (true);