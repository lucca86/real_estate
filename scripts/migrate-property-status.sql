-- Migración de estados de propiedad
-- Este script actualiza los estados antiguos a los nuevos valores del enum PropertyStatus
-- Ejecuta este script ANTES de hacer "npx prisma db push"

-- Agregando verificación de nombre de tabla para manejar case-sensitivity en PostgreSQL

-- Primero, verificar qué tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE 'property';

-- Actualizar DISPONIBLE a ACTIVO (el equivalente más cercano)
-- Intentar con mayúscula primero
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property') THEN
    UPDATE "Property" 
    SET status = 'ACTIVO' 
    WHERE status = 'DISPONIBLE';
    RAISE NOTICE 'Actualizado en tabla "Property"';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property') THEN
    UPDATE property 
    SET status = 'ACTIVO' 
    WHERE status = 'DISPONIBLE';
    RAISE NOTICE 'Actualizado en tabla "property"';
  ELSE
    RAISE EXCEPTION 'No se encontró la tabla Property/property';
  END IF;
END $$;

-- Verificar que no queden propiedades con el estado antiguo
DO $$
DECLARE
  count_disponible INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property') THEN
    SELECT COUNT(*) INTO count_disponible FROM "Property" WHERE status = 'DISPONIBLE';
    RAISE NOTICE 'Propiedades con DISPONIBLE en "Property": %', count_disponible;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property') THEN
    SELECT COUNT(*) INTO count_disponible FROM property WHERE status = 'DISPONIBLE';
    RAISE NOTICE 'Propiedades con DISPONIBLE en "property": %', count_disponible;
  END IF;
END $$;

-- Si el resultado es 0, puedes proceder con "npx prisma db push"
