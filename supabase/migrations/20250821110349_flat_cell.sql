/*
  # Fix Profiles RLS Policies

  1. Security Updates
    - Drop existing restrictive policies that prevent profile creation
    - Add proper INSERT policy for authenticated users to create their own profiles
    - Add proper SELECT policy for users to read their own profiles
    - Add proper UPDATE policy for users to update their own profiles
    - Ensure admin users can manage all profiles

  2. Changes
    - Allow authenticated users to insert profiles with matching user_id
    - Allow users to read their own profile data
    - Allow users to update their own profile data
    - Maintain admin access to all profiles
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;

-- Create proper INSERT policy for profile creation during signup
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create proper SELECT policy for reading own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Create proper UPDATE policy for updating own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;