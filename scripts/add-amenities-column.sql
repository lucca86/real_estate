-- Add amenities column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'amenities';
