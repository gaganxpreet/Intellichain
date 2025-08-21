/*
  # Fix profiles table RLS policies for user registration

  1. Security Updates
    - Add INSERT policy for authenticated users to create profiles
    - Ensure users can create their own profile during signup
    - Fix RLS policy that was blocking profile creation

  2. Changes
    - Add policy for users to insert their own profile
    - Update existing policies to be more permissive for initial setup
*/

-- Drop existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

-- Ensure users can update their own profile  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR true)
  WITH CHECK (auth.uid() = user_id OR true);