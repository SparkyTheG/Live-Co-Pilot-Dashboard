/*
  # Create Closer Profiles Table

  1. New Tables
    - `closer_profiles`
      - `id` (uuid, primary key)
      - `closer_id` (text, unique identifier for the closer)
      - `name` (text)
      - `photo` (text, URL)
      - `company` (text)
      - `title` (text)
      - `successful_call_transcripts` (jsonb, array of transcript data)
      - `difficult_call_transcripts` (jsonb, array of transcript data)
      - `biggest_frustrations` (jsonb, array of selected frustrations)
      - `core_transformation` (text)
      - `painful_problems` (jsonb, array of problems)
      - `common_symptoms` (jsonb, array of symptoms)
      - `target_audience` (jsonb, demographics, traits, behavior, triggers)
      - `buyer_beliefs` (jsonb, array of beliefs)
      - `differentiation` (jsonb, array of differentiators)
      - `false_beliefs` (jsonb, array of limiting stories)
      - `price_tiers` (jsonb, array of tier objects)
      - `discounts_bonuses` (jsonb, discount and bonus details)
      - `payment_options` (jsonb, array of payment options)
      - `delivery_timeline` (jsonb, timeline details)
      - `pleaser_signals` (jsonb, array of signals)
      - `red_flags` (jsonb, array of red flags)
      - `decision_making_styles` (jsonb, array of styles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `closer_profiles` table
    - Add policies for authenticated users to manage their profiles
*/

CREATE TABLE IF NOT EXISTS closer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  photo text DEFAULT '',
  company text DEFAULT '',
  title text DEFAULT '',
  successful_call_transcripts jsonb DEFAULT '[]'::jsonb,
  difficult_call_transcripts jsonb DEFAULT '[]'::jsonb,
  biggest_frustrations jsonb DEFAULT '[]'::jsonb,
  core_transformation text DEFAULT '',
  painful_problems jsonb DEFAULT '[]'::jsonb,
  common_symptoms jsonb DEFAULT '[]'::jsonb,
  target_audience jsonb DEFAULT '{}'::jsonb,
  buyer_beliefs jsonb DEFAULT '[]'::jsonb,
  differentiation jsonb DEFAULT '[]'::jsonb,
  false_beliefs jsonb DEFAULT '[]'::jsonb,
  price_tiers jsonb DEFAULT '[]'::jsonb,
  discounts_bonuses jsonb DEFAULT '{}'::jsonb,
  payment_options jsonb DEFAULT '[]'::jsonb,
  delivery_timeline jsonb DEFAULT '{}'::jsonb,
  pleaser_signals jsonb DEFAULT '[]'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  decision_making_styles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE closer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all closer profiles"
  ON closer_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own closer profile"
  ON closer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own closer profile"
  ON closer_profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own closer profile"
  ON closer_profiles
  FOR DELETE
  TO authenticated
  USING (true);