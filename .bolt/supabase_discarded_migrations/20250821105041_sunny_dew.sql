/*
  # Add Admin User

  1. New Admin User
    - Creates admin profile with elevated permissions
    - Email: admin@intelli-chain.com
    - Password: Admin@123456
    - Role: admin

  2. Security
    - Admin can read/write all data
    - Full system access for management
*/

-- Insert admin user into auth.users (this would typically be done through Supabase Auth)
-- For now, we'll create the profile assuming the auth user exists

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
  gen_random_uuid(), -- This should be replaced with actual auth user ID
  'admin@intelli-chain.com',
  'System Administrator',
  '+91 98765 43210',
  'admin',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Add admin policies
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read all shipments"
  ON shipments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all shipments"
  ON shipments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can read all vehicles"
  ON vehicle_instances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all vehicles"
  ON vehicle_instances
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );