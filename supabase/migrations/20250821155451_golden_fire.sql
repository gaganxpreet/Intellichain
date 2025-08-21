/*
  # Create test users and profiles for IntelliChain

  1. Test Users
    - Create auth users for testing
    - Driver, shipper, and admin users
  
  2. Profiles
    - Link profiles to existing auth users
    - Use provided driver user ID
*/

-- Insert test auth users (these would normally be created through Supabase Auth)
-- Note: In production, users are created through the auth system, not directly in the users table

-- Create test profiles using the provided user ID
INSERT INTO profiles (user_id, email, full_name, phone, role, created_at, updated_at)
VALUES 
  ('14442bd0-d748-471a-af89-cf819da6a13e', 'driver@intelli-chain.com', 'Driver User', '+91 98765 43210', 'driver', now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  updated_at = now();

-- Create additional test profiles if needed
INSERT INTO profiles (id, email, full_name, phone, role, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin@intelli-chain.com', 'Admin User', '+91 98765 43211', 'admin', now(), now()),
  (gen_random_uuid(), 'shipper@intelli-chain.com', 'Shipper User', '+91 98765 43212', 'shipper', now(), now())
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  updated_at = now();

-- Update vehicle instances to use the correct driver profile ID
UPDATE vehicle_instances 
SET driver_id = (
  SELECT id FROM profiles 
  WHERE user_id = '14442bd0-d748-471a-af89-cf819da6a13e' 
  AND role = 'driver'
  LIMIT 1
)
WHERE driver_id IS NULL 
AND type_name IN ('Van', 'Tempo')
AND id LIKE '%NOR%001';