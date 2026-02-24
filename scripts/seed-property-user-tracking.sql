-- Poblar createdById y updatedById en propiedades existentes que tengan NULL
-- Usa el primer usuario admin (o cualquier usuario activo) disponible

UPDATE "Property"
SET 
  "createdById" = (
    SELECT id FROM "User" 
    WHERE "isActive" = true 
    ORDER BY "createdAt" ASC 
    LIMIT 1
  ),
  "updatedById" = (
    SELECT id FROM "User" 
    WHERE "isActive" = true 
    ORDER BY "createdAt" ASC 
    LIMIT 1
  )
WHERE "createdById" IS NULL OR "updatedById" IS NULL;
