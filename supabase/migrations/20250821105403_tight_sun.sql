/*
  # Add Demo Driver Account

  1. New Demo Data
    - Creates a demo driver profile for testing
    - Provides login credentials for driver portal access
  
  2. Security
    - Uses existing RLS policies
    - Demo account has driver role permissions only
*/

-- Insert demo driver profile (this will work with Supabase Auth signup)
INSERT INTO profiles (
  id,
  user_id,
  email,
  full_name,
  phone,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- This will be updated when actual auth user is created
  'driver@intelli-chain.com',
  'Demo Driver',
  '+91 98765 43211',
  'driver',
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  updated_at = now();