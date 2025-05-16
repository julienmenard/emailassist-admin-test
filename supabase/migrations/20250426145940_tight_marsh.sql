/*
  # Create admin users table and insert initial admin

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Initial Data
    - Insert the admin user with provided credentials
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert the admin user
INSERT INTO admin_users (email, password)
VALUES ('julien@emailassist.ai', 'diktej-cupre5-puvxAh')
ON CONFLICT (email) DO NOTHING;