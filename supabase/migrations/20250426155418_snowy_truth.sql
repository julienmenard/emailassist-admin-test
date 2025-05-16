/*
  # Create Edge Function Logs Table

  1. New Tables
    - `edge_function_logs`
      - `id` (uuid, primary key)
      - `function_name` (text)
      - `created_at` (timestamp with time zone)
      - `status` (integer)
      - `method` (text)
      - `url` (text)
      - `execution_time` (integer)
      - `error` (text, nullable)

  2. Security
    - Enable RLS on `edge_function_logs` table
    - Add policy for authenticated users to view logs
*/

CREATE TABLE IF NOT EXISTS edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status integer NOT NULL,
  method text NOT NULL,
  url text NOT NULL,
  execution_time integer NOT NULL,
  error text
);

ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view logs"
  ON edge_function_logs
  FOR SELECT
  TO authenticated
  USING (true);