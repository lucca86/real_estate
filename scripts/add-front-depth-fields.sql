-- Add frontSize and depthSize columns to Property table
ALTER TABLE "Property" 
ADD COLUMN IF NOT EXISTS "frontSize" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "depthSize" DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN "Property"."frontSize" IS 'Front size of the property lot in meters';
COMMENT ON COLUMN "Property"."depthSize" IS 'Depth size of the property lot in meters';
