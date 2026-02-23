-- Add updatedById column to Property table for tracking last modifier
ALTER TABLE "Property" 
ADD COLUMN IF NOT EXISTS "updatedById" TEXT;

-- Add foreign key constraint
ALTER TABLE "Property" 
ADD CONSTRAINT "Property_updatedById_fkey" 
FOREIGN KEY ("updatedById") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "Property_updatedById_idx" ON "Property"("updatedById");

-- Update existing properties to set updatedById same as createdById
UPDATE "Property" 
SET "updatedById" = "createdById" 
WHERE "updatedById" IS NULL;
