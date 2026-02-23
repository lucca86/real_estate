-- Add updatedById column to properties table for tracking last modifier
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS updated_by_id TEXT;

-- Add foreign key constraint
ALTER TABLE properties 
ADD CONSTRAINT properties_updated_by_id_fkey 
FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS properties_updated_by_id_idx ON properties(updated_by_id);

-- Update existing properties to set updated_by_id same as created_by_id
UPDATE properties 
SET updated_by_id = created_by_id 
WHERE updated_by_id IS NULL;
