-- Script para migrar datos existentes de propiedades
-- 
-- IMPORTANTE: Ejecutar este script DESPUÉS de hacer "npx prisma db push"
-- 
-- Orden de ejecución:
-- 1. npx prisma db push (esto creará las tablas PropertyType y actualizará Property)
-- 2. npx prisma generate (regenerar el cliente de Prisma)
-- 3. Ejecutar este script SQL
-- 4. Opcionalmente, hacer propertyTypeId y ownerId obligatorios en el schema

-- Agregado comentario de verificación de tabla
-- Verificar que la tabla PropertyType existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'PropertyType') THEN
    RAISE EXCEPTION 'La tabla PropertyType no existe. Ejecuta "npx prisma db push" primero.';
  END IF;
END $$;

-- Paso 1: Crear tipos de propiedad por defecto
INSERT INTO "PropertyType" (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'CASA', 'Casa unifamiliar', true, NOW(), NOW()),
  (gen_random_uuid(), 'APARTAMENTO', 'Apartamento o departamento', true, NOW(), NOW()),
  (gen_random_uuid(), 'TERRENO', 'Terreno o lote', true, NOW(), NOW()),
  (gen_random_uuid(), 'LOCAL_COMERCIAL', 'Local comercial', true, NOW(), NOW()),
  (gen_random_uuid(), 'OFICINA', 'Oficina', true, NOW(), NOW()),
  (gen_random_uuid(), 'BODEGA', 'Bodega o almacén', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Paso 2: Crear un propietario por defecto si no existe ninguno
INSERT INTO "Owner" (id, name, email, phone, country, "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Propietario General',
  'propietario@inmobiliaria.com',
  '000-000-0000',
  'Argentina',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Owner" LIMIT 1);

-- Paso 3: Asignar el tipo "CASA" a las propiedades sin tipo
UPDATE "Property"
SET "propertyTypeId" = (SELECT id FROM "PropertyType" WHERE name = 'CASA' LIMIT 1)
WHERE "propertyTypeId" IS NULL;

-- Paso 4: Asignar el primer propietario disponible a las propiedades sin propietario
UPDATE "Property"
SET "ownerId" = (SELECT id FROM "Owner" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

-- Verificar los resultados
SELECT 
  COUNT(*) as total_properties,
  COUNT("propertyTypeId") as properties_with_type,
  COUNT("ownerId") as properties_with_owner
FROM "Property";
