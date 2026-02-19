-- Create unified audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  user_id TEXT REFERENCES users(id),
  user_name TEXT,
  user_role TEXT,
  changes JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_created_at ON audit_logs(module, created_at DESC);

-- Migrate existing permissions audit to new system
INSERT INTO audit_logs (
  module,
  action,
  entity_type,
  entity_id,
  user_id,
  changes,
  created_at
)
SELECT 
  'permissions' as module,
  action,
  'permission' as entity_type,
  permission as entity_id,
  changed_by as user_id,
  jsonb_build_object('role', role, 'permission', permission) as changes,
  changed_at as created_at
FROM permissions_audit
ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Unified audit log table for tracking all system changes';
COMMENT ON COLUMN audit_logs.module IS 'System module: users, properties, clients, etc.';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: create, update, delete, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: user, property, client, etc.';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with before/after values';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual information';
