-- Agregar columnas de tracking de usuarios en tabla properties (snake_case)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS updated_by_id TEXT REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS properties_created_by_id_idx ON properties(created_by_id);
CREATE INDEX IF NOT EXISTS properties_updated_by_id_idx ON properties(updated_by_id);

-- Para propiedades existentes sin valor, intentar usar el primer usuario admin disponible
-- (las nuevas propiedades se asignarán automáticamente al usuario activo al crear/editar)
UPDATE properties 
SET updated_by_id = (SELECT id FROM users WHERE role = 'ADMIN' OR role = 'admin' LIMIT 1)
WHERE updated_by_id IS NULL;

UPDATE properties 
SET created_by_id = (SELECT id FROM users WHERE role = 'ADMIN' OR role = 'admin' LIMIT 1)
WHERE created_by_id IS NULL;
