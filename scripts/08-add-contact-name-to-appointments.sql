-- Add contact_name field to appointments table
-- This allows appointments to have either a client_id (existing client) or contact_name (prospect)

ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Make client_id nullable since now we can have contact_name instead
ALTER TABLE appointments 
  ALTER COLUMN client_id DROP NOT NULL;

-- Add a check constraint to ensure either client_id or contact_name is provided
ALTER TABLE appointments
  ADD CONSTRAINT check_client_or_contact 
  CHECK (
    (client_id IS NOT NULL AND contact_name IS NULL) OR
    (client_id IS NULL AND contact_name IS NOT NULL)
  );

-- Add index for contact_name searches
CREATE INDEX IF NOT EXISTS idx_appointments_contact_name ON appointments(contact_name);
