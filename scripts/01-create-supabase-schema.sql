-- Create all tables for Real Estate Management in Supabase
-- Execute this in Supabase SQL Editor

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS countries CASCADE;

-- Countries table
CREATE TABLE countries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provinces table
CREATE TABLE provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities table
CREATE TABLE cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    province_id TEXT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Neighborhoods table
CREATE TABLE neighborhoods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Types table
CREATE TABLE property_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Owners table
CREATE TABLE owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city_id TEXT REFERENCES cities(id),
    province_id TEXT REFERENCES provinces(id),
    country_id TEXT REFERENCES countries(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city_id TEXT REFERENCES cities(id),
    province_id TEXT REFERENCES provinces(id),
    country_id TEXT REFERENCES countries(id),
    preferred_property_type_id TEXT REFERENCES property_types(id),
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city_id TEXT REFERENCES cities(id),
    province_id TEXT REFERENCES provinces(id),
    country_id TEXT REFERENCES countries(id),
    neighborhood_id TEXT REFERENCES neighborhoods(id),
    property_type_id TEXT NOT NULL REFERENCES property_types(id),
    owner_id TEXT REFERENCES owners(id),
    price DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    area DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spaces INTEGER,
    year_built INTEGER,
    status TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    images TEXT[],
    wordpress_id INTEGER,
    synced_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_provinces_country ON provinces(country_id);
CREATE INDEX idx_cities_province ON cities(province_id);
CREATE INDEX idx_neighborhoods_city ON neighborhoods(city_id);
CREATE INDEX idx_owners_city ON owners(city_id);
CREATE INDEX idx_clients_city ON clients(city_id);
CREATE INDEX idx_properties_city ON properties(city_id);
CREATE INDEX idx_properties_type ON properties(property_type_id);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_property ON appointments(property_id);
CREATE INDEX idx_appointments_date ON appointments(scheduled_date);

-- Enable Row Level Security (RLS)
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role has full access to countries" ON countries FOR ALL USING (true);
CREATE POLICY "Service role has full access to provinces" ON provinces FOR ALL USING (true);
CREATE POLICY "Service role has full access to cities" ON cities FOR ALL USING (true);
CREATE POLICY "Service role has full access to neighborhoods" ON neighborhoods FOR ALL USING (true);
CREATE POLICY "Service role has full access to property_types" ON property_types FOR ALL USING (true);
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (true);
CREATE POLICY "Service role has full access to owners" ON owners FOR ALL USING (true);
CREATE POLICY "Service role has full access to clients" ON clients FOR ALL USING (true);
CREATE POLICY "Service role has full access to properties" ON properties FOR ALL USING (true);
CREATE POLICY "Service role has full access to appointments" ON appointments FOR ALL USING (true);
