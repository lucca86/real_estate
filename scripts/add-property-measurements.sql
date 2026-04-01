-- Add missing measurement columns to Property table
ALTER TABLE "Property"
ADD COLUMN IF NOT EXISTS "coveredArea" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "lotFrontage" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "lotDepth" DOUBLE PRECISION;

-- Add comments to columns
COMMENT ON COLUMN "Property"."coveredArea" IS 'Área cubierta en metros cuadrados';
COMMENT ON COLUMN "Property"."lotFrontage" IS 'Frente del lote en metros';
COMMENT ON COLUMN "Property"."lotDepth" IS 'Fondo del lote en metros';
