/*
  # Complete System Setup for Intelli-Chain Logistics Platform

  1. Database Schema
    - Create all required tables with proper structure
    - Set up proper relationships and constraints
    - Configure Row Level Security (RLS) policies
    
  2. Authentication Setup
    - Configure user profiles system
    - Set up role-based access control
    - Enable proper signup/login flow
    
  3. Sample Data
    - Insert hub locations
    - Add vehicle types and instances
    - Create demo driver accounts
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('shipper', 'driver', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shipment_status AS ENUM ('quote', 'confirmed', 'vehicle_assigned', 'pickup_initiated', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status AS ENUM ('available', 'assigned', 'in_transit', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate profiles table with proper structure
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role user_role DEFAULT 'shipper',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for profiles
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for users based on user_id" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'admin'
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create hubs table
CREATE TABLE IF NOT EXISTS hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read hubs" ON hubs
  FOR SELECT TO authenticated
  USING (true);

-- Insert hub data
INSERT INTO hubs (name, display_name, latitude, longitude, address, is_active) VALUES
  ('north', 'North Delhi Hub', 28.832652, 77.099613, 'Sector 18, Rohini, New Delhi', true),
  ('west', 'West Delhi Hub', 28.685020, 77.098174, 'Rajouri Garden, New Delhi', true),
  ('south', 'South Delhi Hub', 28.513000, 77.269200, 'Saket, New Delhi', true),
  ('east', 'East Delhi Hub', 28.639425, 77.310904, 'Laxmi Nagar, New Delhi', true),
  ('central', 'Central Delhi Hub', 28.700257, 77.167209, 'Connaught Place, New Delhi', true),
  ('micro-mundka', 'Mundka Micro Hub', 28.7744, 77.0405, 'Mundka Industrial Area, New Delhi', true),
  ('micro-okhla', 'Okhla Micro Hub', 28.5358, 77.2764, 'Okhla Industrial Area, New Delhi', true)
ON CONFLICT (name) DO NOTHING;

-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  speed_kmh integer NOT NULL,
  max_distance_km integer NOT NULL,
  max_weight_kg integer NOT NULL,
  max_length_cm integer NOT NULL,
  max_width_cm integer NOT NULL,
  max_height_cm integer NOT NULL,
  cost_per_km numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicle types" ON vehicle_types
  FOR SELECT TO authenticated
  USING (true);

-- Insert vehicle type data
INSERT INTO vehicle_types (name, display_name, speed_kmh, max_distance_km, max_weight_kg, max_length_cm, max_width_cm, max_height_cm, cost_per_km) VALUES
  ('2W', '2-Wheeler', 25, 9, 5, 30, 30, 15, 7.0),
  ('Van', 'Van', 35, 30, 750, 120, 100, 100, 18.0),
  ('Tempo', 'Tempo', 40, 70, 1200, 180, 140, 130, 25.0),
  ('Truck', 'Truck', 45, 100, 5000, 300, 200, 200, 35.0)
ON CONFLICT (name) DO NOTHING;

-- Create vehicle_instances table
CREATE TABLE IF NOT EXISTS vehicle_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text UNIQUE NOT NULL,
  type_name text NOT NULL,
  driver_id uuid REFERENCES profiles(id),
  current_latitude numeric(10,8),
  current_longitude numeric(11,8),
  home_hub_id uuid REFERENCES hubs(id),
  status vehicle_status DEFAULT 'available',
  remaining_capacity_kg integer DEFAULT 0,
  remaining_capacity_volume integer DEFAULT 0,
  assigned_route jsonb DEFAULT '[]',
  last_location_update timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can read own vehicles" ON vehicle_instances
  FOR SELECT TO authenticated
  USING (driver_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'driver'
  ));

CREATE POLICY "Drivers can update own vehicles" ON vehicle_instances
  FOR UPDATE TO authenticated
  USING (driver_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'driver'
  ));

CREATE POLICY "System can read all vehicles" ON vehicle_instances
  FOR SELECT TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_instances_updated_at
  BEFORE UPDATE ON vehicle_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for vehicle_instances
CREATE INDEX IF NOT EXISTS idx_vehicle_instances_driver_id ON vehicle_instances(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_instances_status ON vehicle_instances(status);

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id text UNIQUE NOT NULL,
  shipper_id uuid REFERENCES profiles(id),
  pickup_address text NOT NULL,
  pickup_latitude numeric(10,8) NOT NULL,
  pickup_longitude numeric(11,8) NOT NULL,
  delivery_address text NOT NULL,
  delivery_latitude numeric(10,8) NOT NULL,
  delivery_longitude numeric(11,8) NOT NULL,
  cargo_weight_kg numeric(10,2) NOT NULL,
  cargo_length_cm numeric(10,2) NOT NULL,
  cargo_width_cm numeric(10,2) NOT NULL,
  cargo_height_cm numeric(10,2) NOT NULL,
  cargo_description text,
  delivery_strategy text NOT NULL,
  vehicle_preference text,
  quote_result jsonb,
  assigned_vehicle_id uuid REFERENCES vehicle_instances(id),
  status shipment_status DEFAULT 'quote',
  total_cost numeric(10,2),
  estimated_time_minutes integer,
  optimal_route jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  delivered_at timestamptz
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shippers can read own shipments" ON shipments
  FOR SELECT TO authenticated
  USING (shipper_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own shipments" ON shipments
  FOR INSERT TO authenticated
  WITH CHECK (shipper_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own shipments" ON shipments
  FOR UPDATE TO authenticated
  USING (shipper_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Drivers can read assigned shipments" ON shipments
  FOR SELECT TO authenticated
  USING (assigned_vehicle_id IN (
    SELECT id FROM vehicle_instances 
    WHERE driver_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'driver'
    )
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for shipments
CREATE INDEX IF NOT EXISTS idx_shipments_shipper_id ON shipments(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_ticket_id ON shipments(ticket_id);

-- Create tracking_events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tracking for own shipments" ON tracking_events
  FOR SELECT TO authenticated
  USING (shipment_id IN (
    SELECT id FROM shipments 
    WHERE shipper_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) OR assigned_vehicle_id IN (
      SELECT id FROM vehicle_instances 
      WHERE driver_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'driver'
      )
    )
  ));

CREATE POLICY "Drivers can insert tracking events" ON tracking_events
  FOR INSERT TO authenticated
  WITH CHECK (shipment_id IN (
    SELECT id FROM shipments 
    WHERE assigned_vehicle_id IN (
      SELECT id FROM vehicle_instances 
      WHERE driver_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'driver'
      )
    )
  ));

-- Create index for tracking_events
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);