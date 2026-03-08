-- Agregar nuevos campos a la tabla owners
ALTER TABLE owners
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS owner_type TEXT CHECK (owner_type IN ('Propietario', 'Apoderado', 'Intermediario')),
ADD COLUMN IF NOT EXISTS real_estate_agency TEXT;

-- Migrar datos existentes del campo name a first_name
UPDATE owners
SET first_name = name
WHERE first_name IS NULL AND name IS NOT NULL;

-- Hacer first_name obligatorio
ALTER TABLE owners
ALTER COLUMN first_name SET NOT NULL;

-- Actualizar el campo name para que sea la concatenación de first_name y last_name
UPDATE owners
SET name = TRIM(CONCAT(first_name, ' ', COALESCE(last_name, '')))
WHERE first_name IS NOT NULL;
