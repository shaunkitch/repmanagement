-- Minimal Supabase Auth Setup
-- Run this in your Supabase SQL Editor if the full setup didn't work

-- First, let's make sure we have the basic tables
CREATE TABLE IF NOT EXISTS tenants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tenant
INSERT INTO tenants (id, name, subdomain) VALUES 
('11111111-1111-1111-1111-111111111111', 'Acme Field Services', 'acme')
ON CONFLICT (id) DO NOTHING;

-- Create users table (without password_hash since we use Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'field_rep',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create one test user directly in auth.users
-- This is the manual way to create a Supabase auth user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'admin@acme.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

-- Create corresponding user in users table
INSERT INTO users (id, tenant_id, email, first_name, last_name, role) VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'admin@acme.com', 'Admin', 'User', 'admin')
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

-- Create basic work orders table for testing
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    location_address TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample work orders
INSERT INTO work_orders (tenant_id, title, description, location_address, created_by) VALUES 
('11111111-1111-1111-1111-111111111111', 'HVAC Maintenance', 'Routine HVAC check', '123 Main St', '33333333-3333-3333-3333-333333333333'),
('11111111-1111-1111-1111-111111111111', 'Plumbing Repair', 'Fix leaky pipe', '456 Oak Ave', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Setup completed! Try logging in with admin@acme.com / password123' as message;