-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Create permissions audit table
CREATE TABLE IF NOT EXISTS permissions_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  action TEXT NOT NULL, -- 'enabled' or 'disabled'
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_role ON permissions_audit(role);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_changed_at ON permissions_audit(changed_at DESC);

-- Insert default permissions for ADMIN (all permissions enabled)
INSERT INTO role_permissions (role, permission, enabled) VALUES
  -- Dashboard
  ('ADMIN', 'dashboard.view', true),
  
  -- Properties
  ('ADMIN', 'properties.view', true),
  ('ADMIN', 'properties.create', true),
  ('ADMIN', 'properties.edit', true),
  ('ADMIN', 'properties.delete', true),
  
  -- Property Types
  ('ADMIN', 'property_types.view', true),
  ('ADMIN', 'property_types.manage', true),
  
  -- Catalog & Map
  ('ADMIN', 'catalog.view', true),
  ('ADMIN', 'map.view', true),
  
  -- Owners
  ('ADMIN', 'owners.view', true),
  ('ADMIN', 'owners.manage', true),
  
  -- Clients
  ('ADMIN', 'clients.view', true),
  ('ADMIN', 'clients.manage', true),
  
  -- Contacts
  ('ADMIN', 'contacts.view', true),
  ('ADMIN', 'contacts.manage', true),
  
  -- Services
  ('ADMIN', 'services.view', true),
  ('ADMIN', 'services.manage', true),
  
  -- Appointments
  ('ADMIN', 'appointments.view', true),
  ('ADMIN', 'appointments.manage', true),
  
  -- Users
  ('ADMIN', 'users.view', true),
  ('ADMIN', 'users.manage', true),
  
  -- Locations
  ('ADMIN', 'locations.view', true),
  ('ADMIN', 'locations.manage', true),
  
  -- Settings & Permissions
  ('ADMIN', 'settings.view', true),
  ('ADMIN', 'permissions.manage', true)

ON CONFLICT (role, permission) DO NOTHING;

-- Insert default permissions for SUPERVISOR
INSERT INTO role_permissions (role, permission, enabled) VALUES
  -- Dashboard
  ('SUPERVISOR', 'dashboard.view', true),
  
  -- Properties
  ('SUPERVISOR', 'properties.view', true),
  ('SUPERVISOR', 'properties.create', true),
  ('SUPERVISOR', 'properties.edit', true),
  ('SUPERVISOR', 'properties.delete', true),
  
  -- Property Types
  ('SUPERVISOR', 'property_types.view', true),
  ('SUPERVISOR', 'property_types.manage', true),
  
  -- Catalog & Map
  ('SUPERVISOR', 'catalog.view', true),
  ('SUPERVISOR', 'map.view', true),
  
  -- Owners
  ('SUPERVISOR', 'owners.view', true),
  ('SUPERVISOR', 'owners.manage', true),
  
  -- Clients
  ('SUPERVISOR', 'clients.view', true),
  ('SUPERVISOR', 'clients.manage', true),
  
  -- Contacts
  ('SUPERVISOR', 'contacts.view', true),
  ('SUPERVISOR', 'contacts.manage', true),
  
  -- Services
  ('SUPERVISOR', 'services.view', true),
  ('SUPERVISOR', 'services.manage', true),
  
  -- Appointments
  ('SUPERVISOR', 'appointments.view', true),
  ('SUPERVISOR', 'appointments.manage', true),
  
  -- Users
  ('SUPERVISOR', 'users.view', true),
  ('SUPERVISOR', 'users.manage', true),
  
  -- Locations
  ('SUPERVISOR', 'locations.view', true),
  ('SUPERVISOR', 'locations.manage', true),
  
  -- Settings & Permissions (NO ACCESS)
  ('SUPERVISOR', 'settings.view', false),
  ('SUPERVISOR', 'permissions.manage', false)

ON CONFLICT (role, permission) DO NOTHING;

-- Insert default permissions for VENDEDOR (Agente Inmobiliario)
INSERT INTO role_permissions (role, permission, enabled) VALUES
  -- Dashboard
  ('VENDEDOR', 'dashboard.view', true),
  
  -- Properties
  ('VENDEDOR', 'properties.view', true),
  ('VENDEDOR', 'properties.create', true),
  ('VENDEDOR', 'properties.edit', true),
  ('VENDEDOR', 'properties.delete', false),
  
  -- Property Types (view only)
  ('VENDEDOR', 'property_types.view', true),
  ('VENDEDOR', 'property_types.manage', false),
  
  -- Catalog & Map
  ('VENDEDOR', 'catalog.view', true),
  ('VENDEDOR', 'map.view', true),
  
  -- Owners (view only)
  ('VENDEDOR', 'owners.view', true),
  ('VENDEDOR', 'owners.manage', false),
  
  -- Clients
  ('VENDEDOR', 'clients.view', true),
  ('VENDEDOR', 'clients.manage', true),
  
  -- Contacts
  ('VENDEDOR', 'contacts.view', true),
  ('VENDEDOR', 'contacts.manage', true),
  
  -- Services (view only)
  ('VENDEDOR', 'services.view', true),
  ('VENDEDOR', 'services.manage', false),
  
  -- Appointments
  ('VENDEDOR', 'appointments.view', true),
  ('VENDEDOR', 'appointments.manage', true),
  
  -- Users (NO ACCESS)
  ('VENDEDOR', 'users.view', false),
  ('VENDEDOR', 'users.manage', false),
  
  -- Locations (view only)
  ('VENDEDOR', 'locations.view', true),
  ('VENDEDOR', 'locations.manage', false),
  
  -- Settings & Permissions (NO ACCESS)
  ('VENDEDOR', 'settings.view', false),
  ('VENDEDOR', 'permissions.manage', false)

ON CONFLICT (role, permission) DO NOTHING;
